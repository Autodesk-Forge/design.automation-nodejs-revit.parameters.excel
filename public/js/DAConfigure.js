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

$(document).ready(function () {
    prepareLists();

    $('#clearAccount').click(async ()=>{
        const zipFileName = $('#localBundles').val();
        const fileName = zipFileName.split('.')[0];
        const activityName = fileName + 'Activity';
        const appBundleName = fileName + 'AppBundle';

        if (!confirm('Are you sure you want to delete the AppBundle & Activity for this zip Package?')) 
            return;

        try {
            updateConfigStatus('deleting_appbundle', appBundleName)
            await deleteAppBundle(appBundleName);

            updateConfigStatus('deleting_activity', activityName)
            await deleteActivity(activityName );

            updateConfigStatus('deleting_completed',  "{0} & {1}".format(appBundleName, activityName));
        }catch(err){
            console.log(err)
            updateConfigStatus('deleting_failed', "{0} & {1}".format(appBundleName, activityName) )
        }        
    });
    $('#defineActivityShow').click(defineActivityModal);
    $('#createAppBundleActivity').click(createAppBundleActivity);

});

if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}

function prepareLists() {
    list('engines', '/api/forge/designautomation/engines');
    list('localBundles', '/api/forge/appbundles');
}

function list(control, endpoint) {
    $('#' + control).find('option').remove().end();
    jQuery.ajax({
        url: endpoint,
        dataType: 'json', // The data type will be received
        success: function (list) {
            if (list.length === 0)
                $('#' + control).append($('<option>', { disabled: true, text: 'Nothing found' }));
            else
                list.forEach(function (item) { $('#' + control).append($('<option>', { value: item, text: item })); })
        }
    });
}


async function deleteAppBundle( appBundleName ) {
    let def = $.Deferred();

    $.ajax({
        url: '/api/forge/designautomation/appbundles/' + encodeURIComponent(appBundleName),
        type: "delete",
        dataType: "json",
        success: function (res) {
            def.resolve(res);
        },
        error: function (err) {
            def.reject(err);
        }
    });
    return def.promise();
}

async function deleteActivity( activityName) {
    let def = $.Deferred();

    $.ajax({
        url: '/api/forge/designautomation/activities/' + encodeURIComponent(activityName),
        type: "delete",
        dataType: "json",
        success: function (res) {
            def.resolve(res);
        },
        error: function (err) {
            def.reject(err);
        }
    });

    return def.promise();
}

function defineActivityModal() {
    $("#defineActivityModal").modal();
}

async function createAppBundleActivity() {
    const zipFileName = $('#localBundles').val();
    const fileName = zipFileName.split('.')[0];

    try{
        updateConfigStatus('creating_appbundle', fileName+"AppBundle")
        const appBundle = await createAppBundle( fileName );

        updateConfigStatus('creating_activity', fileName+"Activity")
        const activity = await createActivity(fileName);

        updateConfigStatus('creating_completed', "{0}AppBundle & {1}Activity".format(fileName, fileName)  )
    }
    catch(err){
        updateConfigStatus('creating_failed', "{0}AppBundle & {1}Activity".format(fileName, fileName)  )
        console.log('Failed to create AppBundle and Activity.');
        return;
    }
}

function createAppBundle(fileName) {
    let def = $.Deferred();

    jQuery.ajax({
        url: 'api/forge/designautomation/appbundles',
        method: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({
            fileName: fileName,
            engine: $('#engines').val()
        }),
        success: function (res) {
            def.resolve(res);
        },
        error: function (err) {
            def.reject(err);
          }    
    });
    return def.promise();
}

function createActivity(fileName) {
    let def = $.Deferred();

    jQuery.ajax({
        url: 'api/forge/designautomation/activities',
        method: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({
            fileName: fileName,
            engine: $('#engines').val()
        }),
        success: function (res) {
            def.resolve(res);
        },
        error: function (err) {
            console.log(err)
            def.reject(err);
          }   
    });
    return def.promise();
}


function updateConfigStatus(status, info = '') {
    let statusText = document.getElementById('configText');
    let upgradeBtnElm = document.getElementById('createAppBundleActivity');
    let cancelBtnElm = document.getElementById('clearAccount');
    switch (status) {
        case "creating_appbundle":
            setProgress(20, 'configProgressBar');
            statusText.innerHTML = "<h4>Step 1/2: Creating AppBundle: " +info+ "</h4>"
            upgradeBtnElm.disabled = true;
            cancelBtnElm.disabled = true;
            break;
        case "creating_activity":
            setProgress(60, 'configProgressBar');
            statusText.innerHTML = "<h4>Step 2/2: Creating Activity: " +info+ "</h4>"
            upgradeBtnElm.disabled = true;
            cancelBtnElm.disabled  = true;
            break;
        case "creating_completed":
            setProgress(100, 'configProgressBar');
            statusText.innerHTML = "<h4>Created:\n" + info +  "</h4>"
            upgradeBtnElm.disabled = false;
            cancelBtnElm.disabled = false;
            break;

        case "creating_failed":
            setProgress(0, 'configProgressBar');
            statusText.innerHTML = "<h4>Failed to create:\n"+ info +"</h4>"
            upgradeBtnElm.disabled = false;
            cancelBtnElm.disabled = false;
            break;

        case "deleting_appbundle":
            setProgress(20, 'configProgressBar');
            statusText.innerHTML = "<h4>Step 1/2: Deleting AppBundle: " +info+ "</h4>"
            upgradeBtnElm.disabled = true;
            cancelBtnElm.disabled = true;
            break;
        case "deleting_activity":
            setProgress(60, 'configProgressBar');
            statusText.innerHTML = "<h4>Step 2/2: Deleting Activity: " +info+ "</h4>"
            upgradeBtnElm.disabled = true;
            cancelBtnElm.disabled = true;
            break;
        case "deleting_completed":
            setProgress(100, 'configProgressBar');
            statusText.innerHTML = "<h4>Deleted:\n" + info + "</h4>"
            upgradeBtnElm.disabled = false;
            cancelBtnElm.disabled = false;
            break;
        case "deleting_failed":
            setProgress(0, 'configProgressBar');
            statusText.innerHTML = "<h4>Failed to delete:\n" + info + "</h4>"
            upgradeBtnElm.disabled = false;
            cancelBtnElm.disabled = false;
            break;
    }
}

