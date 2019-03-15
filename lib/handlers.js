var _data = require('./data')
var helpers = require('./helpers')
var config = require('../config')
var handlers = {}


handlers.users = (data, callback) => {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    }
    else {
        callback(405)
    }
}



handlers._users = {}

//users - post
//required data: first name, last name, phone, password, tosAgreement
handlers._users.post = (data, callback) => {
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length >= 1 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    console.log(data.payload)

    if (firstName && lastName && phone && password && tosAgreement) {
        //make sure user doesnt exists
        _data.read('users', phone, (err, data) => {
            if (err) {
                //hash the password
                var hashedPassword = helpers.hash(password)

                if (hashedPassword) {
                    var userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': tosAgreement
                    };
    
    
                    //store to disk
                    _data.create('users', phone, userObject, (err) => {
                        if (!err) {
                            callback(200)
                        }
                        else {
                            console.log(err)
                            callback(500, {'Error': 'Could not create user!'})
                        }
                    })
                }
                else {
                    callback(500, {'Error': 'Could not hash user\'s password'})
                }

                //create user object

            } else {
                callback(400, {'Error': 'A user with that phone number already exists!'})
            }
        })
    }
    else {
        callback(400, {
            'Error': 'Missing required fields!'
        })
    }
    // if (!firstName || !lastName || !phone || !password || !tosAgreement)
}

//users - get
//required data: phone
//optional data: none
//@TODO: Only let authenticated user access their object. Don't let then access anyone else's
handlers._users.get = (data, callback) => {
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length > 0 ? data.queryStringObject.phone : false;
    console.log(phone)
    if (phone) {
        var token = typeof(data.headers.token) == 'string'  ? data.headers.token : false;

        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if (tokenIsValid) {
                _data.read('users', phone, (err, data) => {
                    if (!err && data) {
                        //Remove the hashed password before dikasi ke user
                        delete data.hashedPassword;
                        callback(200, data);
                    }
                    else {
                        callback(404)
                    }
                })
            } else {
                callback(403, {'Error': 'Missing required token or token is invalid'})
            }
        })
    }
    else {
        callback(400, {
            'Error': 'Missing required fields!'
        })
    }
    
}

//users - put
//required data:phone
//optional data: anything
// @TODO: only ley authenticated users edit their own detail, dont let then update anyone else's
handlers._users.put = (data, callback) => {
    //check for the required fields
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length > 0 ? data.payload.phone : false;
    
    //check for optional fields
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    //error if phone if invalid
    if (phone) {
        //Error if nothing is sent to update
        if (firstName || lastName || password) {
            var token = typeof(data.headers.token) == 'string'  ? data.headers.token : false;

            handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
                if (tokenIsValid) {
                    var user = _data.read('users', phone, (err, data) => {
                        if (!err && data) {
                            if (firstName) {
                                data.firstName = firstName;
                            }
                            if (lastName) {
                                data.lastName = lastName;
                            }
                            if (password) {
                                data.password = helpers.hash(password);
                            }
        
                            _data.update('users', phone, data, (err) => {
                                if (!err) {
                                    callback(200)
                                }
                                else {
                                    console.log(err)
                                    callback(500, {'Error': 'error updating user'})
                                }
                            })
                        } else {
                            callback(400, {'Error': 'The specified user does not exists'})
                        }
                    })
                } else {
                    callback(403, {'Error': 'Missing required token or token is invalid'})
                }
            })
            
        }
        else {
            callback(400, {'Error': 'Missing fields to update!'})
        }
    } else {
        callback(400, {'Error': 'Missing required fields!'})
    }
}

