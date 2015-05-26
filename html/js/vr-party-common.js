function getViewingOptions() {
    var options = {};
    options.env = 'AutodeskProduction';
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
