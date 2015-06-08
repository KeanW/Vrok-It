var express = require('express');
var api = require('./api');
var http = require('http');
var crypto = require('crypto');

// CONFIG
var port = process.env.PORT || 5000;

// WEB SERVER
var app = express();

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    next();
});
app.use('/', express.static(__dirname + '/html'));
app.get('/api/token', api.getToken);

app.get('/api/sessionId', function(req, res) {  
    var sessionId;  
    do {
        sessionId = randomValueBase64(6);
        console.log("generated session id: " + sessionId);
    }
    while (sessionIds.indexOf(sessionId) > -1);  
    res.json(sessionId);
});

// Currently only return the URN - could also return
// the various explode, zoom factors, etc.
app.get('/api/getSession/:id', function(req, res) {  
    var sessionId = req.params.id;
    var idx = sessionIds.indexOf(sessionId);
    res.json(idx < 0 ? "" : models[idx]);
});

var server = http.createServer(app);
server.listen(port);
console.log('Listening on port ' + port + '...');

var sessionIds = [];
var models = [];
var zoomFactors = [];
var explodeFactors = [];
var isolateIds = [];
var sectionPlanes = [];

var defZoom = null;
var defExplode = 0;
var defIsolate = [];
var defSection = [];

// WEB SOCKETS
var io = require('socket.io')(server);
io.on('connection', function(socket) {
    console.log('a user connected (id=' + socket.id +')');

    socket.on('create-session', function(session) {
        console.log('session created (id=' + session.id +')');
        // Add our session info to the beginning of our various arrays
        sessionIds.unshift(session.id);
        models.unshift(null);
        zoomFactors.unshift(defZoom);
        explodeFactors.unshift(defExplode);
        isolateIds.unshift(defIsolate);
        sectionPlanes.unshift(defSection);
    });
    
    socket.on('join-session', function(session) {
        console.log('user joined session (id=' + session.id +')');
        var idx = sessionIds.indexOf(session.id);
        if (idx >= 0) {
            
            // Add our user to the room for this session
            socket.join(session.id);
            
            if (models[idx]) {
                // Bring this user up to speed with the state of the session
                emitAndLog(socket, { name: 'load', value: models[idx] });
                if (zoomFactors[idx] !== defZoom) {
                    emitDirectAndLog(socket, { name: 'zoom', value: zoomFactors[idx] });
                }
                if (explodeFactors[idx] > defExplode) {
                    emitDirectAndLog(socket, { name: 'explode', value: explodeFactors[idx] });
                }
                if (isolateIds[idx] !== defIsolate) {
                    emitDirectAndLog(socket, { name: 'isolate', value: isolateIds[idx] });
                }
                if (sectionPlanes[idx] !== defSection) {
                    emitDirectAndLog(socket, { name: 'section', value: sectionPlanes[idx] });
                }
            }
        }
        else {
            console.log('could not find session (id=' + session.id +')');
        }
    });

    socket.on('close-session', function(session) {        
        var idx = sessionIds.indexOf(session.id);
        if (idx >= 0) {
            // Clear the model for participants
            emitToGroupAndLog({ session: session.id, name: 'load', value: '' });
            
            // Clean up state
            sessionIds = sessionIds.slice(idx, 1);
            models = models.slice(idx, 1);
            zoomFactors = zoomFactors.slice(idx, 1);
            explodeFactors = explodeFactors.slice(idx, 1);
            isolateIds = isolateIds.slice(idx, 1);
            sectionPlanes = sectionPlanes.slice(idx, 1);

            console.log('session closed (id=' + session.id +')');
        }
    });
    
    socket.on('disconnect', function() {
        console.log('a user disconnected (id=' + socket.id +')');
    });

    socket.on('lmv-command', function(command) {
        var idx = sessionIds.indexOf(command.session);
        if (idx >= 0) {
            if (command.name === 'load') {
                // Create our default settings for the model
                models[idx] = command.value;
                zoomFactors[idx] = defZoom;
                explodeFactors[idx] = defExplode;
                isolateIds[idx] = defIsolate;
                sectionPlanes[idx] = defSection;

                // Emit the load command
                emitToGroupAndLog(command);

                // Emit the defaults to the group participants                
                emitToGroupAndLog({ session: command.session, name: 'zoom', value: defZoom });
                emitToGroupAndLog({ session: command.session, name: 'explode', value: defExplode });
                emitToGroupAndLog({ session: command.session, name: 'isolate', value: defIsolate });
                emitToGroupAndLog({ session: command.session, name: 'section', value: defSection });                
            }
            else {
                if (command.name === 'zoom') {
                    zoomFactors[idx] = command.value;
                }
                else if (command.name === 'explode') {
                    explodeFactors[idx] = command.value;
                }
                else if (command.name === 'isolate') {
                    isolateIds[idx] = command.value;
                }
                else if (command.name === 'section') {
                    sectionPlanes[idx] = command.value;
                }
                emitToGroupAndLog(command);
            }
        }
        else {
            console.log('could not find session (id=' + command.session +')');
        }
    });
});

function emitDirectAndLog(socket, command) {
    socket.emit('lmv-command', command);
    console.log(command);
}

function emitToGroupAndLog(command) {
    io.to(command.session).emit('lmv-command', command);
    console.log(command);
}

function randomValueBase64 (len) {
    return crypto.randomBytes(Math.ceil(len * 3 / 4))
        .toString('base64')   // convert to base64 format
        .slice(0, len)        // return required number of characters
        .replace(/\+/g, '0')  // replace '+' with '0'
        .replace(/\//g, '0'); // replace '/' with '0'
}