//users - delete
//required data:phone
// @TODO: only ley authenticated users delete their own data, dont let then delete anyone else's
//@TODO: delete associated data with this user!
handlers._users.delete = (data, callback) => {
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length > 0 ? data.queryStringObject.phone : false;
    
    if (phone) {
        var token = typeof(data.headers.token) == 'string'  ? data.headers.token : false;

        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if (tokenIsValid) {
                _data.read('users', phone, (err, data) => {
                    if (!err) {
                        _data.delete('users', phone, (err) => {
                            if (!err) {
                                // callback(200)

                                //now delete all checks associated with the user!
                                var userChecks = typeof(data.checks) == 'object' && data.checks instanceof Array && data.checks.length > 0 ? data.checks : false
                                var checksToDelete  = userChecks.length;
                                if (userChecks && checksToDelete > 0) {
                                    var checksDeleted = 0;
                                    var deletionErrors = false;
                                    for (let check of userChecks) {
                                        _data.delete('checks', check, (err) => {
                                            if (err) {
                                                deletionErrors = true;
                                                // callback(500, {'Error': 'Cannot delete all user checks!'})
                                            }
                                            checksDeleted++;
                                            if (checksDeleted == checksToDelete) {
                                                if (!deletionErrors) {
                                                    callback(200)
                                                }
                                                else {
                                                    callback(500, {'Error': 'Cannot delete all of your checks!'})
                                                }  
                                            } 
                                        })
                                    }
                                } else {
                                    callback(200)
                                }
                            }
                            else {
                                callback(500, {'Error': 'Cannot delete specified user'})
                            }
                        })
                    }
                    else {
                        callback(400, {'Error': 'No user found!'})
                    }
                })
            }
            else {
                callback(403, {'Error': 'Missing required token or token is invalid'})
            }
        });
    }
    else {
        callback(400, {'Error': 'Missing required fields!'})
    }
}

handlers.tokens = (data, callback) => {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    }
    else {
        callback(405)
    }
}

handlers._tokens = {}

//tokens - post
//required data: phone, password
//optional data: NOne
handlers._tokens.post = (data, callback) => {
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length >= 1 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;


    if (phone && password) {
        var token = typeof(data.headers.token) == 'string'  ? data.headers.token : false;

        _data.read('users', phone, (err, data) => {
            if (!err && data) {
                //hash the sent password, and compare it to the password hash in disk
                var hashedPassword = helpers.hash(password)

                if (hashedPassword == data.hashedPassword) {
                    //if valid, create a new token with random name, set expiration date in 1 hour 
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 * 60 * 60;
                    var tokenObject = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires
                    };
                    
                    //store the token
                    _data.create('tokens', tokenId, tokenObject, (err) => {
                        if (!err) {
                            callback(200, tokenObject)
                        } else {
                            callback(500, {'Error': 'Cannot create token'})
                        }
                    })
                }
                else {
                    callback(400, {'Error': 'Password do not match specified user\'s stored password!'})
                }

            }
            else {
                callback(400, {'Error': 'User not found!'})
            }
        })
    } else {
        callback(400, {'Error': 'Missing required fields!'})
    }
}

//tokens - get
//required data: id
//optional data: none
handlers._tokens.get = (data, callback) => {
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id : false;
    
    console.log(id)

    if (id) {
        _data.read('tokens', id, (err, data) => {
            if (!err && data) {
                //Remove the hashed password before dikasi ke user
                callback(200, data);
            }
            else {
                callback(404, {'Error': 'Token ID not found!'})
            }
        })
    }
    else {
        callback(400, {
            'Error': 'Missing required fields!'
        })
    }
}

//tokens - put
//required data: id, extend
//optional data: none
handlers._tokens.put = (data, callback) => {
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id : false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? data.payload.extend : false;
    
    if (id && extend) {
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                //check if token not expired yet
                if (tokenData.expires > Date.now()) {
                    tokenData.expires = Date.now() + 1000 * 60 * 60;
                    
                    //store the new token
                    _data.update('tokens', id, tokenData, (err) => {
                        if (!err) {
                            callback(200, tokenData)
                        }
                        else {
                            callback(500, {'Error': 'Cannot update token'})
                        }
                    })
                }
                else {
                    callback(400, {'Error': 'Token is expired and cannot be extended!'})
                }
            }
            else {
                callback(400, {'Error': 'Token not found!'})
            }
        })
    } else {
        callback(400, {
            'Error': 'Missing required fields or fields are invalid!'
        })
    }
}

