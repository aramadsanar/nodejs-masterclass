/*
*   Primary file for the API
*
*/
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('../config');
var fs = require('fs');
var _data = require('./data');
var handlers = require('./handlers')
var helpers = require('./helpers')
var path = require('path');
var util = require('util');
var debug = util.debuglog('server');

var server = {};

//testing
// _data.delete('test', 'newFile', (err) => debug(err))
// helpers.sendTwilioSms('6281398510190', 'hola :)', (err) => {
//     debug(err)
// })
//Instantiate http server
server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => sevrer.unifiedServer(req, res))

server.httpServer = http.createServer((req, res) => server.unifiedServer(req, res))




//Instantiate https server
server.httpsServerOptions = {
  'key': fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
  'cert': fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
}




//all the unified server
server.unifiedServer = (req, res) => {
    // get url and parse it
    var parsedUrl = url.parse(req.url, true);


    // get path from url
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '')


    //get query str as obj
    var queryStringObject = parsedUrl.query;


    //get http method
    var method = req.method.toLowerCase();

    //get the header as an object
    var headers = req.headers;
    debug(headers)

    //get the payload
    var decoder = new StringDecoder('utf-8');
    var buffer = ''

    req.on('data', (data) => {
        buffer  += decoder.write(data)
    })

    req.on('end', () => {
        buffer += decoder.end()

        debug('buffer: \n', buffer)


        //choose the handler thr request shall go. kalo ga ketemu auto notfound
        var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        //construct data object
        var data = {
            trimmedPath: trimmedPath,
            queryStringObject: queryStringObject,
            method: method,
            headers: headers,
            payload: helpers.parseJsonToObject(buffer)
        }

        chosenHandler(data, (statusCode, payload, contentType) => {
            //determine type of response (fallback to json)
            contentType = typeof(contentType) == 'string' ? contentType : 'json'

            //use status code or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            //return the response parts that are content-specific
            var payloadString = ''
            if (contentType == 'json') {
                res.setHeader('Content-Type', 'application/json');
                payload = typeof(payload) == 'object' ? payload : {};
                payloadString = JSON.stringify(payload);
            } 
            if (contentType == 'html') {
                res.setHeader('Content-Type', 'text/html');
                payloadString = typeof(payload) == 'string' ? payload : '';
            }
            //return the response parts that are common to all content-types
            res.writeHead(statusCode);
            res.end(payloadString);


            // if the respeonse is 200, print greenm otherwise print red
            if (statusCode == 200)
                debug('\x1b[32m%s\x1b[0m', method.toUpperCase()+' /'+trimmedPath+' '+statusCode)
            else 
                debug('\x1b[31m%s\x1b[0m', method.toUpperCase()+' /'+trimmedPath+' '+statusCode)
        } )

    });
}

server.init = () => {
    server.httpServer.listen(config.httpPort, () => {
        console.log('\x1b[36m%s\x1b[0m', `lurking on ${config.httpPort} and env ${config.envName}`)
    })

    server.httpsServer.listen(config.httpsPort, () => {
        console.log('\x1b[35m%s\x1b[0m', `lurking on ${config.httpsPort} and env ${config.envName}\n`)
    })
}


server.router = {
    '': handlers.index,
    'account/create': handlers.accountCreate,
    'account/edit': handlers.accountEdit,
    'account/deleted': handlers.accountDeleted,
    'session/create': handlers.sessionCreate,
    'session/delete': handlers.sessionDeleted,
    'checks/all': handlers.checksList,
    'checks/create': handlers.checksCreate,
    'checks/edit': handlers.checksEdit,
    'ping': handlers.ping,
    'api/users': handlers.users,
    'api/tokens': handlers.tokens,
    'api/checks': handlers.checks
}

module.exports  = server;