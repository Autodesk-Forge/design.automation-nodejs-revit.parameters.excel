/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Partner Development
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
/////////////////////////////////////////////////////////////////////
const request = require("request");

///////////////////////////////////////////////////////////////////////
/// Upload the package to AWS url
///////////////////////////////////////////////////////////////////////
function uploadAppBundleAsync( field, data) {

    return new Promise(function (resolve, reject) {
        let myData = field.formData;
        myData.file = data;

        var options = {
            method: 'POST',
            url: field.endpointURL,
            formData: myData,
            headers: {
                'content-type': 'multipart/form-data'
            },
        };
        request(options, function (error, response, body) {
            if (error) {
                reject(error);
            } else {
                let resp;
                try {
                    resp = JSON.parse(body)
                } catch (e) {
                    resp = body
                }
                if (response.statusCode >= 400) {
                    console.log('error code: ' + response.statusCode + ' response message: ' + response.statusMessage);
                    reject({
                        statusCode: response.statusCode,
                        statusMessage: response.statusMessage
                    });
                } else {
                    resolve({
                        statusCode: response.statusCode,
                        headers: response.headers,
                        body: resp
                    });
                }
            }
        });
    });
}



///////////////////////////////////////////////////////////////////////
/// Call the Rest API
///////////////////////////////////////////////////////////////////////
function apiClientCallAsync( requestMethod, url,  access_token, body=null ){
    return new Promise(function (resolve, reject) {

        var options = null;
        switch (requestMethod.toLowerCase()) {
            case 'get':
                options = {
                    method: requestMethod,
                    url: url,
                    headers: {
                        Authorization: 'Bearer ' + access_token,
                        'Content-Type': 'application/json'
                    }
                };
                break;
            case 'post':
            case 'patch':
                options = {
                    method: requestMethod,
                    url: url,
                    headers: {
                        Authorization: 'Bearer ' + access_token,
                        'Content-Type': 'application/json'
                    },
                    body: body,
                    json: true
                };
                break;
            case 'delete':
                options = {
                    method: requestMethod,
                    url: url,
                    headers: {
                        Authorization: 'Bearer ' + access_token,
                        'Content-Type': 'application/json'
                    },
                };
                break;
            default:
                reject({
                    statusCode: 400,
                    statusMessage: 'request method is not supported'
                });
                break;
        }
        request(options, function (error, response, body) {
            if (error) {
                reject(err);
            } else {
                let resp;
                try {
                    resp = JSON.parse(body)
                } catch (e) {
                    resp = body
                }
                if (response.statusCode >= 400) {
                    console.log('error code: ' + response.statusCode + ' response message: ' + response.statusMessage);
                    reject({
                        statusCode: response.statusCode,
                        statusMessage: response.statusMessage
                    });
                } else {
                    resolve({
                        statusCode: response.statusCode,
                        headers: response.headers,
                        body: resp
                    });
                }
            }
        });
    });    
}

module.exports = 
{ 
    uploadAppBundleAsync,
    apiClientCallAsync
};
    