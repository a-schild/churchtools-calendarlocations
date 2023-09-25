'use strict';

const { ChurchToolsClient, activateLogging } = require('@churchtools/churchtools-client');
const axiosCookieJarSupport = require('axios-cookiejar-support');
const tough = require('tough-cookie');
const fs = require('fs');
const pino = require('pino');


//
// Load config from config.json
//
let rawdata = fs.readFileSync('config.json');
let config = JSON.parse(rawdata);
// Init logger
const logger = pino({
  level: config.log_level
//  level: 'debug'
});


// Main code
const args = require('yargs')
  .scriptName("churchtools-calendarlocations")
  .usage('$0 [args]')
  .help('h')
  .alias('h', 'help')
  .command('hello [name]', 'welcome to churchtools-calendarlocations')
  .option('d',{alias:'debug', describe:"Switch on debug level (Overrides config value)"})
  .option('r',{alias:'resources', describe: "List all resources"})
  .option('c',{alias:'calendars', describe: "List all calendars"})
  .options('dry-run', {describe: "Only show what would be updated"})
  .argv;

if (args.debug) {
    logger.level= "debug";
}

const myCT= new ChurchToolsClient();
myCT.setCookieJar(axiosCookieJarSupport.wrapper, new tough.CookieJar());
myCT.setBaseUrl(config.site_url);
myCT.setUnauthorizedInterceptor(config.auth_token);
activateLogging();

if (args.resources) {
    listResources();
} else if (args.calendars) {
    listCalendars();
} else {
    processAppointsments();
}
function processAppointsments() {

    //myCT.get('/whoami?only_allow_authenticated=true').then(whoAmI => {
    //    console.dir(whoAmI);
    //    console.log(`Hello ${whoAmI.firstName} ${whoAmI.lastName}!`);
    //});

    let calList= [];
    for (let calConfig in config.process_calendars) {
        calList.push(config.process_calendars[calConfig].id);
        //logger.debug("Not found in config: "+config.process_calendars[calConfig].id+" "+all_calendars[cal].id);
    }
    logger.debug("Calendars to process: "+calList);
    const now= new Date();
    let fromDate= addDays(now, 0 - config.past_days);
    let toDate= addDays(now, config.future_days);

    myCT.get('/calendars/appointments', 
                {'calendar_ids': calList, 
                 'from': getISODateStr(fromDate), 
                 'to': getISODateStr(toDate)} ).then(all_appointments => {
        logger.debug('Got '+all_appointments.length+' calendar entries');
        all_appointments.forEach(processCalEntry);
    });
}

function processCalEntry(currentValue, index) {
    if ((currentValue.base.isInternal && config.process_internal_events) ||
            (!currentValue.base.isInternal && config.process_non_internal_events)) {
        logger.trace('Checking: '+index);
        logger.trace(currentValue.base);
        logger.trace(currentValue.base.address);
        if (currentValue.base.address) {
            // Has address entry
            logger.debug('Has address: '+index);
            logger.trace(currentValue.base.address);
        } else {
            logger.trace('Has NO address, check for resources: '+index);
            let startDate= new Date(currentValue.base.startDate);
            let getURL= '/calendars/'+currentValue.base.calendar.id+'/appointments/'+currentValue.base.id+'/'+getISODateStr(startDate);
            logger.trace('Retrieve details from '+getURL);
            myCT.get(getURL).then(all_details => {
                let bookings= all_details.bookings;
                if (bookings.length > 0) {
                    logger.debug("Got details and "+bookings.length+" bookings");
                    let booking1= bookings[0];
                    logger.debug("Booking for resource: "+booking1.base.resource.id);
                    // Now search on config for location details
                    let foundLocation= false;
                    let foundLocationDetails= null;
                    for (let locationIndex in config.locations) {
                        let locationDetail= config.locations[locationIndex];
                        logger.trace("Comparing location with id "+locationDetail.locationID);
                        logger.trace(locationDetail);
                        if (locationDetail.locationID === booking1.base.resource.id) {
                            logger.info('Found location in config '+booking1.base.resource.id);
                            logger.debug(locationDetail);
                            foundLocation= true;
                            foundLocationDetails= locationDetail;
                        } else {
                            // logger.debug(locationDetail);
                        }
                    }
                    if (!foundLocation) {
                        logger.warn("No location found in config for resource id "+booking1.base.resource.id+" "+booking1.base.resource.name);
                    } else {
                        // Now update calendar entry with the location/address
                        logger.info("Updating location from resource id "+booking1.base.resource.id+" in calendar: "+currentValue.base.calendar.id+" bookingID:"+currentValue.base.id);
                        logger.debug(currentValue);
                        let entryURL= '/calendars/'+currentValue.base.calendar.id+'/appointments/'+currentValue.base.id;
                        let jsonText= '{ '+
                                '"meetingAt":"'+foundLocationDetails.meetingAt+'",'+
                                '"street":"'+foundLocationDetails.street+'",'+
                                '"addition": "'+foundLocationDetails.addition+'",'+
                                '"district":"'+foundLocationDetails.district+'",'+
                                '"zip": "'+foundLocationDetails.zip+'",'+
                                '"city": "'+foundLocationDetails.city+'",'+
                                '"country": "'+foundLocationDetails.country+'",'+
                                '"latitude": "'+foundLocationDetails.latitude+'",'+
                                '"longitude": "'+foundLocationDetails.longitude+'"'+
                                '}';
                        const adrObject = JSON.parse(jsonText); 
                        myCT.get(entryURL).then(one_detail => {
                            logger.debug("Updating original object");
                            logger.debug(one_detail);
                            logger.debug("with:");
                            one_detail.appointment.address= adrObject;
                            one_detail.appointment.caption= one_detail.appointment.caption+"."; 
                            logger.debug(one_detail);
                            if (args.dryRun) {
                                logger.info("Dry run, not updating appointment location");
                            } else {
                                myCT.put(entryURL, one_detail.appointment);
                            }
                        });
                    }
                }
            });
        }
    } else {
        logger.info('Not processing: '+index+" appointment is public/private restricted");
        logger.trace(currentValue.base.id);
        logger.trace(currentValue.base);
        logger.trace(currentValue.base.isInternal);
        logger.trace(index);
    }
}

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function listCalendars() {
    myCT.get('/calendars').then(all_calendars => {
        // Loop through all calendars visible for the user
        for (var calIndex in all_calendars) {
            var thisCalendar= all_calendars[calIndex];
            console.log("Calendar id: ["+thisCalendar.id+"] "+thisCalendar.name);
        }
    });
}

function listResources() {
    myCT.get('/resource/masterdata').then(all_masterdata => {
        // Loop through all calendars visible for the user
        logger.debug(all_masterdata);
        for (var typeIndex in all_masterdata.resourceTypes) {
            var thisType= all_masterdata.resourceTypes[typeIndex];
            console.log("Resource type id: ["+thisType.id+"] "+thisType.name);
        }
        for (var resIndex in all_masterdata.resources) {
            var thisResource= all_masterdata.resources[resIndex];
            console.log("Resource id: ["+thisResource.id+"] type: ["+thisResource.resourceTypeId+"] "+thisResource.name);
        }
    });
}

function getISODateStr(inDate) {
    return inDate.toISOString().split('T')[0];
}