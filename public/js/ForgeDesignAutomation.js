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

    $('input:radio[name="exportOrImport"]').click(function () {
        var checkValue = $('input:radio[name="exportOrImport"]:checked').val();
        if (checkValue === 'import') {
            $('#importSharedParameters').show();

        } else {
            $('#importSharedParameters').hide();
        }
    });

    $('#startWorkitem').click(startWorkitem);
    $('#cancelBtn').click(async function(){
        if (workingItem != null) {
            try {
                await cancelWorkitem(workingItem);
                console.log('The job is cancelled');
            } catch (err) {
                console.log('Failed to cancel the job');
            }
        }
    });


    $('#inputFile').change(function () {
        _fileInputForm = this;
        if (_fileInputForm.files.length === 0) 
            return;

        var file = _fileInputForm.files[0];

        const fileNameParams = file.name.split('.');
        if( fileNameParams[fileNameParams.length-1].toLowerCase() !== "xls"){
            alert('please select Excel file and try again');
            _fileInputForm.value = '';
            return;
        }    
    });
});

var sourceNode  = null;
var workingItem = null;
var inputExcel  = null;
var exporting   = true;
var _fileInputForm = null;


const SOCKET_TOPIC_WORKITEM = 'Workitem-Notification';
// const BUCKET_KEY = 'revitiosamplebyzhong';

socketio = io();
socketio.on(SOCKET_TOPIC_WORKITEM, (data)=>{
  if(workingItem === null || data.WorkitemId !== workingItem)
    return;
    
  const status = data.Status.toLowerCase();
  updateStatus( status, data.ExtraInfo );
  
  // enable the create button and refresh the hubs when completed/failed/cancelled
  if(status === 'completed' || status === 'failed' || status === 'cancelled'){
    workingItem = null;
  }
  if(status === 'completed' && sourceNode != null){
    console.log('Parameters are handled');
    console.log(data);
    if( !exporting ){
        let instance = $('#sourceHubs').jstree(true);
        parentNode = instance.get_parent(sourceNode);
        instance.refresh_node(parentNode);    
    }
    sourceNode = null;
  }
})




async function startWorkitem() {
    const instanceTree = $('#sourceHubs').jstree(true);
    if( instanceTree == null ){
        alert('Can not get the user hub');
        return;
    }

    sourceNode = instanceTree.get_selected(true)[0];
    // use == here because sourceNode may be undefined or null
    if (sourceNode == null || sourceNode.type !== 'versions' ) {
        alert('Can not get the selected file, please make sure you select a version as input');
        return;
    }

    const fileName = instanceTree.get_text(sourceNode.parent);
    const fileNameParams = fileName.split('.');
    if( fileNameParams[fileNameParams.length-1].toLowerCase() !== "rvt"){
        alert('please select Revit project and try again');
        return;
    }

    if( sourceNode.original.storage == null){
        alert('Can not get the storage of the version');
        return;
    }

    exporting = $('input[name="exportOrImport"]:checked').val() === 'export';
    const includeFireRating = $('#includeFireRating')[0].checked;
    const includeComments = $('#includeComments')[0].checked;

    if( !includeFireRating && !includeComments ){
        alert('Please at least select one parameter you want to Export|Import');
        return;
    }

    const inputJson = { 
        Export : exporting,    
        IncludeFireRating : includeFireRating,
        IncludeComments   : includeComments
      };

      
    try {
        let res = null;
        if(exporting){
            updateStatus('started');
            res = await exportExcel( sourceNode.original.storage, inputJson );
            console.log('The parameters are exported');
        }
        else {
            if (_fileInputForm == null || _fileInputForm.files.length === 0){
                alert('Please upload input Excel first');
                return;
            }
            updateStatus('started');
            var file = _fileInputForm.files[0];
            const storageUrl = await uploadExcel(file);
            console.log( storageUrl );
            // updateStatus('uploaded');
            res = await importExcel( sourceNode.original.storage, storageUrl , inputJson,  sourceNode.parent, fileName );
            console.log('The parameters are imported');
        }
        console.log(res);
        workingItem = res.workItemId;
        updateStatus(res.workItemStatus);
    } catch (err) {
        console.log('Failed to handle the parameters');
        updateStatus('failed');
    }
    
    return;
}

