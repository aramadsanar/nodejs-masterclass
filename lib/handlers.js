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


handlers.tokens = (data, callback) => {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    }
    else {
        callback(405)
    }
}

handlers._users = {
}

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
                                callback(200)
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
handlers.ping = (data, callback) => {
    callback(200)
}

handlers.notFound = (data, callback) => {
    callback(404)
}


module.exports = handlers;