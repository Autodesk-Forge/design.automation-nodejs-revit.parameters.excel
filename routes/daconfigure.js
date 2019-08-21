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
const fs = require('fs');
const { designAutomation }= require('../config');

const { OAuth } = require('./common/oauthImp');

const{
    uploadAppBundleAsync,
    apiClientCallAsync    
} = require ('./common/daconfigureImp')

let router = express.Router();

const APP_BUNDLE_FOLDER= './public/bundles/';



///////////////////////////////////////////////////////////////////////
/// Middleware for obtaining a token for each request.
///////////////////////////////////////////////////////////////////////
router.use(async (req, res, next) => {
    const oauth = new OAuth(req.session);
    req.oauth_client = oauth.get2LeggedClient();
    req.oauth_token = await req.oauth_client.authenticate();     
    next();   
});


///////////////////////////////////////////////////////////////////////
/// Query the list of the engines
///////////////////////////////////////////////////////////////////////
router.get('/designautomation/engines', async(req, res, next) => {
    try {
        let workitemRes = await apiClientCallAsync( 'GET',  designAutomation.URL.GET_ENGINES_URL, req.oauth_token.access_token);
        const engineList = workitemRes.body.data.filter( (engine ) => {
            return (engine.indexOf('Revit') >= 0)
        })
        res.status(200).end(JSON.stringify(engineList));
    } catch (err) {
        res.status(500).end("error");
    }
})


///////////////////////////////////////////////////////////////////////
/// Query the list of the activities
///////////////////////////////////////////////////////////////////////
router.get('/designautomation/activities', async(req, res, next) => {
    try {
        const activitiesRes = await apiClientCallAsync( 'GET',  designAutomation.URL.ACTIVITIES_URL, req.oauth_token.access_token);
        res.status(200).end(JSON.stringify(activitiesRes.body.data));
    } catch (err) {
        res.status(500).end("error");
    }
})


///////////////////////////////////////////////////////////////////////
/// Query the list of the appbundle packages
///////////////////////////////////////////////////////////////////////
router.get('/appbundles', async(req, res, next) => {
    try {
        const fileArray = fs.readdirSync(APP_BUNDLE_FOLDER);
        const zipFile = fileArray.filter( fileName => {
            return (fileName.indexOf('.zip') >= 0)
        })    
        res.status(200).end(JSON.stringify(zipFile));
    } catch (err) {
        res.status(500).end("Failed to find appbundle package");
    }
})

///////////////////////////////////////////////////////////////////////
/// Create|Update Appbundle version
///////////////////////////////////////////////////////////////////////
router.post('/designautomation/appbundles', async( req, res, next) => {
    const fileName = req.body.fileName;
    const engineName  = req.body.engine;

    const zipFileName = fileName + '.zip';
    const appBundleName = fileName + 'AppBundle';

    // check if ZIP with bundle is existing
    const localAppPath = APP_BUNDLE_FOLDER + zipFileName;
    if (!fs.existsSync(localAppPath)) {
        res.status(400).end(localAppPath + " is not existing");
        return;
    }

    // get defined app bundles
    let appBundles = null;    
    try {
        const appBundlesRes = await apiClientCallAsync( 'GET', designAutomation.URL.APPBUNDLES_URL, req.oauth_token.access_token);
        if( appBundlesRes.body && appBundlesRes.body.data ){
            appBundles = appBundlesRes.body.data;
        }
    } catch (err) {
        console.log("Failed to get the AppBundles");
        res.status(400).end("Failed to get the AppBundles");
        return;
    }

    const qualifiedAppBundleId = designAutomation.nickname + '.' + appBundleName + '+' + designAutomation.appbundle_activity_alias;
    var newAppVersion = null;
    if( appBundles.includes( qualifiedAppBundleId ) ){
        try{
            const appBundleSpec = {
                "Engine" : engineName,
                "Description" : "Export and Import Revit parameters with Excel AppBundle",
            }
            const createAppVersionUrl =  designAutomation.URL.CREATE_APPBUNDLE_VERSION_URL.format(appBundleName);
            newAppVersion = await apiClientCallAsync( 'POST', createAppVersionUrl, req.oauth_token.access_token, appBundleSpec );
            const aliasSpec = {
                "Version" : newAppVersion.body.version
            }
            const modifyAppAliasUrl = designAutomation.URL.UPDATE_APPBUNDLE_ALIAS_URL.format(appBundleName,designAutomation.appbundle_activity_alias);
            await apiClientCallAsync( 'PATCH', modifyAppAliasUrl, req.oauth_token.access_token, aliasSpec );
        }
        catch( err ){
            console.log(err);
            res.status(400).end("Failed to Create AppBundle new version.");
            return;
        }
    }else{
        try{
            const appBundleSpec = {
                "Engine" : engineName,
                "Id" : appBundleName,
                "Description" : 'Export and Import Revit parameters with Excel AppBundle',
            }
            newAppVersion = await apiClientCallAsync( 'POST', designAutomation.URL.APPBUNDLES_URL, req.oauth_token.access_token, appBundleSpec );
            const aliasSpec = {
                "Id" : designAutomation.appbundle_activity_alias,
                "Version" : 1
            }
            const createAppBundleAliasUrl = designAutomation.URL.CREATE_APPBUNDLE_ALIAS_URL.format(appBundleName);
            await apiClientCallAsync( 'POST', createAppBundleAliasUrl, req.oauth_token.access_token, aliasSpec );
        }
        catch( err ){
            console.log(err);
            res.status(400).end("Failed to create new version of AppBundle.");
            return;
        }
    }
    const contents = fs.readFileSync(localAppPath);
    try{
        await uploadAppBundleAsync(newAppVersion.body.uploadParameters, contents);
        const result = {
            AppBundle : qualifiedAppBundleId,
            Version   : newAppVersion.body.version
        }
        res.status(200).end(JSON.stringify(result));    
    }catch(err){
        console.log(err);
        res.status(500).end("Failed to upload the package to the url.");
    }
    return;
})


