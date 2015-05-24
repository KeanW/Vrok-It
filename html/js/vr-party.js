var viewerLeft, viewerRight;
var updatingLeft = false, updatingRight = false;
var leftLoaded, rightLoaded, cleanedModel;
var leftPos, baseDir, upVector, initLeftPos;
var initZoom;
var expFac = 0, exp = 0;
var targExp = 0.5, xfac = 0.05, zfac = 0.3;
var direction = true;
var deg2rad = Math.PI / 180;
var wasFlipped;


var buttons = {
  'connect' : function () {
    launchViewer(
      'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL1JvYm90QXJtLmR3Zng='
    );
    init_connection();
  }
};

var buttons2 = {
  'robot arm' : function () {
    launchViewer(
      'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL1JvYm90QXJtLmR3Zng='
    );
  },
  'differential' : function () {
    launchViewer(
      'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL0RpZmYuZHdmeA=='
    );
  },
  'front loader' : function () {
    launchViewer(
      'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL0Zyb250JTIwTG9hZGVyLmR3Zng=',
      new THREE.Vector3(0, 0, 1)
    );
  },
  'suspension' : function () {
    launchViewer(
      'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL1N1c3BlbnNpb24uZHdm'
    );
  },
  'house' : function () {
    launchViewer(
      'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL2hvdXNlLmR3Zng='
    );
  },
  'flyer one' : function () {
    launchViewer(
      'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL0ZseWVyT25lLmR3Zng='
    );
  },
  'motorcycle' : function () {
    launchViewer(
      'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL01vdG9yY3ljbGUuZHdmeA=='
    );
  },
  'V8 engine' : function () {
    launchViewer(
      'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL1Y4RW5naW5lLnN0cA=='
    );
  },
  'aotea': function () {
    launchViewer(
      'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL2FvdGVhMy5kd2Y='
    );
  },
  'dinghy': function () {
    launchViewer(
      'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL2RpbmdoeS5mM2Q='
    );
  },
  'column': function () {
    launchViewer(
      'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL3RhYmxldDIuemlw'
    );
  },
  'tablet': function () {
    launchViewer(
      'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL2VneXB0NC56aXA='
    );
  },
  'morgan': function () {
    launchViewer(
      //'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL1NwTTNXNy5mM2Q=',
      //'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL1NwTTNXOC5mM2Q=',
      'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3RlYW1idWNrL1NwTTNXQi5mM2Q=',
      new THREE.Vector3(0, 0, 1),
      function () {
        zoom(
          viewerLeft,
          new THREE.Vector3(-48722.5, -54872, 44704.8),
          new THREE.Vector3(10467.3, 1751.8, 1462.8)
        );
      }
    );
  }
}

var commands = {
  'explode': function () {
    if (checkViewers()) {
      expFac = expFac + 1;
      explode(true);
    }
  },
  'combine': function () {
    if (checkViewers()) {
      if (expFac > 0) {
        expFac = expFac - 1;
        explode(false);
      }
    }
  },
  'in': function () {
    if (checkViewers()) {
      zoomInwards(-zfac);
    }
  },
  'out': function () {
    if (checkViewers()) {
      zoomInwards(zfac);
    }
  },
  'reset': function () {
    if (checkViewers()) {
      expFac = 0;
      explode(false);

      if (initLeftPos) {
        var trg = viewerLeft.navigation.getTarget();
        var up = viewerLeft.navigation.getCameraUpVector();

        leftPos = initLeftPos.clone();
        zoom(viewerLeft, initLeftPos, trg, up);
      }
    }
  },
  'reload': function () {
    location.reload();
  },
  'front': function () {
    if (checkViewers()) {
      zoomToCube('front');
    }
  },
  'back': function () {
    if (checkViewers()) {
      zoomToCube('back');
    }
  },
  'top': function () {
    if (checkViewers()) {
      zoomToCube('top');
    }
  },
  'bottom': function () {
    if (checkViewers()) {
      zoomToCube('bottom');
    }
  },
  'left': function () {
    if (checkViewers()) {
      zoomToCube('left');
    }
  },
  'right': function () {
    if (checkViewers()) {
      zoomToCube('right');
    }
  }
};

var faces = {
  'front': new THREE.Vector3(0,0,1),
  'back': new THREE.Vector3(0,0,-1),
  'top': new THREE.Vector3(0,1,0),
  'bottom': new THREE.Vector3(0,-1,0),
  'left': new THREE.Vector3(-1,0,0),
  'right': new THREE.Vector3(1,0,0)
};

