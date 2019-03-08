var crypto = require('crypto');
var config = require('../config')

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



module.exports = helpers;