//tokens - delete
//required data: id
//optional data: none
handlers._tokens.delete = (data, callback) => {
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
    
    if (id) {
        _data.read('tokens', id, (err, data) => {
            if (!err) {
                _data.delete('tokens', id, (err) => {
                    if (!err) {
                        callback(200)
                    }
                    else {
                        callback(500, {'Error': 'Cannot delete specified token'})
                    }
                })
            }
            else {
                callback(400, {'Error': 'No token found!'})
            }
        })
    }
    else {
        callback(400, {'Error': 'Missing required fields!'})
    }
}

handlers._tokens.verifyToken = (id, phone, callback) => {
    _data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
            if (tokenData.phone == phone && tokenData.expires > Date.now()) {
                callback(true)
            } else {
                callback(false)
            }
        } else {
            callback(false)
        }
    })
}


handlers.checks = (data, callback) => {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    }
    else {
        callback(405)
    }
}

handlers._checks = {};

//checks - post
//required data: protocol, url, methos, successCodes, timeoutSeconds
//optional data: none
handlers._checks.post = (data, callback) => {
    //validate inputs
    var protocol = typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url : false;
    var method = typeof(data.payload.method) == 'string' && ['get', 'post', 'put', 'delete', 'head'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
   
    if (protocol && url && method && successCodes && timeoutSeconds) {
        //get the token from headers
        var token = typeof(data.headers.token) == 'string'  ? data.headers.token : false;

        //Lookup the user by reading the token
        _data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData) {
                var userPhone = tokenData.phone;

                _data.read('users', userPhone, (err, userData) => {
                    if (!err && userData) {
                        var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

                        //Verify that the user has less than the number of max checks allowed per user
                        if (userChecks.length < config.maxChecks) {
                            //Create a random id for the check
                            var checkId = helpers.createRandomString(20);

                            //create the check object, and include the user's phone
                            var checkObject = {
                                'id': checkId,
                                'userPhone': userPhone,
                                'protocol': protocol,
                                'url': url,
                                'method': method,
                                'successCodes': successCodes,
                                'timeoutSeconds': timeoutSeconds
                            };

                            _data.create('checks', checkId, checkObject, (err) => {
                                if (!err) {
                                    userData.checks = userChecks
                                    userData.checks.push(checkId)

                                    //save the new user data
                                    _data.update('users', userPhone, userData, (err) => {
                                        if (!err) {
                                            callback(200, checkObject)
                                        } else {
                                            callback(500, {'Error': 'cannot update user data with the new checks!'})
                                        }
                                    })
                                    
                                }
                                else {
                                    callback(500, {'Error': 'cannot create check!'})
                                }
                            })
                        }
                        else {
                            callback(400, {'Error': 'The user already reached the max checks allowed(' + config.maxChecks + ')'})
                        }
                    }
                    else {
                        callback(403);
                    }
                })
            }
            else {
                callback(403)
            }
        })
    } else {
        callback(400, {'Error': 'Missing required fields'})
    }
}