var faceUps = {
  'top': new THREE.Vector3(0, 1, 0),
  'bottom': new THREE.Vector3(0, 1, 0)
};

var model_state = {};

function reset_model_state() {
    model_state.zoom_factor = 0;
    model_state.explode_factor = 0;
    model_state.isolate_id = [];
    model_state.cut_planes = [];

}

function init_connection() {
    var socket = io();
    socket.on('lmv-command', function(msg) {
        if (msg.name === "load") {
            reset_model_state();
            launchViewer(msg.value);
        }
        else if (msg.name === "zoom") {
            model_state.zoom_factor = parseFloat(msg.value);
            apply_zoom_to_cameras(model_state.zoom_factor);
        }
        else if (msg.name === "explode") {
            model_state.explode_factor = parseFloat(msg.value);
            xfac = Math.abs(model_state.explode_factor - exp) / 10;
            apply_to_viewers('explode', model_state.explode_factor);
        }
        else if (msg.name === "isolate") {
            model_state.isolate_id = msg.value;
            apply_to_viewers('isolateById', model_state.isolate_id);
        }
        else if (msg.name == "section") {
            model_state.cut_planes = msg.value.map(function(vec) {
                return new THREE.Vector4(vec.x, vec.y, vec.z, vec.w);
            });
            apply_to_viewers('setCutPlanes', model_state.cut_planes);
        }
    });
}

function initialize() {
  // Populate our initial UI with a set of buttons, one for each
  // function in the Buttons object

  var panel = document.getElementById('control');
  for (var name in buttons) {
    var fn = buttons[name];

    var button = document.createElement('div');
    button.classList.add('cmd-btn');

    // Replace any underscores with spaces before setting the
    // visible name

    button.innerHTML = name;
    button.onclick = (function (name) {
      return function () { name(); };
    })(fn);

    // Add the button with a space under it

    panel.appendChild(button);
    panel.appendChild(document.createTextNode('\u00a0'));
  }

  if (false){ //annyang) {

    // Add our buttons and commands to annyang

    annyang.addCommands(buttons);
    annyang.addCommands(commands);

    // Start listening

    //annyang.debug(true);
    annyang.start({ autoRestart: true, continuous: true });
  }
}

function checkViewers() {
  if (viewerLeft && viewerRight)
    return viewerLeft.running && viewerRight.running;
  return false;
}

function launchViewer(docId, upVec, zoomFunc) {
  updatingLeft = false;
  updatingRight = false;
  leftPos = null;
  baseDir = null;
  upVector = null;
  initLeftPos = null;
  initZoom = null;
  expFac = 0;
  exp = 0;
  direction = true;

  // Assume the default "world up vector" of the Y-axis
  // (only atypical models such as Morgan and Front Loader require
  // the Z-axis to be set as up)

  if (typeof upVec == 'undefined') {
    upVec = new THREE.Vector3(0, 1, 0);
  }
  else {
    faces = {
      'front': new THREE.Vector3(0, -1, 0),
      'back': new THREE.Vector3(0, 1, 0),
      'top': new THREE.Vector3(0, 0, 1),
      'bottom': new THREE.Vector3(0, 0, -1),
      'left': new THREE.Vector3(-1, 0, 0),
      'right': new THREE.Vector3(1, 0, 0)
    }
    faceUps = {
      'top': new THREE.Vector3(0, -1, 0),
      'bottom': new THREE.Vector3(0, -1, 0)
    }
  }

  // Ask for the page to be fullscreen
  // (can only happen in a function called from a
  // button-click handler or some other UI event)

  requestFullscreen();

  // Hide the controls that brought us here

  var controls = document.getElementById('control');
  controls.style.visibility = 'hidden';

  // Bring the layer with the viewers to the front
  // (important so they also receive any UI events)

  var layer1 = document.getElementById('layer1');
  var layer2 = document.getElementById('layer2');
  layer1.style.zIndex = 1;
  layer2.style.zIndex = 2;

  // Store the up vector in a global for later use

  upVector = upVec.clone();

  // The same for the optional Initial Zoom function

  initZoom =
    typeof zoomFunc !== 'undefined' ?
      zoomFunc :
      null;

  // Get our access token from the internal web-service API

  $.get(
    window.location.protocol + '//' +
    window.location.host + '/api/token',
    function (accessTokenResponse) {

      // Specify our options, including the provided document ID

      var options = {};
      options.env = 'AutodeskProduction';
      options.accessToken = accessTokenResponse.access_token;
      if (docId)
      {
        options.document = docId;
      }

      // Create and initialize our two 3D viewers
      if (!viewerLeft) {
        var elem = document.getElementById('viewLeft');
        viewerLeft = new Autodesk.Viewing.Viewer3D(elem, {});

        Autodesk.Viewing.Initializer(options, function () {
          viewerLeft.initialize();
          loadDocument(viewerLeft, options.document);
        });
      } else {
          loadDocument(viewerLeft, options.document);
      }

      if (!viewerRight) {
          elem = document.getElementById('viewRight');
          viewerRight = new Autodesk.Viewing.Viewer3D(elem, {});

          Autodesk.Viewing.Initializer(options, function () {
            viewerRight.initialize();
            loadDocument(viewerRight, options.document);
          });
      } else {
         loadDocument(viewerRight, options.document);
      }
    }
  );
}

