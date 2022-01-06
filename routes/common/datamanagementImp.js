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
const { HubsApi, ProjectsApi, FoldersApi, ItemsApi } = require('forge-apis');


///////////////////////////////////////////////////////////////////////
///
///
///////////////////////////////////////////////////////////////////////
function createFolderBody(folderName, folderId) {

    // TBD: the parameter body type(CreateBody) is not defined yet, use raw json data as body for now
    return folderBody = {
        "jsonapi": {
            "version": "1.0"
        },
        "data": {
            "type": "folders",
            "attributes": {
                "name": folderName,
                "extension": {
                    "type": "folders:autodesk.bim360:Folder",
                    "version": "1.0"
                }
            },
            "relationships": {
                "parent": {
                    "data": {
                        "type": "folders",
                        "id": folderId
                    }
                }
            }
        }
    }
}


///////////////////////////////////////////////////////////////////////
///
///
///////////////////////////////////////////////////////////////////////
function deleteFolder(projectId, folderId, access_token) {

    return new Promise(function (resolve, reject) {

        var options = {
            method: 'PATCH',
            url: 'https://developer.api.autodesk.com/data/v1/projects/' + projectId + '/folders/' + folderId,
            headers: {
                'Content-Type': 'application/vnd.api+json',
                Authorization: 'Bearer ' + access_token
            },
            body: '{ "jsonapi": {"version": "1.0" },"data": {"type": "folders","id": "' + folderId + '","attributes": {"hidden":true}}}'
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

async function getHubs(oauthClient, credentials, res) {
    const hubs = new HubsApi();
    const data = await hubs.getHubs({}, oauthClient, credentials);
    const treeNodes = data.body.data.map((hub) => {
        if( hub.attributes.extension.type === 'hubs:autodesk.bim360:Account'){
            const hubType = 'bim360Hubs';
            return createTreeNode(
                hub.links.self.href,
                hub.attributes.name,
                hubType,
                true
            );
        }else
            return null;
        });
    // Only BIM360 hubs are supported for now
    res.json(treeNodes.filter(node => node !== null));
}

async function getProjects(hubId, oauthClient, credentials, res) {
    const projects = new ProjectsApi();
    const data = await projects.getHubProjects(hubId, {}, oauthClient, credentials);
    res.json(data.body.data.map((project) => {
        let projectType = 'projects';
        switch (project.attributes.extension.type) {
            case 'projects:autodesk.core:Project':
                projectType = 'a360projects';
                break;
            case 'projects:autodesk.bim360:Project':
                projectType = 'bim360projects';
                break;
        }
        return createTreeNode(
            project.links.self.href,
            project.attributes.name,
            projectType,
            true
        );
    }));
}

async function getFolders(hubId, projectId, oauthClient, credentials, res) {
    const projects = new ProjectsApi();
    const folders = await projects.getProjectTopFolders(hubId, projectId, oauthClient, credentials);
    res.json(folders.body.data.map((item) => {
        return createTreeNode(
            item.links.self.href,
            item.attributes.displayName === null ? item.attributes.name : item.attributes.displayName,
            item.type,
            true
        );
    }));
}

async function getFolderContents(projectId, folderId, oauthClient, credentials, res) {
    const folders = new FoldersApi();
    const contents = await folders.getFolderContents(projectId, folderId, {}, oauthClient, credentials);
    const treeNodes = contents.body.data.map((item) => {
        var name = (item.attributes.displayName !== null ? item.attributes.displayName : item.attributes.name);
        if (name !== '') { // BIM 360 Items with no displayName also don't have storage, so not file to transfer
            return createTreeNode(
                item.links.self.href,
                name,
                item.type,
                true
            );
        } else {
            return null;
        }
    });
    res.json(treeNodes.filter(node => node !== null));
}

async function getVersions(projectId, itemId, oauthClient, credentials, res) {
    const items = new ItemsApi();
    const versions = await items.getItemVersions(projectId, itemId, {}, oauthClient, credentials);

    const versions_json = versions.body.data.map( (version) => {
        const dateFormated = new Date(version.attributes.lastModifiedTime).toLocaleString();
        const versionst = version.id.match(/^(.*)\?version=(\d+)$/)[2];
        const viewerUrn = (version.relationships != null && version.relationships.derivatives != null ? version.relationships.derivatives.data.id : null);
        const versionStorage = (version.relationships != null && version.relationships.storage != null &&  version.relationships.storage.meta != null && version.relationships.storage.meta.link != null? version.relationships.storage.meta.link.href : null);
        return createTreeNode(
            viewerUrn,
            decodeURI('v' + versionst + ': ' + dateFormated + ' by ' + version.attributes.lastModifiedUserName),
            (viewerUrn != null ? 'versions' : 'unsupported'),
            false,
            versionStorage
        );
    })
    res.json(versions_json.filter(node=>node!=null));
}

async function getVersionRefStorage(projectId, viewUrnId, oauthClient, credentials) {
    const versionApi = new VersionsApi()
    const relationshipRefs = await versionApi.getVersionRelationshipsRefs(projectId, viewUrnId, {}, oauthClient, credentials)

    if (relationshipRefs.body && relationshipRefs.body.included && relationshipRefs.body.included.length > 0) {
        //find file of the reference
        const ref = relationshipRefs.body.included.find(d => d &&
            d.type == 'versions' &&
            d.attributes.extension.type == 'versions:autodesk.bim360:File')

        if (ref) {
            return ref.relationships.storage.data.id;
        } else {
            return null;
        }
    }

    return null;
}

// get references of this version urn,e.g. views of seed file
async function getVersionRef(projectId, viewUrnId, oauthClient, credentials) {
    // Documents in BIM 360 Folder will go to this branch
    const versionApi = new VersionsApi()
    const relationshipRefs = await versionApi.getVersionRelationshipsRefs(projectId, viewUrnId, {}, oauthClient, credentials)

    if (relationshipRefs.body && relationshipRefs.body.data && relationshipRefs.body.data.length > 0) {
        //find meta of the reference
        const ref = relationshipRefs.body.data.find(d => d.meta &&
            d.meta.fromType == 'versions' &&
            d.meta.toType == 'versions')
        if (ref) {
            if (ref.meta.extension.type == 'derived:autodesk.bim360:CopyDocument') {
                //this is a copy document, ref.id is the view urn, instead of version urn
                //recurse until find the source version urn
                const sourceViewId = ref.id
                return await getVersionRef(projectId, sourceViewId, oauthClient, credentials)
            } else if (ref.meta.extension.type == 'derived:autodesk.bim360:FileToDocument') {
                //this is the original documents, when source model version is extracted in BIM 360 Plan folder
                return ref.id
            } else {
                return null
            }
        } else {
            return null
        }
    } else {
        return null
    }
}

// Format data for tree
function createTreeNode(_id, _text, _type, _children, _storage = null) {
    return { id: _id, text: _text, type: _type, children: _children, storage: _storage };
}

module.exports = {
    createFolderBody,
    deleteFolder,
    getHubs,
    getProjects,
    getFolders,
    getFolderContents,
    getVersions
}