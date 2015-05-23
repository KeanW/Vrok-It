var socketio = require('socket.io').listen(5001);
var express = require('express');
var request = require('request');
var path = require('path');

var router = express.Router();

///////////////////////////////////////////////////////////////////////////////
//
//
///////////////////////////////////////////////////////////////////////////////

router.get('/', function(req, res) {

    var rootPath = path.join(
        __dirname,
        '.');

    res.sendFile('index.html', { root: rootPath });
});

///////////////////////////////////////////////////////////////////////////////
//
//
///////////////////////////////////////////////////////////////////////////////
router.initializeSocket = function(serverApp) {

    var tracker = {};

    var showcaseData = null;

    ///////////////////////////////////////////////////////////////////////
    //
    //
    ///////////////////////////////////////////////////////////////////////
    function initShowcaseData() {

        showcaseData = {
            controllingUser: null,
            urn: '',
            view: null,
            isolateIds: null,
            explodeScale: 0.0
        };
    }

    ///////////////////////////////////////////////////////////////////////
    //
    //
    ///////////////////////////////////////////////////////////////////////
    function removeUser(socketId, user) {

        tracker[socketId].user = null;

        emitAll('removeUser', user);

        var msg = {
            user: user,
            text: '> ' +  '<b>' + user.name + '</b>' +
                ' left the showcase<br><br>'
        }

        var activeUsers = 0;

        for (var key in tracker) {

            if(tracker[key].user)
                ++activeUsers;

            tracker[key].socket.emit('chatMessage', msg);
        }

        // clears showcase data if no more active users
        if(activeUsers == 0) {

            initShowcaseData();
        }
    }

    ///////////////////////////////////////////////////////////////////////
    //
    //
    ///////////////////////////////////////////////////////////////////////
    function emitAll(signalId, data) {

        for (var key in tracker) {

            tracker[key].socket.emit(signalId, data);
        }
    }

    ///////////////////////////////////////////////////////////////////////
    //
    //
    ///////////////////////////////////////////////////////////////////////
    function emitExclude(socketId, signalId, data) {

        for (var key in tracker) {

            if(key !== socketId) {

                tracker[key].socket.emit(signalId, data);
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    //
    ///////////////////////////////////////////////////////////////////////////

    initShowcaseData();

    var io = socketio.listen(serverApp, { log: false });

    io.sockets.on('connection', function (socket) {

        console.log('Incoming socket connection: ' + socket.id);

        tracker[socket.id] = {
            socket: socket,
            user: null
        };

        ///////////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////////
        function buildInitData() {

            var users = [];

            for (var key in tracker) {

                if(tracker[key].user)
                    users.push(tracker[key].user);
            }

            var initData = {
                users: users,
                socketId: socket.id,
                showcaseData: showcaseData
            };

            return initData;
        }

        ///////////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////////
        socket.on('requestData', function () {

            socket.emit('showcaseData', buildInitData());
        });

        ///////////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////////
        socket.on('requestControl', function (user) {

            // grants control with no further check

            if(user.hasControl) {

                if(showcaseData.controllingUser) {

                    //current controlling user looses control
                    showcaseData.controllingUser.hasControl = false;

                    emitAll('controlEvent', showcaseData.controllingUser);
                }

                showcaseData.controllingUser = user;

                var msg = {
                    text: '> ' + '<b>' + user.name + '</b>' +
                        ' has taken control' + '<br><br>'
                };

                emitAll('chatMessage', msg);
            }
            else {
                if(showcaseData.controllingUser) {
                    if(showcaseData.controllingUser.socketId === socket.id) {
                        showcaseData.controllingUser = null;
                    }
                }
            }

            tracker[socket.id].user = user;

            emitAll('controlEvent', user);
        });

        ///////////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////////
        socket.on('cameraChanged', function (data) {

            showcaseData.view = data.view;

            emitExclude(socket.id, 'cameraChanged', data);
        });

        ///////////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////////
        socket.on('explode', function (data) {

            showcaseData.explodeScale = data.explodeScale;

            emitExclude(socket.id, 'explode', data);
        });

        ///////////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////////
        socket.on('isolate', function (data) {

            showcaseData.isolateIds = data.isolateIds;

            emitExclude(socket.id, 'isolate', data);
        });

        ///////////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////////
        socket.on('sendMessage', function (msg) {

            msg.text = '> ' + '<b>' + msg.user.name + '</b>' +  ' says:<br>' +
                msg.text + '<br><br>';

            emitAll('chatMessage', msg);
        });

        ///////////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////////
        socket.on('addUser', function (user) {

            user.socketId = socket.id;

            tracker[socket.id].user = user;

            emitAll('addUser', user);

            var msg = {
                user: user,
                text: '> ' + '<b>' + user.name + '</b>' +
                    ' joined the showcase<br><br>'
            }

            emitAll('chatMessage', msg);
        });

        ///////////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////////
        socket.on('removeUser', function (user) {

            removeUser(socket.id, user);
        });

        socket.on('disconnect', function () {

            //console.log('Socket disconnection: ' + socket.id);

            if(tracker[socket.id].user) {
                removeUser(socket.id, tracker[socket.id].user);
            }

            delete tracker[socket.id];
        });

        ///////////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////////
        socket.on('loadDocument', function (urn) {

            showcaseData.urn = urn;
            showcaseData.view = null;
            showcaseData.isolateIds = null;
            showcaseData.explodeScale = 0.0;

            emitExclude(socket.id, 'loadDocument', urn);

            var msg = {
                text: '> Loading document...<br><br>'
            }

            emitAll('chatMessage', msg);
        });

        ///////////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////////
        socket.on('closeDocument', function () {

            showcaseData.urn = '';
            showcaseData.view = null;
            showcaseData.isolateIds = null;
            showcaseData.explodeScale = 0.0;

            emitAll('closeDocument');
        });
    });
}

module.exports = router;