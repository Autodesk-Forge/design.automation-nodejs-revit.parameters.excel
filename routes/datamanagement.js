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
const fs = require('fs');
const { FoldersApi, ObjectsApi, BucketsApi, PostBucketsSigned } = require('forge-apis');
const { OAuth } = require('./common/oauthImp');
const multer  = require('multer');
const { credentials }= require('../config');

const { 
    createFolderBody, 
    deleteFolder,
    getHubs,
    getProjects,
    getFolders,
    getFolderContents,
    getVersions
} = require('./common/datamanagementImp');

const express = require('express');
let router = express.Router();

router.get('/datamanagement/v1', async (req, res) => {
    // The id querystring parameter contains what was selected on the UI tree, make sure it's valid
    const href = decodeURIComponent(req.query.id);
    if (href === '') {
        res.status(500).end();
        return;
    }

    // Get the access token
    const oauth = new OAuth(req.session);
    const internalToken = await oauth.getInternalToken();
    if (href === '#') {
        // If href is '#', it's the root tree node
        getHubs(oauth.getClient(), internalToken, res);
    } else {
        // Otherwise let's break it by '/'
        const params = href.split('/');
        const resourceName = params[params.length - 2];
        const resourceId = params[params.length - 1];
        switch (resourceName) {
            case 'hubs':
                getProjects(resourceId, oauth.getClient(), internalToken, res);
                break;
            case 'projects':
                // For a project, first we need the top/root folder
                const hubId = params[params.length - 3];
                getFolders(hubId, resourceId/*project_id*/, oauth.getClient(), internalToken, res);
                break;
            case 'folders':
                {
                    const projectId = params[params.length - 3];
                    getFolderContents(projectId, resourceId/*folder_id*/, oauth.getClient(), internalToken, res);
                    break;
                }
            case 'items':
                {
                    const projectId = params[params.length - 3];
                    getVersions(projectId, resourceId/*item_id*/, oauth.getClient(), internalToken, res);
                    break;
                }
        }
    }
});

// delete a folder
router.delete('/datamanagement/v1/folder/:folder_url', async (req, res )=>{
    const href = req.params.folder_url;
    if (href === '' || href === null) {
        res.status(400).end('the folder url is not specified');
        return;
    }

    const params = href.split('/');
    if(params.length < 3 ){
        res.status(400).end('the folder url is not in correct format ');
        return;
    }
    const projectId = params[params.length-3];
    const folderId  = params[params.length-1];

    try {
        const oauth = new OAuth(req.session);
        const internalToken = await oauth.getInternalToken();
        await deleteFolder(projectId, folderId, internalToken.access_token);
        res.status(204).end();
    } catch (err) {
        res.status(500).end("error");
    }
})

// create a subfolder
router.post('/datamanagement/v1/folder', async (req, res) => {
    const href = req.body.id;
    const folderName = req.body.name;
    if (href === '' || folderName === '') {
        res.status(500).end();
        return;
    }

    if (href === '#') {
        res.status(500).end('not supported item');
        return;
    }

    const params = href.split('/');
    if (params.length < 3) {
        res.status(500).end('selected item id has problem');
        return;
    }

    const resourceName = params[params.length - 2];
    if (resourceName !== 'folders') {
        res.status(500).end('not supported item');
        return;
    }

    const projectId = params[params.length - 3];
    const folderId  = params[params.length - 1];

    try {
        // Get the access token
        const oauth = new OAuth(req.session);
        const internalToken = await oauth.getInternalToken();

        const folders = new FoldersApi();
        const folderBody = createFolderBody(folderName, folderId);
        const newFolder = await folders.postFolder(projectId, folderBody, oauth.getClient(), internalToken);
        console.log(newFolder);
        if (newFolder === null || newFolder.statusCode !== 201) {
            console.log('failed to create a folder.');
            res.status(500).end('failed to create a folder.');
            return;
        }
        let folderInfo = {
            id: newFolder.body.links.self.href,
            type: newFolder.body.data.type
        }
        res.status(200).end(JSON.stringify(folderInfo));
    } catch (err) {
        console.log('failed to create a folder.');
        res.status(500).end('failed to create a folder.');
    }
})

// POST /api/forge/oss/objects - uploads new object to given bucket.
// Request body must be structured as 'form-data' dictionary
// with the uploaded file under "fileToUpload" key, and the bucket name under "bucketKey".
router.post('/datamanagement/v1/oss/object', multer({ dest: 'uploads/' }).single('fileToUpload'), async (req, res, next) => {
    fs.readFile(req.file.path, async (err, data) => {
        if (err) {
            next(err);
        }
        // use 2 legged token for design automation
        const oauth = new OAuth(req.session);
        const oauth_client = oauth.get2LeggedClient();;
        const oauth_token = await oauth_client.authenticate();

        const bucketKey = credentials.client_id.toLowerCase() + '_designautomation';
        const opt = {
            bucketKey: bucketKey,
            policyKey: 'transient',
        }
        try {
            await new BucketsApi().createBucket(opt, {}, oauth_client, oauth_token);
        }catch(err){
        };

        try{
            const objectApi = new ObjectsApi();
            // Upload an object to bucket using [ObjectsApi](https://github.com/Autodesk-Forge/forge-api-nodejs-client/blob/master/docs/ObjectsApi.md#uploadObject).
            const object = await objectApi.uploadObject(bucketKey, req.file.originalname, data.length, data, {}, oauth_client, oauth_token);
            const signedObj =  await objectApi.createSignedResource(bucketKey, object.body.objectKey, new PostBucketsSigned(minutesExpiration=50), {access:'readwrite'}, oauth_client, oauth_token )
            res.status(200).end( signedObj.body.signedUrl);
        } catch (err) {
            next(err);
        }
    });
});


module.exports = router;
