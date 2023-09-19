const { ChurchToolsClient, activateLogging } = require('@churchtools/churchtools-client');
const axiosCookieJarSupport = require('axios-cookiejar-support');
const tough = require('tough-cookie');

const myCT= new ChurchToolsClient();
myCT.setCookieJar(axiosCookieJarSupport.wrapper, new tough.CookieJar());
myCT.setBaseUrl("https://tools.ref-nidau.ch");
myCT.setUnauthorizedInterceptor("LniCnweyFaCv3KSq02MbDeRVzQsU27W8VvivhIgtN0m8ZwPImU0GqxnumSVyznyRGLpI8td73PN7E8u8RBLT1irlRLjtJNOZiVTiMAN0jA02ynhIzL83t95BVnrL1DHBpwGIt2DK9B9jYZCcG3mJfnMenqWYQnToJMjJXNYjqffFVZ0mrgJbFWutXvnQUfXyJB6674cNVQVyq4zRGD73NyCjtidgxDXcsRJTb0fenR3SEed46zCmuBhmR3OwfcBI");
activateLogging();

//myCT.get('/whoami?only_allow_authenticated=true').then(whoAmI => {
//    console.dir(whoAmI);
//    console.log(`Hello ${whoAmI.firstName} ${whoAmI.lastName}!`);
//});

myCT.get('/calendars').then(all_calendars => {
    for (var cal in all_calendars) {
        if (all_calendars.hasOwnProperty(cal)) {
            console.log('Calendar: '+all_calendars[cal].id+' name: '+all_calendars[cal].name+' private: '+all_calendars[cal].isPrivate+" public "+all_calendars[cal].isPublic);
        }
    }
});
