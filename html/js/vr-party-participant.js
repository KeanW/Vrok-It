var _viewerLeft, _viewerRight;
var _updatingLeft, _updatingRight;
var _leftLoaded, _rightLoaded;
var _baseDir;
var _upVector;
var _deg2rad = Math.PI / 180;
var _wasFlipped;
var _readyToApplyEvents = false;
var _model_state = {};
var _orbitInitalPosition;


function initialize() {
    var buttonName = 'Connect';
    var panel = document.getElementById('control');
    var button = document.createElement('div');
    button.classList.add('cmd-btn');

    button.innerHTML = buttonName;
    button.onclick = (function (buttonName) {
        return function() { buttonName(); };
    })(function() {
        $('#layer1').hide();

        launchFullscreen($('#layer2')[0])

        Autodesk.Viewing.Initializer(getViewingOptions(), function() {

            var avp = Autodesk.Viewing.Private;
            avp.GPU_OBJECT_LIMIT = 100000;
            avp.onDemandLoading = false;

            launchViewer('urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL1JvYm90QXJtLmR3Zng=');
            initConnection();
        });
    });

    panel.appendChild(button);
    panel.appendChild(document.createTextNode('\u00a0'));
}


function launchViewer(urn) {
    _baseDir = null;
    _leftLoaded = _rightLoaded = false;
    _updatingLeft = _updatingRight = false;
    _upVector = new THREE.Vector3(0, 1, 0);

    // Remove all event listeners
    unwatchTilt;
    unwatchProgress();
    unwatchCameras();

    Autodesk.Viewing.Document.load(
        urn,
        function(documentData) {
            var model = getModel(documentData);
            if (!model) return;

            if (!_viewerLeft) {
                _viewerLeft = new Autodesk.Viewing.Viewer3D($('#viewerLeft')[0]);
                _viewerLeft.start();

                // The settings are loaded by the 2nd viewer automatically
                _viewerLeft.setQualityLevel(false, false);
                _viewerLeft.setGroundShadow(false);
                _viewerLeft.setGroundReflection(false);
                _viewerLeft.setGhosting(false);
                _viewerLeft.setLightPreset(8)
            }

            if (!_viewerRight) {
                _viewerRight = new Autodesk.Viewing.Viewer3D($('#viewerRight')[0]);
                _viewerRight.start();
            }

            watchProgress();
            loadModel(_viewerLeft, model);
            loadModel(_viewerRight, model);
        }
    );
}


function initConnection() {
    var socket = io();
    socket.on('lmv-command', function(msg) {
        if (msg.name === 'load') {
            launchViewer(msg.value);
        }
        else if (msg.name === 'zoom') {
            _model_state.zoom_factor = parseFloat(msg.value);
        }
        else if (msg.name === 'explode') {
            _model_state.explode_factor = parseFloat(msg.value);
        }
        else if (msg.name === 'isolate') {
            _model_state.isolate_id = msg.value;
        }
        else if (msg.name == 'section') {
            _model_state.cut_planes = msg.value.map(function(vec) {
                return new THREE.Vector4(vec.x, vec.y, vec.z, vec.w);
            });
        }
        viewersApplyState();
    });
}


function viewersApplyState() {
    if (!_leftLoaded || !_rightLoaded || !_readyToApplyEvents) {
        return;
    }

    if (_model_state.zoom_factor !== undefined) {
        var previousUpdatingLeft = _updatingLeft;
        var previousUpdatingRight = _updatingRight

        var direction = new THREE.Vector3();
        direction.subVectors(_orbitInitalPosition, _viewerLeft.navigation.getTarget());
        direction.normalize();
        direction.multiplyScalar(_model_state.zoom_factor);
        _viewerLeft.navigation.setPosition(direction.add(_viewerLeft.navigation.getTarget()));
        transferCameras(true);

        _orbitInitalPosition = _viewerLeft.navigation.getPosition();

        _updatingLeft = previousUpdatingLeft;
        _updatingRight = previousUpdatingRight;

        _model_state.zoom_factor = undefined;
    }

    if (_model_state.explode_factor !== undefined) {
        viewersApply('explode', _model_state.explode_factor);
        _model_state.explode_factor = undefined;
    }

    if (_model_state.isolate_id !== undefined) {
        viewersApply('isolate', _model_state.isolate_id);
        _model_state.isolate_id = undefined;
    }

    if (_model_state.cut_planes !== undefined) {
        viewersApply('setCutPlanes', _model_state.cut_planes);
        _model_state.cut_planes = undefined;
    }
}


