//dep
var server = require('./lib/server')
var workers = require('./lib/workers')

var app = {};

//init fx
app.init = () => {
    server.init();
    workers.init();
}

//execute
app.init()

module.exports = app;