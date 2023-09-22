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

const myCT= new ChurchToolsClient();
myCT.setCookieJar(axiosCookieJarSupport.wrapper, new tough.CookieJar());
myCT.setBaseUrl(config.site_url);
myCT.setUnauthorizedInterceptor(config.auth_token);
activateLogging();

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
                    for (let locationID in config.locations) {
                        let locationDetail= config.locations[locationID];
                        logger.debug(locationDetail);
                        if (locationDetail.locationID === booking1.base.resource.id) {
                            logger.debug('Found location in config '+booking1.base.resource.id);
                            logger.debug(locationDetail);
                            foundLocation= true;
                        } else {
                            // logger.debug(locationDetail);
                        }
                    }
                    if (!foundLocation) {
                        logger.warn("No location found in config for resource id "+booking1.base.resource.id);
                    }
                }
            });
        }
    } else {
        logger.info('Not processing: '+index);
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

//myCT.get('/calendars').then(all_calendars => {
//    // Loop through all calendars visible for the user
//    for (var cal in all_calendars) {
//        if (all_calendars.hasOwnProperty(cal)) {
//            let calFound= false;
//            // Check to see if it's one the configured calender from config.json
//            for (let calConfig in config.process_calendars) {
//                if (config.process_calendars[calConfig].id === all_calendars[cal].id) {
//                    //logger.info("Found in config: "+config.process_calendars[calConfig].id);
//                    calFound= true;
//                } else {
//                    //logger.debug("Not found in config: "+config.process_calendars[calConfig].id+" "+all_calendars[cal].id);
//                }
//            }
//            if (calFound) {
//                logger.info('Processing calendar: '+all_calendars[cal].id+' name: '+all_calendars[cal].name+' private: '+all_calendars[cal].isPrivate+" public "+all_calendars[cal].isPublic);
//            } else {
//                logger.debug("Ignoring calender with ID "+cal+" ("+all_calendars[cal].name+")");
//            }
//        }
//    }
//});

function getISODateStr(inDate) {
    return inDate.toISOString().split('T')[0];
}