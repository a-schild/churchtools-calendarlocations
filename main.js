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

myCT.get('/calendars/appointments', {'calendar_ids': calList, 'from': fromDate.toISOString().split('T')[0], 'to': toDate.toISOString().split('T')[0]} ).then(all_appointments => {
    logger.debug('Got '+all_appointments.length+' calendar entries');
    all_appointments.forEach(processCalEntry);
});

function processCalEntry(currentValue, index) {
    if ((currentValue.base.isInternal && config.process_internal_events) ||
            (!currentValue.base.isInternal && config.process_non_internal_events)) {
        logger.debug('Checking: '+index);
        logger.debug(currentValue.base);
        logger.debug(currentValue.base.address);
        if (currentValue.base.address) {
            // Has address entry
            logger.debug('Has address: '+index);
            logger.debug(currentValue.base.address);
        } else {
            logger.debug('Has NO address, check for resources: '+index);
        }
    } else {
        logger.info('Not processing: '+index);
//        logger.debug(currentValue.base.id);
//        logger.debug(currentValue.base);
//        logger.debug(currentValue.base.isInternal);
        //logger.debug(index);
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
