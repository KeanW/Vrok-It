var _viewer;
var _updating;
var _loaded;
var _baseDir;
var _upVector;
var _deg2rad = Math.PI / 180;
var _wasFlipped;
var _readyToApplyEvents = false;
var _model_state = {};
var _orbitInitialPosition;
var _lastVert, _lastHoriz;
var _socket = io();
var _sessionId;
var _noSleepVR;

// Get the VRDisplay and save it for later.
var _vrDisplay = null;
navigator.getVRDisplays().then(function(displays) {
  if (displays.length > 0) {
    _vrDisplay = displays[0];
  }
});

function initialize() {
    
    _sessionId = getURLParameter('session');
    if (_sessionId) {
        var buttonName = 'Connect';
        var panel = document.getElementById('control');
        var button = document.createElement('div');
        button.classList.add('cmd-btn');
    
        button.innerHTML = buttonName;
        button.onclick = connect;
            
        panel.appendChild(button);
    }
}


function connect() {
    $('#layer1').hide();

    _vrDisplay.requestPresent([$('#layer2')[0]]);
    //launchFullscreen($('#layer2')[0]);
        
    if (LMV_VIEWER_VERSION === '1.2.13') {
        $.get(
            window.location.origin + '/api/token',
            function (accessTokenResponse) {
        
                var options = {};
                options.env = 'AutodeskProduction';
                options.accessToken = accessTokenResponse.access_token;
                Autodesk.Viewing.Initializer(options, function() {
                    var avp = Autodesk.Viewing.Private;
                    avp.GPU_OBJECT_LIMIT = 100000;
                    avp.onDemandLoading = false;
        
                    showMessage('Waiting...');
        
                    _socket.emit('join-session', { id: _sessionId });
                    
                    initConnection();
                });
            }
        );
    }
    else {
        Autodesk.Viewing.Initializer(getViewingOptions(), function() {
            var avp = Autodesk.Viewing.Private;
            avp.GPU_OBJECT_LIMIT = 100000;
            avp.onDemandLoading = false;

            showMessage('Waiting...');

            _socket.emit('join-session', { id: _sessionId });

            initConnection();
        });
    }
}


function showMessage(text, removeBlink) {
    $('#layer2').hide();
    var messages = $('#messageLeft,#messageRight');
    if (removeBlink) {
        messages.removeClass('blink');
    }
    messages.html(text);    
    $('#layer3').show();
}


function clearMessage() {
    $('#layer3').hide();
    $('#layer2').show();
}


function launchViewer(urn) {
    _baseDir = null;
    _loaded = false;
    _updating = false;
    _upVector = new THREE.Vector3(0, 1, 0);
    _orbitInitialPosition = null;

    // Make sure the VR extension doesn't change the fullscreen settings
    // when it loads ot unloads (these can only be called from a UI callback)
    // Also stub out the HUD message function, to stop those from being shown
    
    window.launchFullscreen = function() {};
    window.exitFullscreen = function() {};
    Autodesk.Viewing.Private.HudMessage.displayMessage = function() {};
    
    if (urn) {
        // Remove all event listeners
        unwatchTilt;
        unwatchProgress();
    
        clearMessage();
        
        urn = urn.ensurePrefix('urn:');
        
        Autodesk.Viewing.Document.load(
            urn,
            function(documentData) {
                var model = getModel(documentData);
                if (!model) return;
    
                // Uninitializing the viewers helps with stability
                
                if (_viewer) {
                    _viewer.finish();
                    _viewer = null;
                }
                
                if (!_viewer) {
                    _viewer = new Autodesk.Viewing.Private.GuiViewer3D($('#viewer')[0], { wantInfoButton : false });
                    
                    // Added for WebVR support
                    
                    _viewer.Autocam.animate(function() { _vrDisplay.requestAnimationFrame(_viewer.Autocam.animate); });
                    
                    _viewer.start();
    
                    _viewer.setQualityLevel(false, false);
                    _viewer.setGroundShadow(true);
                    _viewer.setGroundReflection(false);
                    _viewer.setProgressiveRendering(false);
                }
       
                watchProgress();

                _viewer.prefs.remove("fusionOrbit", false);
                _viewer.prefs.remove("fusionOrbitConstrained", false);

                loadModel(_viewer, model);
                
                // Hide the viewer's toolbar and the home button
                
                $('.adsk-control-group').each(function(){            
                    $(this).find('>.adsk-button').each(function(){                
                        $(this).css({ 'display':'none' });
                    });
                });
                
                // Needed for v2.2
                
                $('#guiviewer3d-toolbar').css({ 'display':'none' });
                $('.homeViewWrapper').css({ 'display':'none' });
            }
        );
    }
    else {
                
        showMessage('Disconnected', true);
        
        _viewer.uninitialize();
        _viewer = new Autodesk.Viewing.Private.GuiViewer3D($('#viewer')[0], { wantInfoButton : false});
    }
}

