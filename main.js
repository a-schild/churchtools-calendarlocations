const { ChurchToolsClient, activateLogging } = require('@churchtools/churchtools-client');
const axiosCookieJarSupport = require('axios-cookiejar-support');
const tough = require('tough-cookie');
const fs = require('fs');
const pino = require('pino');

// Init logger
const logger = pino({
  level: 'info'
//  level: 'debug'
});

//
// Load config from config.json
//
let rawdata = fs.readFileSync('config.json');
let config = JSON.parse(rawdata);

const myCT= new ChurchToolsClient();
myCT.setCookieJar(axiosCookieJarSupport.wrapper, new tough.CookieJar());
myCT.setBaseUrl(config.site_url);
myCT.setUnauthorizedInterceptor(config.auth_token);
activateLogging();

//myCT.get('/whoami?only_allow_authenticated=true').then(whoAmI => {
//    console.dir(whoAmI);
//    console.log(`Hello ${whoAmI.firstName} ${whoAmI.lastName}!`);
//});

myCT.get('/calendars').then(all_calendars => {
    // Loop through all calendars visible for the user
    for (var cal in all_calendars) {
        if (all_calendars.hasOwnProperty(cal)) {
            let calFound= false;
            // Check to see if it's one the configured calender from config.json
            for (let calConfig in config.process_calendars) {
                if (config.process_calendars[calConfig].id === all_calendars[cal].id) {
                    //logger.info("Found in config: "+config.process_calendars[calConfig].id);
                    calFound= true;
                } else {
                    //logger.debug("Not found in config: "+config.process_calendars[calConfig].id+" "+all_calendars[cal].id);
                }
            }
            if (calFound) {
                logger.info('Processing calendar: '+all_calendars[cal].id+' name: '+all_calendars[cal].name+' private: '+all_calendars[cal].isPrivate+" public "+all_calendars[cal].isPublic);
            } else {
                logger.debug("Ignoring calender with ID "+cal+" ("+all_calendars[cal].name+")");
            }
        }
    }
});