function loadDocument(viewer, docId) {
  // The viewer defaults to the full width of the container,
  // so we need to set that to 50% to get side-by-side

  viewer.container.style.width = '50%';
  viewer.resize();

  // Let's zoom in and out of the pivot - the screen
  // real estate is fairly limited - and reverse the
  // zoom direction

  viewer.navigation.setZoomTowardsPivot(true);
  viewer.navigation.setReverseZoomDirection(true);
  viewer.setLightPreset(0);

  if (docId != null) {

    if (docId.substring(0, 4) !== 'urn:')
      docId = 'urn:' + docId;

    Autodesk.Viewing.Document.load(docId,
      function (document) {

        // Boilerplate code to load the contents

        var geometryItems = [];

        if (geometryItems.length == 0) {
          geometryItems =
            Autodesk.Viewing.Document.getSubItemsWithProperties(
              document.getRootItem(),
              { 'type': 'geometry', 'role': '3d' },
              true
            );
        }
        if (geometryItems.length > 0) {
          viewer.load(document.getViewablePath(geometryItems[0]));
        }

        // Add our custom progress listener and set the loaded
        // flags to false

        leftLoaded = rightLoaded = cleanedModel = false;
        viewer.addEventListener('progress', progressListener);
      },
      function (errorMsg, httpErrorCode) {
        var container = document.getElementById('viewerLeft');
        if (container) {
          alert('Load error ' + errorMsg);
        }
      }
    );
  }
}

// Progress listener to set the view once the data has started
// loading properly (we get a 5% notification early on that we
// need to ignore - it comes too soon)

function progressListener(e) {

  // If we haven't cleaned this model's materials and set the view
  // and both viewers are sufficiently ready, then go ahead

  if (!cleanedModel &&
    ((e.percent > 0.1 && e.percent < 5) || e.percent > 5)) {

    if (e.target.clientContainer.id === 'viewLeft')
      leftLoaded = true;
    else if (e.target.clientContainer.id === 'viewRight')
      rightLoaded = true;

    if (leftLoaded && rightLoaded && !cleanedModel) {

      if (initZoom) {

        // Iterate the materials to change any red ones to grey

        // (We only need this for the Morgan model, which has
        // translation issues from Fusion 360... which is also
        // the only model to provide an initial zoom function)

        /*
        for (var p in viewerLeft.impl.matman().materials) {
          var m = viewerLeft.impl.matman().materials[p];
          if (m.color.r >= 0.5 && m.color.g == 0 && m.color.b == 0) {
            m.color.r = m.color.g = m.color.b = 0.5;
            m.needsUpdate = true;
          }
        }
        for (var p in viewerRight.impl.matman().materials) {
          var m = viewerRight.impl.matman().materials[p];
          if (m.color.r >= 0.5 && m.color.g == 0 && m.color.b == 0) {
            m.color.r = m.color.g = m.color.b = 0.5;
            m.needsUpdate = true;
          }
        }
        */

        // If provided, use the "initial zoom" function

        initZoom();
      }

      setTimeout(
        function () {
          initLeftPos = viewerLeft.navigation.getPosition();

          transferCameras(true);
        },
        500
      );

      watchTilt();

      cleanedModel = true;
    }
  }
  else if (cleanedModel && e.percent >= 10) {

    // If we have already cleaned and are even further loaded,
    // remove the progress listeners from the two viewers and
    // watch the cameras for updates

    unwatchProgress();

    watchCameras();

    if (model_state.zoom_factor) {
        apply_zoom_to_cameras(model_state.zoom_factor);
    }

    if (model_state.explode_factor) {
        apply_to_viewers('explode', model_state.explode_factor);
    }

    if (model_state.isolate_id) {
        apply_to_viewers('isolateById', model_state.isolate_id);
    }

    if (model_state.cut_planes) {
        apply_to_viewers('setCutPlanes', model_state.cut_planes);
    }
  }
}

