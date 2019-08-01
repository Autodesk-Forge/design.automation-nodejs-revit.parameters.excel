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

const express = require('express');
const { designAutomation }= require('../config');

const {
    ItemsApi,
    VersionsApi,
    BucketsApi,
    ObjectsApi,
    PostBucketsSigned
} = require('forge-apis');

const { OAuth } = require('./common/oauthImp');

const { 
    getWorkitemStatus, 
    cancelWorkitem,
    exportExcel,
    importExcel,
    getLatestVersionInfo, 
    getNewCreatedStorageInfo, 
    createBodyOfPostVersion,
    workitemList 
} = require('./common/da4revitImp')

const SOCKET_TOPIC_WORKITEM = 'Workitem-Notification';
const Temp_Output_File_Name = 'RevitParams.xls';

let router = express.Router();


///////////////////////////////////////////////////////////////////////
/// Middleware for obtaining a token for each request.
///////////////////////////////////////////////////////////////////////
router.use(async (req, res, next) => {
    const oauth = new OAuth(req.session);
    let credentials = await oauth.getInternalToken();
    let oauth_client = oauth.getClient();

    req.oauth_client = oauth_client;
    req.oauth_token = credentials;
    next();
});



///////////////////////////////////////////////////////////////////////
/// Export parameters to Excel from Revit
///////////////////////////////////////////////////////////////////////
router.get('/da4revit/v1/revit/:version_storage/excel', async (req, res, next) => {
    const inputJson = req.query;
    const inputRvtUrl = (req.params.version_storage);

    if ( inputJson === '' || inputRvtUrl === '') {
        res.status(400).end('make sure the input version id has correct value');
        return;
    }

    ////////////////////////////////////////////////////////////////////////////////
    // use 2 legged token for design automation
    const oauth = new OAuth(req.session);
    const oauth_client = oauth.get2LeggedClient();;
    const oauth_token = await oauth_client.authenticate();

    // create the temp output storage
    const bucketKey = designAutomation.revit_IO_Nick_Name.toLowerCase() + '_designautomation';
    const opt = {
        bucketKey: bucketKey,
        policyKey: 'transient',
    }
    try {
        await new BucketsApi().createBucket(opt, {}, oauth_client, oauth_token);
    } catch (err) { // catch the exception while bucket is already there
    };

    try {
        const objectApi = new ObjectsApi();
        const object = await objectApi.uploadObject(bucketKey, Temp_Output_File_Name, 0, '', {}, oauth_client, oauth_token);
        const signedObj = await objectApi.createSignedResource(bucketKey, object.body.objectKey, new PostBucketsSigned(minutesExpiration = 50), {access:'readwrite'}, oauth_client, oauth_token)

        let result = await exportExcel(inputRvtUrl, inputJson, signedObj.body.signedUrl, req.oauth_token, oauth_token);
        if (result === null || result.statusCode !== 200) {
            console.log('failed to export the excel file');
            res.status(500).end('failed to export the excel file');
            return;
        }
        console.log('Submitted the workitem: ' + result.body.id);
        const exportInfo = {
            "workItemId": result.body.id,
            "workItemStatus": result.body.status,
            "ExtraInfo": null
        };
        res.status(200).end(JSON.stringify(exportInfo));
    } catch (err) {
        console.log('get exception while exporting parameters to Excel')
        let workitemStatus = {
            'Status': "Failed"
        };
        global.socketio.emit(SOCKET_TOPIC_WORKITEM, workitemStatus);
        res.status(500).end(err);
    }
});




///////////////////////////////////////////////////////////////////////
/// Import parameters from Excel to Revit
///
///////////////////////////////////////////////////////////////////////
router.post('/da4revit/v1/revit/:version_storage/excel', async (req, res, next) => {
    const inputRvtUrl = req.params.version_storage; // input Url of Revit file
    const inputExcUrl  = req.body.InputExcUrl; // input Url of Excel file
    const inputJson  = req.body.Data;    // input parameters for DA
    const fileItemId   = req.body.ItemUrl; // item url used to get info to upload new version of BIM360 Revit file.
    const fileItemName = req.body.FileItemName; // file name


    if ( inputJson === '' || inputRvtUrl === '' || inputExcUrl === '' || fileItemName === '' || fileItemId === '') {
        res.status(400).end('Missing input data');
        return;
    }

    const params = fileItemId.split('/');
    if( params.length < 3){
        res.status(400).end('input ItemUrl is not in correct format');
    }

    const resourceName = params[params.length - 2];
    if (resourceName !== 'items') {
        res.status(400).end('input ItemUrl is not an item');
        return;
    }

    const resourceId = params[params.length - 1];
    const projectId = params[params.length - 3];

    try {
        const items = new ItemsApi();
        const folder = await items.getItemParentFolder(projectId, resourceId, req.oauth_client, req.oauth_token);
        if(folder === null || folder.statusCode !== 200){
            console.log('failed to get the parent folder.');
            res.status(500).end('failed to get the parent folder');
            return;
        }

        // create storage for the new uploaded Revit vesion
        const storageInfo = await getNewCreatedStorageInfo(projectId, folder.body.data.id, fileItemName, req.oauth_client, req.oauth_token);
        if (storageInfo === null ) {
            console.log('failed to create the storage');
            res.status(500).end('failed to create the storage');
            return;
        }
        const outputUrl = storageInfo.StorageUrl;


        // get the storage of the input item version
        const versionInfo = await getLatestVersionInfo(projectId, resourceId, req.oauth_client, req.oauth_token);
        if (versionInfo === null) {
            console.log('failed to get lastest version of the file');
            res.status(500).end('failed to get lastest version of the file');
            return;
        }

        const createVersionBody = createBodyOfPostVersion(resourceId,fileItemName, storageInfo.StorageId, versionInfo.versionType);
        if (createVersionBody === null ) {
            console.log('failed to create body of Post Version');
            res.status(500).end('failed to create body of Post Version');
            return;
        }


        ////////////////////////////////////////////////////////////////////////////////
        // use 2 legged token for design automation
        const oauth = new OAuth(req.session);
        const oauth_client = oauth.get2LeggedClient();;
        const oauth_token = await oauth_client.authenticate();

        // call to import Excel file to update parameters in Revit
        let result = await importExcel(inputRvtUrl, inputExcUrl, inputJson, outputUrl, projectId, createVersionBody, req.oauth_token, oauth_token);
        if (result === null || result.statusCode !== 200) {
            console.log('failed to import parameters to the revit file');
            res.status(500).end('failed to import parameters to the revit file');
            return;
        }
        console.log('Submitted the workitem: '+ result.body.id);
        const exportInfo = {
            "workItemId": result.body.id,
            "workItemStatus": result.body.status,
            "ExtraInfo": null
        };
        res.status(200).end(JSON.stringify(exportInfo));

    } catch (err) {
        console.log('get exception while importing parameters from Excel')
        let workitemStatus = {
            'Status': "Failed"
        };
        global.socketio.emit(SOCKET_TOPIC_WORKITEM, workitemStatus);
        res.status(500).end(err);
    }
});


