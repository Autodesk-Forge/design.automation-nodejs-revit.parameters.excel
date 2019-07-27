# design.automation-nodejs-revit.file.upgrader

[![Node.js](https://img.shields.io/badge/Node.js-8.0-blue.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-4.0-blue.svg)](https://www.npmjs.com/)
![Platforms](https://img.shields.io/badge/Web-Windows%20%7C%20MacOS%20%7C%20Linux-lightgray.svg)
[![Data-Management](https://img.shields.io/badge/Data%20Management-v1-green.svg)](http://developer.autodesk.com/)
[![Design-Automation](https://img.shields.io/badge/Design%20Automation-v3-green.svg)](http://developer.autodesk.com/)


![Windows](https://img.shields.io/badge/Plugins-Windows-lightgrey.svg)
![.NET](https://img.shields.io/badge/.NET%20Framework-4.7-blue.svg)
[![Revit-2019](https://img.shields.io/badge/Revit-2019-lightgrey.svg)](http://autodesk.com/revit)


![Advanced](https://img.shields.io/badge/Level-Advanced-red.svg)
[![MIT](https://img.shields.io/badge/License-MIT-blue.svg)](http://opensource.org/licenses/MIT)

# Description

This sample demostrated how to upgrade Revit project/family/template to the latest version using Design Automation for Revit API, including upgrade one file or one folder.

# Thumbnail
![thumbnail](/thumbnail.png)

# Live Demo
[https://fileupgradersample.herokuapp.com/](https://fileupgradersample.herokuapp.com/)

# Main Parts of The Work
1. Create a Revit Plugin to be used within AppBundle of Design Automation for Revit. Please check [PlugIn](./FileUpgrader/PlugIn/) 
2. Create your App, upload the AppBundle, define your Activity and test the workitem with the Postman collection under [Postman Collection](./FileUpgrader/PostmanCollection/) 

3. Create the Web App to call the workitem.

# Web App Setup

## Prerequisites

1. **Forge Account**: Learn how to create a Forge Account, activate subscription and create an app at [this tutorial](http://learnforge.autodesk.io/#/account/). 
2. **Visual Code**: Visual Code (Windows or MacOS).
3. **ngrok**: Routing tool, [download here](https://ngrok.com/)
4. **Revit 2019**: required to compile changes into the plugin
5. **JavaScript ES6** syntax for server-side.
6. **JavaScript** basic knowledge with **jQuery**


For using this sample, you need an Autodesk developer credentials. Visit the [Forge Developer Portal](https://developer.autodesk.com), sign up for an account, then [create an app](https://developer.autodesk.com/myapps/create). For this new app, use **http://localhost:3000/api/forge/callback/oauth** as Callback URL, although is not used on 2-legged flow. Finally take note of the **Client ID** and **Client Secret**.

## Running locally

Install [NodeJS](https://nodejs.org), version 8 or newer.

Clone this project or download it (this `nodejs` branch only). It's recommended to install [GitHub desktop](https://desktop.github.com/). To clone it via command line, use the following (**Terminal** on MacOSX/Linux, **Git Shell** on Windows):

    git clone https://github.com/Autodesk-Forge/design.automation-nodejs-revit.file.upgrader

Install the required packages using `npm install`.

### ngrok

Run `ngrok http 3000` to create a tunnel to your local machine, then copy the address into the `FORGE_WEBHOOK_URL` environment variable. Please check [WebHooks](https://forge.autodesk.com/en/docs/webhooks/v1/tutorials/configuring-your-server/) for details.

### Environment variables

Set the enviroment variables with your client ID & secret and finally start it. Via command line, navigate to the folder where this repository was cloned and use the following:

Mac OSX/Linux (Terminal)

    npm install
    export FORGE_CLIENT_ID=<<YOUR CLIENT ID FROM DEVELOPER PORTAL>>
    export FORGE_CLIENT_SECRET=<<YOUR CLIENT SECRET>>
    export FORGE_CALLBACK_URL=<<YOUR CALLBACK URL>>
    export FORGE_WEBHOOK_URL=<<YOUR DESIGN AUTOMATION FOR REVIT CALLBACK URL>>
    export REVIT_IO_NICK_NAME=<<YOUR DESIGN AUTOMATION FOR REVIT NICK NAME>>
    export REVIT_IO_APP_NAME=<<YOUR DESIGN AUTOMATION FOR REVIT APP NAME>>
    export REVIT_IO_ACTIVITY_NAME=<<YOUR DESIGN AUTOMATION FOR REVIT ACTIVITY NAME>>
    npm start

Windows (use **Node.js command line** from Start menu)

    npm install
    set FORGE_CLIENT_ID=<<YOUR CLIENT ID FROM DEVELOPER PORTAL>>
    set FORGE_CLIENT_SECRET=<<YOUR CLIENT SECRET>>
    set FORGE_CALLBACK_URL=<<YOUR CALLBACK URL>>
    set FORGE_WEBHOOK_URL=<<YOUR DESIGN AUTOMATION FOR REVIT CALLBACK URL>>
    set REVIT_IO_NICK_NAME=<<YOUR DESIGN AUTOMATION FOR REVIT NICK NAME>>
    set REVIT_IO_APP_NAME=<<YOUR DESIGN AUTOMATION FOR REVIT APP NAME>>
    set REVIT_IO_ACTIVITY_NAME=<<YOUR DESIGN AUTOMATION FOR REVIT ACTIVITY NAME>>
    npm start

### Using the app

Open the browser: [http://localhost:3000](http://localhost:3000), there are 2 ways to upgrade files: 

1. Select Revit file in BIM360 Hub from Source File/Folder, Right Click and select `Upgrade to Revit 2019`. It will create a new version after successfully upgraded.
2. Select Source Folder and Destination Folder, then click `Upgrade`, it will upgrade all the files under the folder to destinated folder.

## Main Backend API used

### File upgrade API based on Design Automation API at **routes/da4revit.js**
- POST      /api/forge/da4revit/v1/upgrader/files/:source_file_url/folders/:destinate_folder_url
- POST      /api/forge/da4revit/v1/upgrader/files
- GET       /api/forge/da4revit/v1/upgrader/files/:file_workitem_id
- DELETE    /api/forge/da4revit/v1/upgrader/files/:file_workitem_id
- POST      /api/forge/callback/designautomation

### File/Folder operation API based on Data Management API at **routes/datamanagement.js**
- POST      /api/forge/datamanagement/v1/folder
- DELETE    /api/forge//datamanagement/v1/folder/:folder_url
- GET       /api/forge/datamanagement/v1

### User information API at **routes/user.js**
- GET       /api/forge/user/v1/profile

### OAuth information API at **routes/oauth.js**
- GET       /api/forge/oauth/v1/url
- GET       /api/forge/q/v1/signout
- GET       /api/forge/oauth/v1/token
- GET       /api/forge/oauth/v1/clientid
- GET       /api/forge/callback/oauth

## Packages used

The [Autodesk Forge](https://www.npmjs.com/package/forge-apis) packages is included by default. Some other non-Autodesk packaged are used, including [socket.io](https://www.npmjs.com/package/socket.io), [express](https://www.npmjs.com/package/express).

## Further Reading

Documentation:
- This sample is based on [Learn Forge Tutorial](https://github.com/Autodesk-Forge/learn.forge.viewhubmodels/tree/nodejs), please check details there about the basic framework if you are not familar. 

- [Design Automation API](https://forge.autodesk.com/en/docs/design-automation/v3/developers_guide/overview/)
- [BIM 360 API](https://developer.autodesk.com/en/docs/bim360/v1/overview/) and [App Provisioning](https://forge.autodesk.com/blog/bim-360-docs-provisioning-forge-apps)
- [Data Management API](httqqqps://developer.autodesk.com/en/docs/data/v2/overview/)

Desktop APIs:

- [Revit](https://knowledge.autodesk.com/support/revit-products/learn-explore/caas/simplecontent/content/my-first-revit-plug-overview.html)

## Troubleshooting

After installing Github desktop for Windows, on the Git Shell, if you see a ***error setting certificate verify locations*** error, use the following:

    git config --global http.sslverify "false"

## Limitation
- For Demo purpose, we only support **5** files to be upgraded as maximum
- Only support upgrading to Revit 2019
- Override is not implemented yet
- Only support upgrade file from/to BIM360
- Client JavaScript requires modern browser

## License

This sample is licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT). Please see the [LICENSE](LICENSE) file for full details.

## Written by

Zhong Wu [@johnonsoftware](https://twitter.com/johnonsoftware), [Forge Partner Development](http://forge.autodesk.com)