function initConnection() {
    _socket.on('lmv-command', function(msg) {
        if (msg.name === 'load') {
            launchViewer(msg.value, msg.disconnecting);
        }
        else if (msg.name === 'zoom') {
            _model_state.zoom_factor = parseFloat(msg.value);
        }
        else if (msg.name === 'explode') {
            _model_state.explode_factor = parseFloat(msg.value);
        }
        else if (msg.name === 'isolate') {
            _model_state.isolate_ids = msg.value;
        }
        else if (msg.name === 'hide') {
            _model_state.hide_ids = msg.value;
        }
        else if (msg.name === 'show') {
            _model_state.show_ids = msg.value;
        }
        else if (msg.name == 'section') {
            _model_state.cut_planes = msg.value.map(function(vec) {
                return new THREE.Vector4(vec.x, vec.y, vec.z, vec.w);
            });
        }
        viewerApplyState();
    });
}


function viewerApplyState() {
    var not_ready = false;

    if (!_loaded || !_readyToApplyEvents) {
        return;
    }

    if (_model_state.zoom_factor !== undefined && !isNaN(_model_state.zoom_factor)) {
        
        unwatchTilt();
        
        var previousUpdating = _updating;

        var newPos = zoomInOrOut(_viewer, _orbitInitialPosition, _model_state.zoom_factor);
        _viewer.navigation.setPosition(newPos);

        console.log("Zoomed: " + _model_state.zoom_factor);

        _orbitInitialPosition = newPos;

        _updating = previousUpdating;

        _model_state.zoom_factor = undefined;
        
        if (_lastVert && _lastHoriz) {
            orbitViews(_lastVert, _lastHoriz);
        }

        console.log('Applied zoom');
            
        watchTilt();
    }

    if (_model_state.explode_factor !== undefined) {
        viewersApply('explode', _model_state.explode_factor);
        _model_state.explode_factor = undefined;
        console.log('Applied explode');
    }

    if (_model_state.isolate_ids !== undefined) {
        var worked = tryToApplyIds('isolate', _model_state.isolate_ids);
        if (worked) {
            _model_state.isolate_ids = undefined;
            console.log('Applied isolate');
        }
        else
            console.log('Not ready to isolate');
        not_ready = not_ready || !worked;
    }

    if (!not_ready && _model_state.show_ids !== undefined) {
        var worked = tryToApplyIds('show', _model_state.show_ids);
        if (worked) {
            _model_state.show_ids = undefined;
            console.log('Applied show');
        }
        else
            console.log('Not ready to show');
        not_ready = not_ready || !worked;
    }

    if (!not_ready && _model_state.hide_ids !== undefined) {
        var worked = tryToApplyIds('hide', _model_state.hide_ids);
        if (worked) {
            _model_state.hide_ids = undefined;
            console.log('Applied hide');
        }
        else
            console.log('Not ready to hide');
        not_ready = not_ready || !worked;
    }

    if (_model_state.cut_planes !== undefined) {
        viewersApply('setCutPlanes', _model_state.cut_planes);
        _model_state.cut_planes = undefined;
        console.log('Applied section');
    }

    if (not_ready) {
        setTimeout(function() { viewerApplyState(); }, 1000);
    }
}


function tryToApplyIds(prop, ids) {
    var success = true;        
    if ((LMV_VIEWER_VERSION === '1.2.13' || LMV_VIEWER_VERSION === '1.2.14') &&
        ids.length > 0 && typeof ids[0] === 'number') {

        // getNodesByIds can throw an exception when the model isn't sufficiently loaded
        // Catch it and try to apply the viewer state again in a second
         try {
            ids = _viewer.model.getNodesByIds(ids);
        }
        catch (ex) {
            success = false;
        }
    }
    if (success) {
        try {
            viewersApply(prop, ids);
        }
        catch (ex) {
            success = false;
        }
    }
    return success;
}


