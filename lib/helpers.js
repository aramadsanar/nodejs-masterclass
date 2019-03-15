var crypto = require('crypto');
var config = require('../config')
var https = require('https');
var querystring = require('querystring')
var helpers = {}

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


module.exports = helpers;