async function uploadExcel( file ){
    let def = $.Deferred();

    if(file === null){
        def.reject('input file is null');
        return def.promise();
    }

    var formData = new FormData();
    formData.append('fileToUpload', file);
    // formData.append('bucketKey', BUCKET_KEY);

    $.ajax({
        url: '/api/forge/datamanagement/v1/oss/object',
        data: formData,
        processData: false,
        contentType: false,
        type: 'POST',
        success: function (data) {
            inputExcel = data;
            console.log(data);
            def.resolve(data);
        },
        error: function (err) {
            def.reject(err);
        }

    });
    return def.promise();
}



async function exportExcel( inputRvt, inputJson){
    let def = $.Deferred();
  
    jQuery.get({
        url: '/api/forge/da4revit/v1/revit/' + encodeURIComponent(inputRvt) + '/excel',
        contentType: 'application/json', // The data type was sent
        dataType: 'json', // The data type will be received
        data: inputJson,
        success: function (res) {
            def.resolve(res);
        },
        error: function (err) {
            def.reject(err);
        }
    });

    return def.promise();
}


async function importExcel( inputRvt, inputExcel, inputJson, itemId, fileName){
    let def = $.Deferred();

    jQuery.post({
        url: '/api/forge/da4revit/v1/revit/' + encodeURIComponent(inputRvt) + '/excel',
        contentType: 'application/json', // The data type was sent
        dataType: 'json', // The data type will be received
        data: JSON.stringify({
            'InputExcUrl': inputExcel,
            'ItemUrl': itemId,
            'FileItemName': fileName,
            'Data': inputJson
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




function cancelWorkitem( workitemId ){
    let def = $.Deferred();
  
    if(workitemId === null || workitemId === ''){
      def.reject("parameters are not correct.");  
      return def.promise();
    }
  
    $.ajax({
      url: '/api/forge/da4revit/v1/revit/' + encodeURIComponent(workitemId),
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
  
  
  function getWorkitemStatus( workitemId ){
    let def = $.Deferred();
  
    if(workitemId === null || workitemId === ''){
      def.reject("parameters are not correct.");  
      return def.promise();
    }
  
    jQuery.get({
      url: '/api/forge/da4revit/v1/revit/' + encodeURIComponent(workitemId),
      dataType: 'json',
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


function updateStatus(status, extraInfo = '') {
    let statusText = document.getElementById('statusText');
    let upgradeBtnElm = document.getElementById('startWorkitem');
    let cancelBtnElm = document.getElementById('cancelBtn');
    switch (status) {
        case "started":
            setProgress(20);
            statusText.innerHTML = "<h4>Step " + (exporting ? "1/3":"1/4") +  ":  Uploading input parameters</h4>"
            // Disable Create and Cancel button
            upgradeBtnElm.disabled = true;
            cancelBtnElm.disabled = true;
            break;
        case "pending":
            setProgress(40);
            statusText.innerHTML = "<h4>Step " + (exporting ? "2/3":"2/4") +  ": Running Design Automation</h4>"
            upgradeBtnElm.disabled = true;
            cancelBtnElm.disabled = false;
            break;
        case "success":
            setProgress(80);
            statusText.innerHTML = "<h4>Step 3/4: Creating a new version</h4>"
            upgradeBtnElm.disabled = true;
            cancelBtnElm.disabled = true;
            break;
        case "completed":
            setProgress(100);
            statusText.innerHTML = 
                exporting ? 
                    "<h4>Step 3/3: Done, Ready to <a href='" + extraInfo + "'>DOWNLOAD</a></h4>" 
                   :"<h4>Step 4/4: Done, Read in BIM360</h4>";
            // Enable Create and Cancel button
            upgradeBtnElm.disabled = false;
            cancelBtnElm.disabled = true;
            break;
        case "failed":
            setProgress(0);
            statusText.innerHTML = "<h4>Failed to process Excel</h4>"
            // Enable Create and Cancel button
            upgradeBtnElm.disabled = false;
            cancelBtnElm.disabled = true;
            break;
        case "cancelled":
            setProgress(0);
            statusText.innerHTML = "<h4>The operation is cancelled</h4>"
            // Enable Create and Cancel button
            upgradeBtnElm.disabled = false;
            cancelBtnElm.disabled = true;
            break;
    }
}


function setProgress(percent) {
    let progressBar = document.getElementById('parametersUpdateProgressBar');
    progressBar.style = "width: " + percent + "%;";
    if (percent === 100) {
        progressBar.parentElement.className = "progress progress-striped"
    } else {
        progressBar.parentElement.className = "progress progress-striped active"

    }
}