function viewersApply(func){
    if (_viewerLeft && _viewerRight && _leftLoaded && _rightLoaded) {
        var val = Array.prototype.slice.call(arguments, 1);
        _viewerLeft[func].apply(_viewerLeft, val);
        _viewerRight[func].apply(_viewerRight, val);
    }
}


// Progress listener to set the view once the data has started
// loading properly (we get a 5% notification early on that we
// need to ignore - it comes too soon)
function progressListener(e) {
    if (e.percent >= 10) {
        if (e.target.clientContainer.id === 'viewerLeft') {
            _leftLoaded = true;
        }
        else if (e.target.clientContainer.id === 'viewerRight') {
            _rightLoaded = true;
        }
    }

    if (_leftLoaded && _rightLoaded) {

        if (!_orbitInitalPosition) {
            _orbitInitalPosition = _viewerLeft.navigation.getPosition();
        }

        unwatchProgress();
        watchCameras();
        watchTilt();

        _readyToApplyEvents = true;
        viewersApplyState();
    }
}


function watchProgress() {
    _viewerLeft.addEventListener('progress', progressListener);
    _viewerRight.addEventListener('progress', progressListener);
}


function unwatchProgress() {
    if (_viewerLeft) {
        _viewerLeft.removeEventListener('progress', progressListener);
    }
    if (_viewerRight) {
        _viewerRight.removeEventListener('progress', progressListener);
    }
}


function watchCameras() {
    _viewerLeft.addEventListener('cameraChanged', left2right);
    _viewerRight.addEventListener('cameraChanged', right2left);
}


function unwatchCameras() {
    if (_viewerLeft) {
        _viewerLeft.removeEventListener('cameraChanged', left2right);
    }

    if (_viewerRight) {
        _viewerRight.removeEventListener('cameraChanged', right2left);
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


// Event handlers for the cameraChanged events


function left2right() {
    if (_viewerLeft && _viewerRight && !_updatingRight) {
        _updatingLeft = true;
        transferCameras(true);
        setTimeout(function() { _updatingLeft = false; }, 500);
    }
}


function right2left() {
    if (_viewerLeft && _viewerRight && !_updatingLeft) {
        _updatingRight = true;
        transferCameras(false);
        setTimeout(function() { _updatingRight = false; }, 500);
    }
}


function transferCameras(leftToRight) {
    // The direction argument dictates the source and target
    var source = leftToRight ? _viewerLeft : _viewerRight;
    var target = leftToRight ? _viewerRight : _viewerLeft;

    var pos = source.navigation.getPosition();
    var trg = source.navigation.getTarget();

    // Set the up vector manually for both cameras
    source.navigation.setWorldUpVector(_upVector);
    target.navigation.setWorldUpVector(_upVector);

    // Get the new position for the target camera
    var up = source.navigation.getCameraUpVector();

    // Get the position of the target camera
    var newPos = offsetCameraPos(source, pos, trg, leftToRight);

    // Zoom to the new camera position in the target
    zoom(target, newPos, trg, up);
}


// And for the deviceorientation event


function orb(e) {
    if (!e.alpha || !e.beta || !e.gamma || _updatingLeft || _updatingRight) return;

    // Remove our handlers watching for camera updates,
    // as we'll make any changes manually
    // (we won't actually bother adding them back, afterwards,
    // as this means we're in mobile mode and probably inside
    // a Google Cardboard holder)
    // unwatchCameras();

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
    orbitViews(vert, horiz);
}


function orbitViews(vert, horiz) {
    // We'll rotate our position based on the initial position
    // and the target will stay the same
    var pos = _orbitInitalPosition.clone();
    var trg = _viewerLeft.navigation.getTarget();

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

    // Zoom in with the lefthand view
    zoom(_viewerLeft, pos, trg, camUp);

    // Get a camera slightly to the right
    var pos2 = offsetCameraPos(_viewerLeft, pos, trg, true);

    // And zoom in with that on the righthand view, too
    zoom(_viewerRight, pos2, trg, camUp);
}


function offsetCameraPos(source, pos, trg, leftToRight) {
    // Use a small fraction of the distance for the camera offset
    var disp = pos.distanceTo(trg) * 0.04;

    // Clone the camera and return its X translated position
    var clone = source.autocamCamera.clone();
    clone.translateX(leftToRight ? disp : -disp);
    return clone.position;
}


function zoom(viewer, pos, trg, up) {
    // Make sure our up vector is correct for this model
    viewer.navigation.setWorldUpVector(_upVector, true);
    viewer.navigation.setView(pos, trg);
    viewer.navigation.setCameraUpVector(up);
}
