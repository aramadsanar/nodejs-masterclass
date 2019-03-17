/**
 * Export config
 * 
 * 
 */

var environments = {};

//staging env
environments.staging = {
   httpPort: 3000,
   httpsPort: 3001,
   envName: 'staging',
   hashingSecret: '12345',
   'maxChecks': 5,
   twilio: {
      accountSid: 'AC2936025c02c29303db798c26eb04e217',
      authToken: 'b6b1dbee28598652b37a0ad5469f7a3c',
      fromPhone: "+12016902095"
   },
   templateGlobals: {
      appName: 'uptimeChecker',
      companyName: 'NotARealCompany, Inc',
      yearCreated: '2019',
      baseUrl: 'http://localhost:3000'
   }
}

//prod env
environments.production = {
   httpPort: 5000,
   httpsPort: 5001,
   envName: 'production',
   hashingSecret: '12345',
   'maxChecks': 5,
   twilio: {
      accountSid: 'AC2936025c02c29303db798c26eb04e217',
      authToken: 'b6b1dbee28598652b37a0ad5469f7a3c',
      fromPhone: "+12016902095"
   },
   templateGlobals: {
      appName: 'uptimeChecker',
      companyName: 'NotARealCompany, Inc',
      yearCreated: 2019,
      baseUrl: 'http://localhost:5000'
   }
}

 //Determine env
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';
console.log(currentEnvironment)
 //check that the current env is one o defined env
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

//export it
module.exports = environmentToExport;