var _viewer;
var _socket = io();
var _last_distance_to_target;
var _view_data_bucket = 'steambuck';
var _default_models = {
    'robot arm'     : 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL1JvYm90QXJtLmR3Zng=',
    'differential'  : 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL0RpZmYuZHdmeA==',
    'suspension'    : 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL1N1c3BlbnNpb24uZHdm',
    'house'         : 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL2hvdXNlLmR3Zng=',
    'flyer one'     : 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL0ZseWVyT25lLmR3Zng=',
    'motorcycle'    : 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL01vdG9yY3ljbGUuZHdmeA==',
    'V8 engine'     : 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL1Y4RW5naW5lLnN0cA==',
    'aotea'         : 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL2FvdGVhMy5kd2Y=',
    'dinghy'        : 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL2RpbmdoeS5mM2Q=',
    'column'        : 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL3RhYmxldDIuemlw',
    'tablet'        : 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL2VneXB0NC56aXA='
}



//
//  Init
//


function initialize() {
    // Populate our initial UI with a set of buttons, one for each function in the Buttons object
    var panel = document.getElementById('control');
    for (var name in _default_models) {
        var urn = _default_models[name];
        addButton(panel, name, function(urn) { return function() { launchUrn('urn:' + urn); } }(urn));
    }

    var base_url = window.location.origin;
    if (window.location.hostname === 'vr-party.herokuapp.com') {
        // Apparently some phone browsers don't like the mix of http and https
        // Default to https on Heroku deployment
        base_url = 'https://vr-party.herokuapp.com'
    }

    var url = base_url + '/participant.html';
    $('#url').attr('href', url);
    $('#qrcode').qrcode(url);

    Autodesk.Viewing.Initializer(getViewingOptions(), function() {
        launchUrn('urn:' + _default_models['robot arm']);
        readCookiesForCustomModel();
    });
}


function addButton(panel, buttonName, loadFunction) {
    var button = document.createElement('div');
    button.classList.add('cmd-btn-small');

    button.innerHTML = buttonName;
    button.onclick = loadFunction;

    panel.appendChild(button);
}


function launchUrn(urn) {
    _socket.emit('lmv-command', { name: 'load', value: urn });

    Autodesk.Viewing.Document.load(
        urn,
        function(documentData) {
            var model = getModel(documentData);
            if (!model) return;

            if (!_viewer) {
                _viewer = new Autodesk.Viewing.Private.GuiViewer3D($('#3dViewDiv')[0]);
                _viewer.start();
                _viewer.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, onCameraChange);
                _viewer.addEventListener(Autodesk.Viewing.ISOLATE_EVENT, onIsolate);
                _viewer.addEventListener(Autodesk.Viewing.EXPLODE_CHANGE_EVENT, onExplode);
                _viewer.addEventListener(Autodesk.Viewing.CUTPLANES_CHANGE_EVENT,onSection);
            }

            _viewer.container.style.width = $('#3dViewDiv').width() + 'px';
            _viewer.container.style.height = (window.innerHeight - 40) + 'px'; // subtract the table padding
            loadModel(_viewer, model);
        }
    );
}


//
//  Viewer3D events
//


function onCameraChange(event) {
    var distance_to_target = _viewer.navigation.getPosition().distanceTo(_viewer.navigation.getTarget());
    if (_last_distance_to_target === undefined || Math.abs(distance_to_target - _last_distance_to_target) > 0.1) {
        _socket.emit('lmv-command', { name: 'zoom', value: distance_to_target });
        _last_distance_to_target = distance_to_target;
    }
}


function onIsolate(event) {
    _socket.emit('lmv-command', { name: 'isolate', value: event.nodeIdArray });
}


function onExplode() {
    _socket.emit('lmv-command', { name: 'explode', value: _viewer.getExplodeScale() });
}


function onSection(event) {
    _socket.emit('lmv-command', { name: 'section', value: _viewer.getCutPlanes() });
}


