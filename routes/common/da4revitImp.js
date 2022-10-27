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

const { designAutomation }= require('../../config');

const {
    ObjectsApi,
    ProjectsApi, 
    ItemsApi,
    StorageRelationshipsTarget,
    CreateStorageDataRelationships,
    CreateStorageDataAttributes,
    CreateStorageData,
    CreateStorage,
    CreateVersion,
    CreateVersionData,
    CreateVersionDataRelationships,
    CreateItemRelationshipsStorageData,
    CreateItemRelationshipsStorage,
    CreateVersionDataRelationshipsItem,
    CreateVersionDataRelationshipsItemData,

    StorageRelationshipsTargetData,
    BaseAttributesExtensionObject,
} = require('forge-apis');

const AUTODESK_HUB_BUCKET_KEY = 'wip.dm.prod';
var workitemList = [];


///////////////////////////////////////////////////////////////////////
///
///
///////////////////////////////////////////////////////////////////////
function getWorkitemStatus(workItemId, access_token) {

    return new Promise(function (resolve, reject) {

        var options = {
            method: 'GET',
            url: designAutomation.endpoint +'workitems/'+ workItemId,
            headers: {
                Authorization: 'Bearer ' + access_token,
                'Content-Type': 'application/json'
            }
        };

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

///////////////////////////////////////////////////////////////////////
///
///
///////////////////////////////////////////////////////////////////////
function cancelWorkitem(workItemId, access_token) {

    return new Promise(function (resolve, reject) {

        var options = {
            method: 'DELETE',
            url: designAutomation.endpoint +'workitems/'+ workItemId,
            headers: {
                Authorization: 'Bearer ' + access_token,
                'Content-Type': 'application/json'
            }
        };

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


function importExcel(inputRvtS3Url, inputExcS3Url, inputJson, outputRvtS3Url, projectId, createVersionBody, access_token_3Legged, access_token_2Legged){
    return new Promise(function (resolve, reject) {

        const workitemBody = {

            activityId: designAutomation.nickname + '.' + designAutomation.activity_name + '+'+ designAutomation.appbundle_activity_alias,
            arguments: {
                inputFile: {
                    url: inputRvtS3Url,
                    headers:{
                        Authorization: 'Bearer ' + access_token_3Legged.access_token,
                    },
            },
                inputJson: {
                    url: "data:application/json," + JSON.stringify(inputJson)
                },
                inputXls: {
                    url: inputExcS3Url,
                    headers:{
                        Authorization: 'Bearer ' + access_token_2Legged.access_token,
                    },
                },

                outputRvt: {
                    verb: 'put',
                    url: outputRvtS3Url,
                    headers:{
                        Authorization: 'Bearer ' + access_token_3Legged.access_token,
                    },
                },
                onComplete: {
                    verb: "post",
                    url: designAutomation.webhook_url
                }
            }
        };

        var options = {
            method: 'POST',
            url: designAutomation.endpoint+'workitems',
            headers: {
                Authorization: 'Bearer ' + access_token_2Legged.access_token,
                'Content-Type': 'application/json'
            },
            body: workitemBody,
            json: true
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
                workitemList.push({
                    workitemId: resp.id,
                    projectId: projectId,
                    createVersionData: createVersionBody,
                    access_token_3Legged: access_token_3Legged
                })

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
    })    
}


function exportExcel(inputRvtS3Url, inputJson,outputExlUrl, objectInfo, access_token_2Legged, user_token) {

    return new Promise(function (resolve, reject) {

        const workitemBody = {
                activityId: designAutomation.nickname + '.'+designAutomation.activity_name + '+'+ designAutomation.appbundle_activity_alias,
                arguments: {
                    inputFile: {
                        url: inputRvtS3Url,
                        headers:{
                            Authorization: 'Bearer ' + user_token.access_token,
                        },
                    },
                    inputJson: { 
                        url: "data:application/json,"+ JSON.stringify(inputJson)
                     },
                     outputXls: {
                        verb: 'put',
                        url: outputExlUrl,
                        headers:{
                            Authorization: 'Bearer ' + access_token_2Legged.access_token,
                        },
                    },
                    onComplete: {
                        verb: "post",
                        url: designAutomation.webhook_url
                    }
                }
        };    
        var options = {
            method: 'POST',
            url: designAutomation.endpoint+'workitems',
            headers: {
                Authorization: 'Bearer ' + access_token_2Legged.access_token,
                'Content-Type': 'application/json'
            },
            body: workitemBody,
            json: true
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
                workitemList.push({
                    workitemId: resp.id,
                    access_token_2Legged: access_token_2Legged,
                    objectInfo: objectInfo,
                })

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
    })

}

///////////////////////////////////////////////////////////////////////
///
///
///////////////////////////////////////////////////////////////////////
async function getLatestVersionInfo(projectId, fileId, oauth_client, oauth_token) {
    if (projectId === '' || fileId === '') {
        console.log('failed to get lastest version of the file');
        return null;
    }

    // get the storage of the input item version
    const versionItem = await getLatestVersion(projectId, fileId, oauth_client, oauth_token);
    if (versionItem === null) {
        console.log('failed to get lastest version of the file');
        return null;
    }
    return {
        "versionUrl": versionItem.relationships.storage.meta.link.href,
        "versionType": versionItem.attributes.extension.type
    };
}


///////////////////////////////////////////////////////////////////////
///
///
///////////////////////////////////////////////////////////////////////
async function getLatestVersion(projectId, itemId, oauthClient, credentials) {
    const items = new ItemsApi();
    const versions = await items.getItemVersions(projectId, itemId, {}, oauthClient, credentials);
    if(versions === null || versions.statusCode !== 200 ){
        console.log('failed to get the versions of file');
        res.status(500).end('failed to get the versions of file');
        return null;
    }
    return versions.body.data[0];
}


///////////////////////////////////////////////////////////////////////
///
///
///////////////////////////////////////////////////////////////////////
async function getNewCreatedStorageInfo(projectId, folderId, fileName, oauth_client, oauth_token) {

    // create body for Post Storage request
    let createStorageBody = createBodyOfPostStorage(folderId, fileName);

    const project = new ProjectsApi();
    let storage = await project.postStorage(projectId, createStorageBody, oauth_client, oauth_token);
    if (storage === null || storage.statusCode !== 201) {
        console.log('failed to create a storage.');
        return null;
    }
    return {
        "StorageId": storage.body.data.id
    }
}


///////////////////////////////////////////////////////////////////////
///
///
///////////////////////////////////////////////////////////////////////
function createBodyOfPostStorage(folderId, fileName) {
    // create a new storage for the ouput item version
    let createStorage = new CreateStorage();
    let storageRelationshipsTargetData = new StorageRelationshipsTargetData("folders", folderId);
    let storageRelationshipsTarget = new StorageRelationshipsTarget;
    let createStorageDataRelationships = new CreateStorageDataRelationships();
    let createStorageData = new CreateStorageData();
    let createStorageDataAttributes = new CreateStorageDataAttributes();

    createStorageDataAttributes.name = fileName;
    storageRelationshipsTarget.data = storageRelationshipsTargetData;
    createStorageDataRelationships.target = storageRelationshipsTarget;
    createStorageData.relationships = createStorageDataRelationships;
    createStorageData.type = 'objects';
    createStorageData.attributes = createStorageDataAttributes;
    createStorage.data = createStorageData;
    
    return createStorage;
}



///////////////////////////////////////////////////////////////////////
///
///
///////////////////////////////////////////////////////////////////////
function createBodyOfPostVersion(fileId, fileName, storageId, versionType) {

    let createVersionDataRelationshipsItem = new CreateVersionDataRelationshipsItem();
    let createVersionDataRelationshipsItemData = new CreateVersionDataRelationshipsItemData();
    createVersionDataRelationshipsItemData.type = "items";
    createVersionDataRelationshipsItemData.id = fileId;
    createVersionDataRelationshipsItem.data = createVersionDataRelationshipsItemData;

    let createItemRelationshipsStorage = new CreateItemRelationshipsStorage();
    let createItemRelationshipsStorageData = new CreateItemRelationshipsStorageData();
    createItemRelationshipsStorageData.type = "objects";
    createItemRelationshipsStorageData.id = storageId;
    createItemRelationshipsStorage.data = createItemRelationshipsStorageData;

    let createVersionDataRelationships = new CreateVersionDataRelationships();
    createVersionDataRelationships.item = createVersionDataRelationshipsItem;
    createVersionDataRelationships.storage = createItemRelationshipsStorage;

    let baseAttributesExtensionObject = new BaseAttributesExtensionObject();
    baseAttributesExtensionObject.type = versionType;
    baseAttributesExtensionObject.version = "1.0";

    let createStorageDataAttributes = new CreateStorageDataAttributes();
    createStorageDataAttributes.name = fileName;
    createStorageDataAttributes.extension = baseAttributesExtensionObject;

    let createVersionData = new CreateVersionData();
    createVersionData.type = "versions";
    createVersionData.attributes = createStorageDataAttributes;
    createVersionData.relationships = createVersionDataRelationships;

    let createVersion = new CreateVersion();
    createVersion.data = createVersionData;

    return createVersion;
}




module.exports = 
{ 
    getWorkitemStatus, 
    cancelWorkitem, 
    exportExcel,
    importExcel,
    getLatestVersionInfo, 
    getNewCreatedStorageInfo, 
    createBodyOfPostVersion,
    workitemList 
};
