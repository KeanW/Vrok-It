// Define a String.startsWith() function

if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str) {
    return this.indexOf(str) === 0;
  };
}


if (typeof String.prototype.ensurePrefix != 'function') {
  String.prototype.ensurePrefix = function (str) {    
    return (this.startsWith(str) ? this : str + this);
  };
}


function getURLParameter(param) {
    var pageURL = window.location.search.substring(1);
    var urlVariables = pageURL.split('&');
    for (var i = 0; i < urlVariables.length; i++) {
        var paramName = urlVariables[i].split('=');
        if (paramName[0] === param) {
            return paramName[1];
        }
    }
    return null;
}


function getViewingOptions() {
    var options = {};
    options.env = 'AutodeskProduction';
    options.useConsolidation = true;
    options.getAccessToken = function(onSuccess) {
        $.get(
            window.location.origin + '/api/token',
            function (accessTokenResponse) {
                onSuccess(
                    accessTokenResponse.access_token,
                    accessTokenResponse.expires_in
                );
            }
        );
    };
    return options;
}


function getScopedViewingOptions(urn) {
    var getToken = function() {
        var token = null;
        jQuery.ajax({
            url: window.location.origin + '/api/token',
            success: function (result) {
                token = result.access_token;
            },
            async: false
        });
        return token;
    };
    var options = {
        'document' : urn.ensurePrefix('urn:'),
        'env' : 'AutodeskProduction',
        'getAccessToken' : getToken,
        'refreshToken' : getToken
    };
    return options;
}


function loadModel(viewer, documentData) {
    viewer.resize();
    viewer.load(
        documentData,
        null,
        function() {
            viewer.navigation.setZoomTowardsPivot(true);
            viewer.navigation.setReverseZoomDirection(true);
            viewer.setLightPreset(0);
        }
    );
}


function getModel(documentData) {
    var geometryItems = [];
    if (geometryItems.length == 0) {
        geometryItems = Autodesk.Viewing.Document.getSubItemsWithProperties(
            documentData.getRootItem(),
            { 'type': 'geometry', 'role': '3d' },
            true
        );
    }
    if (geometryItems.length === 0) {
        return null;
    }
    return documentData.getViewablePath(geometryItems[0]);
}

// From http://davidwalsh.name/essential-javascript-functions
//
// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};