//
//  Models upload
//

function onFileSelect() {
    $('#upload-button').html('Uploading...');
    var el = document.getElementById('fileElem');
    if (el) {
        el.click();
    }
}


function onUpload(files) {
    $.get(
        window.location.origin + '/api/token',
        function(accessTokenResponse) {
            var viewDataClient = new Autodesk.ADN.Toolkit.ViewData.AdnViewDataClient(
                'https://developer.api.autodesk.com',
                accessTokenResponse
            );
            viewDataClient.getBucketDetailsAsync(
                _view_data_bucket,
                function(bucketResponse) {
                    //onSuccess
                    console.log('Bucket details successful:');
                    console.log(bucketResponse);
                    uploadFiles(viewDataClient, _view_data_bucket, files);
                },
                function(error) {
                    //onError
                    console.log("Bucket doesn't exist");
                    console.log('Attempting to create...');
                }
            );
        }
    );
}


function uploadFiles(viewDataClient, bucket, files) {
    for (var i = 0; i < files.length; ++i) {
        var file = files[i];
        console.log('Uploading file: ' + file.name + ' ...');
        viewDataClient.uploadFileAsync(
            file,
            bucket,
            file.name.replace(/ /g,'_'), // Translation API cannot handle spaces...
            function(response) {
                //onSuccess
                console.log('File upload successful:');
                console.log(response);
                var fileId = response.objects[0].id;
                var registerResponse = viewDataClient.register(fileId);

                if (registerResponse.Result === 'Success' ||
                    registerResponse.Result === 'Created') {
                    console.log('Registration result: ' + registerResponse.Result);
                    console.log('Starting translation: ' + fileId);

                    checkTranslationStatus(
                        viewDataClient,
                        fileId,
                        1000 * 60 * 5, //5 mins timeout
                        function(viewable) {
                            //onSuccess
                            console.log('Translation successful: ' + response.file.name);
                            console.log('Viewable: ');
                            console.log(viewable);

                            // add new button
                            var panel = document.getElementById('control');
                            addButton(panel, response.file.name, function() { launchUrn(viewable.urn); });

                            // open it in a viewer
                            launchUrn(viewable.urn);

                            // and store as a cookie
                            createCookieForCustomModel('custom_model_' + response.file.name, viewable.urn);
                        });
                }
            },

            //onError
            function (error) {
                console.log('File upload failed:');
                console.log(error);
            });
    }
}


function checkTranslationStatus(viewDataClient, fileId, timeout, onSuccess) {
    var startTime = new Date().getTime();
    var timer = setInterval(function() {
        var dt = (new Date().getTime() - startTime) / timeout;
        if (dt >= 1.0) {
            clearInterval(timer);
        } else {
            viewDataClient.getViewableAsync(
                fileId,
                function(response) {
                    console.log(response);
                    console.log('Translation Progress ' + fileId + ': ' + response.progress);
                    $('#upload-button').html(response.progress);

                    if (response.progress === 'complete') {
                        clearInterval(timer);
                        onSuccess(response);
                        $('#upload-button').html('Upload file');
                    }
                },
                function(error) {}
            );
        }
    }, 2000);
};


//
//  Models stored in cookies
//


function createCookieForCustomModel(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        var expires = '; expires=' + date.toGMTString();
    } else {
        var expires = '';
    }

    document.cookie = name + '=' + value + expires + '; path=/';
}


function readCookiesForCustomModel() {
    var prefix = 'custom_model_';
    var cookies = document.cookie.split(';');

    for (var i in cookies) {
        var c = cookies[i];
        if (c.indexOf(prefix) != -1) {
            c = c.replace(prefix, '');
            var nameValue = c.split('=');
            if (nameValue) {
                var panel = document.getElementById('control');
                addButton(panel, nameValue[0], function() {
                    launchUrn(nameValue[1]);
                });
            }
        }
    }
}