//checks - get
//required data: id
//optional data: none
handlers._checks.get = (data, callback) => {
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
   
    if (id) {
        // var token = typeof(data.headers.token) == 'string'  ? data.headers.token : false;
        // Lookup the check
        _data.read('checks',id,function(err,checkData){
            if(!err && checkData){
                // Get the token that sent the request
                var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                // Verify that the given token is valid and belongs to the user who created the check
                console.log("This is check data",checkData);
                handlers._tokens.verifyToken(token,checkData.userPhone,function(tokenIsValid){
                    if(tokenIsValid){
                    // Return check data
                        callback(200,checkData);
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, {'Error': 'missing required fields'})
    }
}

//checks - put
handlers._checks.put = (data, callback) => {
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id : false;
    var protocol = typeof(data.payload.protocol) == 'string' && data.payload.protocol.trim().length > 0 ? data.payload.protocol : false;
    var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url : false; 
    var method = typeof(data.payload.method) == 'string' && data.payload.method.trim().length > 0 && ['get', 'post', 'put', 'delete', 'head'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
   
    if (id) {
        // var token = typeof(data.headers.token) == 'string'  ? data.headers.token : false;
        // Lookup the check
        _data.read('checks',id,function(err,checkData){
            if(!err && checkData){
                // Get the token that sent the request
                var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                // Verify that the given token is valid and belongs to the user who created the check
                // console.log("This is check data",checkData);
                if (protocol || url || method || successCodes || timeoutSeconds) {
                    handlers._tokens.verifyToken(token,checkData.userPhone,function(tokenIsValid){
                        if(tokenIsValid){
                        // Return check data
                            if (protocol) {
                                checkData.protocol = protocol;    
                            }
                            if (url) {
                                checkData.url = url;
                            }
                            if (method) {
                                checkData.method = method;
                            }
                            if (successCodes) {
                                checkData.successCodes = successCodes;
                            }
                            if (timeoutSeconds) {
                                checkData.timeoutSeconds = timeoutSeconds
                            }

                            _data.update('checks', id, checkData, (err) => {
                                if (!err) {
                                    callback(200)
                                } else {
                                    callback(500, {'Error': 'cannot update check!'})
                                }
                            })

                        } else {
                            callback(403, {'Error': 'unauthorized token or no token!'});
                        }
                    });
                }
                else {
                    callback(400, {'Error': 'Missing fields to update!'})
                }
            } else {
                callback(404, {'Error': 'Check not found!'});
            }
        });
    } else {
        callback(400, {'Error': 'missing required fields'})
    }
}

//checks - delete
handlers._checks.delete = (data, callback) => {
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
   
    if (id) {
        // var token = typeof(data.headers.token) == 'string'  ? data.headers.token : false;
        // Lookup the check
        _data.read('checks',id,function(err,checkData){
            if(!err && checkData){
                // Get the token that sent the request
                var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                // Verify that the given token is valid and belongs to the user who created the check
                console.log("This is check data",checkData);
                handlers._tokens.verifyToken(token,checkData.userPhone,function(tokenIsValid){
                    if(tokenIsValid){
                    // Return check data
                        _data.read('users', checkData.userPhone, (err, userData) => {
                            if (!err && userData) {
                                var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array && userData.checks.length > 0 ? userData.checks : false
                                if (userChecks) {
                                    var indexOfCheckToDelete = userChecks.indexOf(id) > -1 ? userData.checks.indexOf(id) : false;
                                    if (indexOfCheckToDelete) {
                                        //remove it from array!
                                        userData.checks.splice(indexOfCheckToDelete,1)

                                        _data.update('users', checkData.userPhone, userData, (err) => {
                                            if (!err) {
                                                _data.delete('checks', id, (err) => {
                                                    if (!err) {      
                                                        callback(200)
                                                    } else {
                                                        callback(500, {'Error': 'Error removing check!'})
                                                    }
                                                })
                                            } else {
                                                callback(500, {'Error': 'Cannot update user data!'})
                                            }
                                        })

                                    } else {
                                        callback(400, {'Error': 'Check does not belong to the user!'})
                                    }
                                }
                                else {
                                    callback(400, {'Error': 'User does not have checks!'})
                                }
                                
                                
                            } else {
                                callback(400, {'Error': 'User not found!'})
                            }
                        })


                    } else {
                        callback(403, {'Error': 'unauthorized token or no token!'});
                    }
                });
            } else {
                callback(404, {'Error': 'Check not found!'});
            }
        });
    } else {
        callback(400, {'Error': 'missing required fields'})
    }
}

handlers.ping = (data, callback) => {
    callback(200)
}

handlers.notFound = (data, callback) => {
    callback(404)
}


module.exports = handlers;