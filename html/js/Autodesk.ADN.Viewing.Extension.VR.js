/////////////////////////////////////////////////////////////////////
// Autodesk.ADN.Viewing.Extension.VR
// by Philippe Leefsma, May 2015
//
/////////////////////////////////////////////////////////////////////
AutodeskNamespace("Autodesk.ADN.Viewing.Extension");

Autodesk.ADN.Viewing.Extension.VR = function (viewer, options) {

  Autodesk.Viewing.Extension.call(this, viewer, options);

  var _panel = null;

  /////////////////////////////////////////////////////////////////
  // Extension load callback
  //
  /////////////////////////////////////////////////////////////////
  this.load = function () {

    _panel = new Panel(
      viewer.container,
      guid());

    if(options.requestUserGesture) {

      _panel.setVisible(true);
    }
    else {

      activateVR();
    }

    console.log('Autodesk.ADN.Viewing.Extension.VR loaded');

    return true;
  }

  /////////////////////////////////////////////////////////////////
  // Activate VR
  //
  /////////////////////////////////////////////////////////////////
  function activateVR() {

    // viewer.setProgressiveRendering(false);

    //hide controls
    $('.adsk-control-group').each(function(){

      $(this).find('>.adsk-button').each(function(){

        $(this).css({
          'display':'none'
        });
      });
    });
  
    $('.homeViewWrapper').css({ 'display':'none' });

    viewer.loadExtension('Autodesk.Viewing.WebVR', { experimental: [ 'webVR_orbitModel' ] });

    viewer.displayViewCube(false);

    setTimeout(function() {

      //viewer.setActiveNavigationTool('vr');

    }, 3000);      
  }

  /////////////////////////////////////////////////////////////////
  //  Extension unload callback
  //
  /////////////////////////////////////////////////////////////////
  this.unload = function () {

    _panel.setVisible(false);

    console.log('Autodesk.ADN.Viewing.Extension.VR unloaded');

    return true;
  }

  /////////////////////////////////////////////////////////////////
  // Generates random guid to use as DOM id
  //
  /////////////////////////////////////////////////////////////////
  function guid() {

    var d = new Date().getTime();

    var guid = 'xxxx-xxxx-xxxx-xxxx'.replace(
      /[xy]/g,
      function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
      });

    return guid;
  }

  /////////////////////////////////////////////////////////////////
  // The demo Panel
  //
  /////////////////////////////////////////////////////////////////
  var Panel = function(
    parentContainer, id) {

    var _thisPanel = this;

    _thisPanel.content = document.createElement('div');

    Autodesk.Viewing.UI.DockingPanel.call(
      this,
      parentContainer,
      id,
      'Switch to VR Mode?',
      {shadow:true});

    $(_thisPanel.container).addClass('vr-selector');

    var w = 270;
    var h = 115;

    $(_thisPanel.container).css({

      'left'  : 'calc(50vw - ' + w * 0.5 + 'px)',
      'top'   : 'calc(50vh - ' + h * 0.5 + 'px)',
      'width' : w + 'px',
      'height': h + 'px',
      'resize': 'none'
    });

    /////////////////////////////////////////////////////////////
    // Custom html
    //
    /////////////////////////////////////////////////////////////
    var html = [

      '<form class="form-inline vr-selector-controls" role="form">',

        '<button class="btn btn-success btn-vr-selector" id="' + id + '-ok-btn">',
          '<span class="glyphicon glyphicon-fullscreen" aria-hidden="true"> ',
          '</span> ',
          'OK',
        '</button>',

        '&nbsp;',

        '<button class="btn btn-danger btn-vr-selector" id="' + id + '-cancel-btn">',
          '<span class="glyphicon glyphicon-remove" aria-hidden="true"> ',
          '</span> ',
          'Cancel',
        '</button>',

      '</form>'
    ];

    $(_thisPanel.container).append(html.join('\n'));

    $('#' + id + '-ok-btn').click(onOkButtonClicked);

    $('#' + id + '-cancel-btn').click(onCancelButtonClicked);

    /////////////////////////////////////////////////////////////
    // button clicked handler
    //
    /////////////////////////////////////////////////////////////
    function onOkButtonClicked(event) {

      event.preventDefault();

      _thisPanel.setVisible(false);

      activateVR();
    }

    function onCancelButtonClicked(event) {

      event.preventDefault();

      _thisPanel.setVisible(false);
    }

    /////////////////////////////////////////////////////////////
    // setVisible override (not used in that sample)
    //
    /////////////////////////////////////////////////////////////
    _thisPanel.setVisible = function(show) {

      Autodesk.Viewing.UI.DockingPanel.prototype.
        setVisible.call(this, show);
    }

    /////////////////////////////////////////////////////////////
    // initialize override
    //
    /////////////////////////////////////////////////////////////
    _thisPanel.initialize = function() {

      this.title = this.createTitleBar(
        this.titleLabel ||
        this.container.id);
      
    }
  }

  /////////////////////////////////////////////////////////////
  // Set up JS inheritance
  //
  /////////////////////////////////////////////////////////////
  Panel.prototype = Object.create(
    Autodesk.Viewing.UI.DockingPanel.prototype);

  Panel.prototype.constructor = Panel;

  /////////////////////////////////////////////////////////////
  // Add needed CSS
  //
  /////////////////////////////////////////////////////////////
  var css = [

    'form.vr-selector-controls{',
      'margin: 20px;',
    '}',

    'input.vr-selector-name {',
      'height: 30px;',
      'margin-left: 5px;',
      'margin-bottom: 5px;',
      'margin-top: 5px;',
      'border-radius:5px;',
    '}',

    'div.vr-selector {',
      'top: 0px;',
      'left: 0px;',
      'width: 270px;',
      'height: 115px;',
      'resize: none;',
    '}',

    'div.vr-selector-minimized {',
      'height: 34px;',
      'min-height: 34px',
    '}',

    'button.btn-vr-selector {',
      'width: 80px',
    '}'

  ].join('\n');

  $('<style type="text/css">' + css + '</style>').appendTo('head');
};

Autodesk.ADN.Viewing.Extension.VR.prototype =
  Object.create(Autodesk.Viewing.Extension.prototype);

Autodesk.ADN.Viewing.Extension.VR.prototype.constructor =
  Autodesk.ADN.Viewing.Extension.VR;

Autodesk.Viewing.theExtensionManager.registerExtension(
  'Autodesk.ADN.Viewing.Extension.VR',
  Autodesk.ADN.Viewing.Extension.VR);