///////////////////////////////////////////////////////////////////////
/// Create activity
///////////////////////////////////////////////////////////////////////
router.post('/designautomation/activities', async( req, res, next) => {
    const fileName = req.body.fileName;
    const engineName  = req.body.engine;

    const appBundleName = fileName + 'AppBundle';
    const activityName = fileName + 'Activity';

    let activities = null;
    try {
        const activityRes = await apiClientCallAsync( 'GET',  designAutomation.URL.ACTIVITIES_URL, req.oauth_token.access_token);
        if(activityRes.body && activityRes.body.data ){
            activities = activityRes.body.data;
        }
    } catch (err) {
        console.log(err);
        res.status(400).end("Failed to get activities.");
        return;
    }
    const qualifiedAppBundleId = designAutomation.nickname + '.' + appBundleName + '+' + designAutomation.appbundle_activity_alias;
    const qualifiedActivityId  = designAutomation.nickname + '.' + activityName + '+' + designAutomation.appbundle_activity_alias;
    if( !activities.includes( qualifiedActivityId ) ){
        const activitySpec = {
            Id : activityName,
            Appbundles : [ qualifiedAppBundleId ],
            CommandLine : [ "$(engine.path)\\\\revitcoreconsole.exe /i $(args[inputFile].path) /al $(appbundles[" + appBundleName + "].path)" ],
            Engine : engineName,
            Parameters :
            {
                inputFile: {
                    verb: "get",
                    description: "input file",
                    required: true
                },
                inputJson: {
                    verb: "get",
                    description: "input Json parameters",
                    localName: "params.json"
                },
                inputXls: {
                    verb: "get",
                    description: "input excel file",
                    localName: "input.xls"
                },
                outputRvt: {
                    verb: "put",
                    description: "output Rvt file",
                    localName: "result.rvt"
                },
                outputXls: {
                    verb: "put",
                    description: "output excel file",
                    localName: "result.xls"
                }
            }
        }
        try{
            newActivity = await apiClientCallAsync( 'POST',  designAutomation.URL.ACTIVITIES_URL, req.oauth_token.access_token, activitySpec );
            const aliasSpec = {
                "Id" : designAutomation.appbundle_activity_alias,
                "Version" : 1
            }
            const createActivityAliasUrl = designAutomation.URL.CREATE_ACTIVITY_ALIAS.format(activityName);
            await apiClientCallAsync( 'POST',  createActivityAliasUrl, req.oauth_token.access_token, aliasSpec );
        }catch(err){
            console.log(err);
            res.status(400).end("Failed to create activity");
            return; 
        }
        const activityRes = {
            Activity : qualifiedActivityId,
            Status : "Created"
        }
        res.status(200).end(JSON.stringify(activityRes));
        return;
    }
    const activityRes = {
        Activity : qualifiedActivityId,
        Status : "Existing"
    }
    res.status(200).end(JSON.stringify(activityRes));
    return;
})


///////////////////////////////////////////////////////////////////////
/// Delete appbundle from Desigan Automation server
///////////////////////////////////////////////////////////////////////
router.delete('/designautomation/appbundles/:appbundle_name', async(req, res, next) =>{
    const appbundle_name = req.params.appbundle_name;
    try {
        await apiClientCallAsync( 'DELETE',  designAutomation.URL.APPBUNDLE_URL.format(appbundle_name), req.oauth_token.access_token );
        res.status(204).end("AppBundle is deleted");
    } catch (err) {
        res.status(500).end("Failed to delete AppBundle: " + appbundle_name);
    }
})



///////////////////////////////////////////////////////////////////////
/// Delete activity from design automation server
///////////////////////////////////////////////////////////////////////
router.delete('/designautomation/activities/:activity_name', async(req, res, next) =>{
    const activity_name = req.params.activity_name;
    try {
        await apiClientCallAsync( 'DELETE',  designAutomation.URL.ACTIVITY_URL.format(activity_name), req.oauth_token.access_token );
        res.status(204).end("Activity is deleted");
    } catch (err) {
        res.status(500).end("Failed to delete activity: " + activity_name );
    }
})

module.exports = router;
