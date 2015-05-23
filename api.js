
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

var CONSUMER_KEY = '';
var CONSUMER_SECRET = '';
var BASE_URL = 'https://developer.api.autodesk.com';

var request = require('request');

///////////////////////////////////////////////////////////////////
//  
//
///////////////////////////////////////////////////////////////////
exports.getToken = function (req, res) {

  var params = {
    client_id: CONSUMER_KEY,
    client_secret: CONSUMER_SECRET,
    grant_type: 'client_credentials'
  }

  request.post(BASE_URL + '/authentication/v1/authenticate',
    { form: params },
    function (error, response, body) {
      if (!error && response.statusCode == 200) {                
        var authResponse = JSON.parse(body);
        res.send(authResponse.access_token);
      }
    }
  );
};
