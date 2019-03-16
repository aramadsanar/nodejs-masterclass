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

var server = {};

//testing
// _data.delete('test', 'newFile', (err) => console.log(err))
// helpers.sendTwilioSms('6281398510190', 'hola :)', (err) => {
//     console.log(err)
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
    console.log(headers)

    //get the payload
    var decoder = new StringDecoder('utf-8');
    var buffer = ''

    req.on('data', (data) => {
        buffer  += decoder.write(data)
    })

    req.on('end', () => {
        buffer += decoder.end()

        console.log('buffer: \n', buffer)


        //choose the handler thr request shall go. kalo ga ketemu auto notfound
        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        //construct data object
        var data = {
            trimmedPath: trimmedPath,
            queryStringObject: queryStringObject,
            method: method,
            headers: headers,
            payload: helpers.parseJsonToObject(buffer)
        }

        chosenHandler(data, (statusCode, payload) => {
            //use status code or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            //use payload or empty object kalo gada
            payload = typeof(payload) == 'object' ? payload : {};

            //convert payload to str
            var payloadString = JSON.stringify(payload);

            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);

            res.end(payloadString);

            // log request
            console.log('Returning this response: \n', statusCode, payloadString);
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
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens,
    'checks': handlers.checks
}

module.exports  = server;