function viewersApply(func){
    var val = Array.prototype.slice.call(arguments, 1);
    _viewer[func].apply(_viewer, val);
}


// Progress listener to set the view once the data has started
// loading properly (we get a 5% notification early on that we
// need to ignore - it comes too soon)
function progressListener(e) {
    if (e.percent >= 10) {
        if (e.target.clientContainer.id === 'viewer') {
            _viewer.getObjectTree(
                function() {
                    _loaded = true;
                    console.log('Viewer has an instance tree');
                    setTimeout(finishProgress, 100);
                },
                function() {
                    _loaded = false;
                    console.log('Cannot get instance tree');
                }
            );
            _viewer.removeEventListener('progress', progressListener);
        }
    }
}

function finishProgress() {
    
    if (_loaded) {

        if (!_orbitInitialPosition) {
            _orbitInitialPosition = _viewer.navigation.getPosition();
        }

        _viewer.loadExtension('Autodesk.ADN.Viewing.Extension.VR', {});

        watchTilt();

        _readyToApplyEvents = true;
        viewerApplyState();
    }
}


function watchProgress() {
    _viewer.addEventListener('progress', progressListener);
}


function unwatchProgress() {
    if (_viewer) {
        _viewer.removeEventListener('progress', progressListener);
    }
}


function watchTilt() {
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', orb);
    }
}


function unwatchTilt() {
    if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', orb);
    }
}


// And for the deviceorientation event


function orb(e) {
    if (!e.alpha || !e.beta || !e.gamma || _updating) return;

    // gamma is the front-to-back in degrees (with
    // this screen orientation) with +90/-90 being
    // vertical and negative numbers being 'downwards'
    // with positive being 'upwards'
    var ab = Math.abs(e.beta);
    var flipped = (ab < 90 && e.gamma < 0) || (ab > 90 && e.gamma > 0);
    var vert = ((flipped ? e.gamma : -e.gamma) + (ab < 90 ? 90 : -90)) * _deg2rad;

    // When the orientation changes, reset the base direction
    if (_wasFlipped != flipped) {
        // If the angle goes below/above the horizontal, we don't
        // flip direction (we let it go a bit further)
        if (Math.abs(e.gamma) < 45) {
            flipped = _wasFlipped;
        } else {
            // Our base direction allows us to make relative horizontal
            // rotations when we rotate left & right
            _wasFlipped = flipped;
            _baseDir = e.alpha;
        }
    }

    // alpha is the compass direction the device is
    // facing in degrees. This equates to the
    // left - right rotation in landscape
    // orientation (with 0-360 degrees)
    var horiz = (e.alpha - _baseDir) * _deg2rad;
    
    // Save the latest horiz and vert values for use in zoom
    _lastHoriz = horiz;
    _lastVert = vert;
    
    orbitViews(vert, horiz);
}


function orbitViews(vert, horiz) {
    // We'll rotate our position based on the initial position
    // and the target will stay the same
    
    if (_orbitInitialPosition == null)
        return;
    
    var pos = _orbitInitialPosition.clone();
    var trg = _viewer.navigation.getTarget();

    // Start by applying the left/right orbit
    // (we need to check the up/down value, though)
    if (vert < 0 && !isIOSDevice()) {
        horiz = horiz + Math.PI;
    }

    var zAxis = _upVector.clone();
    pos.applyAxisAngle(zAxis, horiz);

    // Now add the up/down rotation
    var axis = trg.clone().sub(pos).normalize();
    axis.cross(zAxis);
    pos.applyAxisAngle(axis, -vert);

    // Determine the camera up vector: this is important if
    // getting to the extremities, to stop direction flipping
    var camUp = pos.clone().sub(trg).normalize();
    camUp.cross(axis).normalize();

    // Zoom in to this location
    zoom(_viewer, pos, trg, camUp);
}


function zoom(viewer, pos, trg, up) {
    // Make sure our up vector is correct for this model
    viewer.navigation.setWorldUpVector(_upVector, true);
    viewer.navigation.setView(pos, trg);
    viewer.navigation.setCameraUpVector(up);
}


function zoomInOrOut(viewer, pos, factor) {
    var direction = new THREE.Vector3();
    var target = new THREE.Vector3(); //_viewer.navigation.getTarget();
    direction.subVectors(pos, target);
    direction.normalize();
    direction.multiplyScalar(factor * 0.5);
    return direction.add(target);
}