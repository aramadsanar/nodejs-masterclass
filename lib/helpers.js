var crypto = require('crypto');
var config = require('../config')
var https = require('https');
var querystring = require('querystring')
var helpers = {}
var path = require('path')
var fs = require('fs')
//create a sha256 hash
helpers.hash = (str) => {
    if (typeof(str) == 'string' && str.length > 0) {
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');

        return hash;
    }
    else {
        return false;
    }
}

helpers.parseJsonToObject = (str) => {
    try {
        var obj = JSON.parse(str);

        return obj;
    }
    catch (e) {
        return {};
    }
}

helpers.createRandomString = (strLength) => {
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;

    if (strLength) {
        var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

        //Start the final string
        var str = '';

        for (let i=1; i<= strLength; i++) {
            str += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
        }

        return str;
    } else {
        return false;
    }
}

//verify if a given token id is currently valid for given user

//send an sms message via twilio
helpers.sendTwilioSms = (phone, msg, callback) => {
    phone = typeof(phone) == 'string' && phone.trim().length >= 10 ? phone : false;
    msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg : false;

    if (phone && msg) {
        //configure the request payload
        var payload = {
            'from': config.twilio.fromPhone,
            'to': phone,
            'body': msg
        }

        //stringify 
        var stringPayload = querystring.stringify(payload)
        
        
        //configure request
        var requestDetails = {
            protocol: 'https:',
            hostname: 'api.twilio.com',
            method: 'POST',
            path: '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
            auth: config.twilio.accountSid+":"+config.twilio.authToken,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        }; 

        //send it 
        var req = https.request(requestDetails, (res) => {
            //grab the result
            var status = res.statusCode;

            //callback success if the request went thru
            if (status == 200 || status == 201) {
                callback(false);
            } else {
                callback('Status code returned was ' + status + ' ')
            }
        });

        //BInd to the error event so it dont get thrown
        req.on('error', (e) => {
            callback(e);
        })

        //Add the payload 
        req.write(stringPayload);

        //end the request
        req.end();

    } else {
        callback('Given parameters were missing or invalid!')
    }
}

//Get the string content of a template
helpers.getTemplate = (templateName, data, callback) => {
    templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
    
    
    if (templateName) {
        var templatesDir = path.join(__dirname, '/../templates/');

        fs.readFile(templatesDir+templateName+'.html', 'utf8', (err, str) => {
            if (!err && str && str.length > 0) {
                //Do interpolation on the string!
                var finalString = helpers.interpolate(str,data);
                callback(false, finalString)
            } else {
                callback('No template could be found!')
            }
        })
    } else {
        callback('A valid template name was not specified!')
    }
}

//Add the universal header and footer to str, pass provided data object to the header and footer for interpolation
helpers.addUniversalTemplates = (str, data, callback) => {
    // console.log('ut', data)
    str = typeof(str) == 'string' && str.length > 0 ? str : '';
    data = typeof(data) == 'object' && data !== null ? data : {};

    // Get the header
    helpers.getTemplate('_header', data, (err, headerString) => {
        // console.log('daleman', data)
        if (!err && headerString) {
            //get the footer
            helpers.getTemplate('_footer', data, (err, footerString) => {
                if (!err && footerString) {
                    //Add them all together
                    var fullString = headerString+str+footerString;
                    callback(false, fullString)
                } else {
                    callback("could not find footer template!")
                }
            })
        } else {
            callback('Could not find the header template!')
        }
    })
}

//Take a given string and a data object and find/replace all the keys within
helpers.interpolate = (str, data) => {
    str = typeof(str) == 'string' && str.length > 0 ? str : '';
    data = typeof(data) == 'object' && data !== null ? data : {};

    //add the templateGlobals, prepending their key name with "global"
    for (var keyName in config.templateGlobals) {
        if (config.templateGlobals.hasOwnProperty(keyName)) {
            data['global.'+keyName] = config.templateGlobals[keyName];
        }
    }

    //for each key in data object, insert its vale into the string at the corresponding placeholder
     for (var key in data) {
         if (data.hasOwnProperty(key) && typeof(data[key]) == 'string') {
             var replace = data[key];
             var find = '{'+key+'}';

             str = str.replace(find, replace);
         }
     }

     return str;
}


//Get the contents of a static (public) asset
helpers.getStaticAsset = (fileName, callback) => {
    fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName : false;
    if (fileName) {
        var publicDir = path.join(__dirname, '/../public/')
        // console.log(publicDir+fileName)
        fs.readFile(publicDir+fileName, (err, data) => {
            // console.log(data)
            if (!err && data) {
                callback(false, data)
            } else {
                callback('No file could be found!')
            }
        })
    } else {
        callback('A valid file name was not specified')
    }
}
module.exports = helpers;