function requestFullscreen() {

  // Must be performed from a UI event handler

  var el = document.documentElement;
  if (el.requestFullScreen)
    el.requestFullScreen();
  else if (el.mozRequestFullScreen)
    el.mozRequestFullScreen();
  else if (el.webkitRequestFullScreen)
    el.webkitRequestFullScreen();
  else if (el.msRequestFullscreen)
    el.msRequestFullscreen();
}

// Add and remove the pre-viewer event handlers

function watchCameras() {
  viewerLeft.addEventListener('cameraChanged', left2right);
  viewerRight.addEventListener('cameraChanged', right2left);
}

function unwatchCameras() {
  viewerLeft.removeEventListener('cameraChanged', left2right);
  viewerRight.removeEventListener('cameraChanged', right2left);
}

function unwatchProgress() {
  viewerLeft.removeEventListener('progress', progressListener);
  viewerRight.removeEventListener('progress', progressListener);
}

function watchTilt() {
  if (window.DeviceOrientationEvent)
    window.addEventListener('deviceorientation', orb);
}

// Event handlers for the cameraChanged events

function left2right() {
  if (!updatingRight) {
    updatingLeft = true;
    transferCameras(true);
    setTimeout(function () { updatingLeft = false; }, 500);
  }
}

function right2left() {
  if (!updatingLeft) {
    updatingRight = true;
    transferCameras(false);
    setTimeout(function () { updatingRight = false; }, 500);
  }
}

// And for the deviceorientation event

function orb(e) {

  if (e.alpha && e.gamma) {


    // Remove our handlers watching for camera updates,
    // as we'll make any changes manually
    // (we won't actually bother adding them back, afterwards,
    // as this means we're in mobile mode and probably inside
    // a Google Cardboard holder)

    unwatchCameras();

    if (checkViewers()) {

      // gamma is the front-to-back in degrees (with
      // this screen orientation) with +90/-90 being
      // vertical and negative numbers being 'downwards'
      // with positive being 'upwards'

      var ab = Math.abs(e.beta);
      var flipped =
        (ab < 90 && e.gamma < 0) || (ab > 90 && e.gamma > 0);
      var vert =
        ((flipped ? e.gamma : -e.gamma) + (ab < 90 ? 90 : -90))
        * deg2rad;

      // When the orientation changes, reset the base direction

      if (wasFlipped != flipped) {

        // If the angle goes below/above the horizontal, we don't
        // flip direction (we let it go a bit further)

        if (Math.abs(e.gamma) < 45) {
          flipped = wasFlipped;
        }
        else {

          // Our base direction allows us to make relative horizontal
          // rotations when we rotate left & right

          wasFlipped = flipped;
          baseDir = e.alpha;
        }
      }
      // alpha is the compass direction the device is
      // facing in degrees. This equates to the
      // left - right rotation in landscape
      // orientation (with 0-360 degrees)

      var horiz = (e.alpha - baseDir) * deg2rad;

      /*
      var h = (e.alpha - baseDir);
      var v =
        ((flipped ? e.gamma : -e.gamma) + (ab < 90 ? 90 : -90));
      function round(x) { return Math.round(x * 100) / 100; }
      console.log(
        'A:' + round(e.alpha) +
        ' B: ' + round(e.beta) +
        ' G: ' + round(e.gamma) +
        ' V:' + round(v) +
        ' H:' + round(h) +
        ' F:' + flipped
      );
      */

      orbitViews(vert, horiz);
    }
  }
}

function transferCameras(leftToRight) {

  // The direction argument dictates the source and target

  var source = leftToRight ? viewerLeft : viewerRight;
  var target = leftToRight ? viewerRight : viewerLeft;

  var pos = source.navigation.getPosition();
  var trg = source.navigation.getTarget();

  // Set the up vector manually for both cameras

  source.navigation.setWorldUpVector(upVector);
  target.navigation.setWorldUpVector(upVector);

  // Get the new position for the target camera

  var up = source.navigation.getCameraUpVector();

  // Get the position of the target camera

  var newPos = offsetCameraPos(source, pos, trg, leftToRight);

  // Save the left-hand camera position: device tilt orbits
  // will be relative to this point

  leftPos = leftToRight ? pos : newPos;

  // Zoom to the new camera position in the target

  zoom(target, newPos, trg, up);
}

