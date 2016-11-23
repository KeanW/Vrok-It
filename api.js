
///////////////////////////////////////////////////////////////////
// Copyright (c) 2014 Autodesk, Inc. All rights reserved
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
///////////////////////////////////////////////////////////////////

var BASE_URL = 'https://developer.api.autodesk.com';

var request = require('request');

function getScopedToken(res, params) {
  request.post(BASE_URL + '/authentication/v1/authenticate',
    { form: params },
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var authResponse = JSON.parse(body);
        res.send(authResponse);
      }
      else {
        console.log("Token error: ");
        if (response && response.statusCode) {
          console.log (response.statusCode);
        }
      }
    }
  );
}

exports.getToken = function (req, res) {

  var params = {
    client_id: process.env.CONSUMER_KEY,
    client_secret: process.env.CONSUMER_SECRET,
    grant_type: 'client_credentials',
    scope: 'data:read'
  }
  getScopedToken(res, params);
};

exports.getUploadToken = function (req, res) {

  var params = {
    client_id: process.env.CONSUMER_KEY,
    client_secret: process.env.CONSUMER_SECRET,
    grant_type: 'client_credentials',
    scope: 'data:read data:write bucket:read bucket:create'
  }
  getScopedToken(res, params);
};

