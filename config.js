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
    hashingSecret: '12345'
 }

 //prod env
 environments.production = {
    httpPort: 5000,
    httpsPort: 5001,
    envName: 'production',
    hashingSecret: '12345'
 }

 //Determine env
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';
console.log(currentEnvironment)
 //check that the current env is one o defined env
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

//export it
module.exports = environmentToExport;