function getDistance(v1, v2) {

  var diff = v1.clone().sub(v2);
  return diff.length();
}

function offsetCameraPos(source, pos, trg, leftToRight) {

  // Use a small fraction of the distance for the camera offset

  var disp = getDistance(pos, trg) * 0.04;

  // Clone the camera and return its X translated position

  var clone = source.autocamCamera.clone();
  clone.translateX(leftToRight ? disp : -disp);
  return clone.position;
}

function orbitViews(vert, horiz) {

  if (!leftPos)
    return;

  // We'll rotate our position based on the initial position
  // and the target will stay the same

  var pos = leftPos.clone();
  var trg = viewerLeft.navigation.getTarget();

  // Start by applying the left/right orbit
  // (we need to check the up/down value, though)

  if (vert < 0)
    horiz = horiz + Math.PI;

  var zAxis = upVector.clone();
  pos.applyAxisAngle(zAxis, horiz);

  // Now add the up/down rotation

  var axis = trg.clone().sub(pos).normalize();
  axis.cross(zAxis);
  pos.applyAxisAngle(axis, -vert);

  // Determine the camera up vector: this is important if
  // getting to the extremities, to stop direction flipping

  var camUp = pos.clone().sub(trg).normalize();
  camUp.cross(axis).normalize();
  viewerLeft.navigation.setCameraUpVector(camUp);

  // Zoom in with the lefthand view

  zoom(viewerLeft, pos, trg, camUp);

  // Get a camera slightly to the right

  var pos2 = offsetCameraPos(viewerLeft, pos, trg, true);

  // And zoom in with that on the righthand view, too

  zoom(viewerRight, pos2, trg, camUp);
}

function explode(outwards) {

  if (outwards != direction)
    direction = outwards;

  setTimeout(
    function () {
      exp = exp + (direction ? xfac : -xfac);
      setTimeout(function () { viewerLeft.explode(exp); }, 0);
      setTimeout(function () { viewerRight.explode(exp); }, 0);
      if ((direction && exp < targExp * expFac) ||
        (!direction && exp > targExp * expFac))
        explode(direction);
    },
    50
  );
}

function apply_zoom_to_cameras(val){
    if (viewerLeft) {
        leftPos = zoomAlongCameraDirection2(viewerLeft, val);
    }

    if (viewerRight) {
        transferCameras(true);
    }
}

function apply_to_viewers(func){
    var val = Array.prototype.slice.call(arguments, 1);

    if (viewerLeft) {
        viewerLeft[func].apply(viewerLeft, val);
    }

    if (viewerRight) {
        viewerRight[func].apply(viewerRight, val);
    }
}

function zoomAlongCameraDirection(viewer, factor) {

  var pos = leftPos.clone();
  var trg = viewer.navigation.getTarget();

  var disp = trg.clone().sub(pos).multiplyScalar(factor);
  pos.sub(disp);

  return pos;
}

function zoomAlongCameraDirection2(viewer, factor) {

  var pos = viewer.navigation.getPosition().clone();
  var trg = viewer.navigation.getTarget();

  var disp = pos.sub(trg);
  var dist = disp.length();
  var unit = disp.divideScalar(dist);
  pos = trg.clone().add(unit.multiplyScalar(factor));
  viewer.navigation.setPosition(pos);

  return pos;
}


function zoomInwards(factor) {

  leftPos = zoomAlongCameraDirection(viewerLeft, factor);
  if (!baseDir) {
    orbitViews(0, 0);
  }
}

function zoomToCube(face) {

  var trg = viewerLeft.navigation.getTarget();
  var dist = getDistance(leftPos, trg);

  var pos = faces[face].clone().multiplyScalar(dist);
  var up = faceUps[face];
  zoom(viewerLeft, pos, trg, up);

  transferCameras(true);
  baseDir = null;
}

// Set the camera based on a position, target and optional up vector

function zoom(viewer, pos, trg, up) {

  // Make sure our up vector is correct for this model

  viewer.navigation.setWorldUpVector(upVector, true);

  viewer.navigation.setView(pos, trg);

  if (up) {
    viewer.navigation.setCameraUpVector(up);
  }
}
