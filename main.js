const { ChurchToolsClient, activateLogging } = require('@churchtools/churchtools-client');
const axiosCookieJarSupport = require('axios-cookiejar-support');
const tough = require('tough-cookie');
const fs = require('fs');

//
// Load config from config.json
//
let rawdata = fs.readFileSync('config.json');
let config = JSON.parse(rawdata);

console.warn(config.site_url);
console.warn(config.auth_token);
activateLogging();

const myCT= new ChurchToolsClient(config.site_url, config.auth_token);

myCT.get('/whoami').then(whoAmI => {
    console.dir(whoAmI);
    console.log(`Hello ${whoAmI.firstName} ${whoAmI.lastName}!`);
});
