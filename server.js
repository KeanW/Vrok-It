var express = require('express');
var api = require('./api');
var http = require('http');

// CONFIG
var port = process.env.PORT || 5000

// WEB SERVER
var app = express();

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    next();
});
app.use('/', express.static(__dirname + '/html'));
app.get('/api/token', api.getToken);

var server = http.createServer(app)
server.listen(port)
console.log('Listening on port ' + port + '...');


// WEB SOCKETS
var io = require('socket.io')(server);
io.on('connection', function(socket) {
    console.log('a user connected');

    socket.on('disconnect', function() {
        console.log('user disconnected');
    });

    socket.on('lmv-command', function(msg) {
        socket.broadcast.emit('lmv-command', msg);
    });
});