///////////////////////////////////////////////////////////////////////
/// Cancel the file workitem process if possible.
/// NOTE: This may not successful if the workitem process is already started
///////////////////////////////////////////////////////////////////////
router.delete('/da4revit/v1/revit/:workitem_id', async(req, res, next) =>{

    const workitemId = req.params.workitem_id;
    try {
        const oauth = new OAuth(req.session);
        const oauth_client = oauth.get2LeggedClient();;
        const oauth_token = await oauth_client.authenticate();
        await cancelWorkitem(workitemId, oauth_token.access_token);
        let workitemStatus = {
            'WorkitemId': workitemId,
            'Status': "Cancelled"
        };

        const workitem = workitemList.find( (item) => {
            return item.workitemId === workitemId;
        } )
        if( workitem === undefined ){
            console.log('the workitem is not in the list')
            return;
        }
        console.log('The workitem: ' + workitemId + ' is cancelled')
        let index = workitemList.indexOf(workitem);
        workitemList.splice(index, 1);

        global.MyApp.SocketIo.emit(SOCKET_TOPIC_WORKITEM, workitemStatus);
        res.status(204).end();
    } catch (err) {
        res.status(500).end("error");
    }
})

///////////////////////////////////////////////////////////////////////
/// Query the status of the workitem
///////////////////////////////////////////////////////////////////////
router.get('/da4revit/v1/revit/:workitem_id', async(req, res, next) => {
    const workitemId = req.params.workitem_id;
    try {
        const oauth = new OAuth(req.session);
        const oauth_client = oauth.get2LeggedClient();;
        const oauth_token = await oauth_client.authenticate();        
        let workitemRes = await getWorkitemStatus(workitemId, oauth_token.access_token);
        res.status(200).end(JSON.stringify(workitemRes.body));
    } catch (err) {
        res.status(500).end("error");
    }
})


///////////////////////////////////////////////////////////////////////
///
///////////////////////////////////////////////////////////////////////
router.post('/callback/designautomation', async (req, res, next) => {
    // Best practice is to tell immediately that you got the call
    // so return the HTTP call and proceed with the business logic
    res.status(202).end();

    let workitemStatus = {
        'WorkitemId': req.body.id,
        'Status': "Success",
        'ExtraInfo' : null
    };
    if (req.body.status === 'success') {
        const workitem = workitemList.find( (item) => {
            return item.workitemId === req.body.id;
        } )

        if( workitem === undefined ){
            console.log('The workitem: ' + req.body.id+ ' to callback is not in the item list')
            return;
        }
        let index = workitemList.indexOf(workitem);

        if (workitem.createVersionData !== null) {
            workitemStatus.Status = 'Success';
            global.MyApp.SocketIo.emit(SOCKET_TOPIC_WORKITEM, workitemStatus);
            console.log("Create new version by the workitem:  " + workitem.workitemId);

            try {
                const versions = new VersionsApi();
                version = await versions.postVersion(workitem.projectId, workitem.createVersionData, req.oauth_client, workitem.access_token_3Legged);
                if (version === null || version.statusCode !== 201) {
                    console.log('Falied to create a new version of the file');
                    workitemStatus.Status = 'Failed'
                } else {
                    console.log('Successfully created a new version of the file');
                    workitemStatus.Status = 'Completed';
                }
            } catch (err) {
                console.log(err);
                workitemStatus.Status = 'Failed';
            }
        } else {
            workitemStatus.Status = 'Completed';
            workitemStatus.ExtraInfo = workitem.outputUrl;
        }
        global.MyApp.SocketIo.emit(SOCKET_TOPIC_WORKITEM, workitemStatus);
        // Remove the workitem after it's done
        workitemList.splice(index, 1);



    }else{
        // Report if not successful.
        workitemStatus.Status = 'Failed';
        global.MyApp.SocketIo.emit(SOCKET_TOPIC_WORKITEM, workitemStatus);
        console.log(req.body);
    }
    return;
})



module.exports = router;
