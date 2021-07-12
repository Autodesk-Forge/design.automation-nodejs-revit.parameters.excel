# design.automation-nodejs-revit.parameters.excel

[![Node.js](https://img.shields.io/badge/Node.js-8.0-blue.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-4.0-blue.svg)](https://www.npmjs.com/)
![Platforms](https://img.shields.io/badge/Web-Windows%20%7C%20MacOS%20%7C%20Linux-lightgray.svg)
[![Data-Management](https://img.shields.io/badge/Data%20Management-v1-green.svg)](http://developer.autodesk.com/)
[![Design-Automation](https://img.shields.io/badge/Design%20Automation-v3-green.svg)](http://developer.autodesk.com/)
[![Forge-Viewer](https://img.shields.io/badge/Forge%20Viewer-v7-green.svg)](http://developer.autodesk.com/)


![Windows](https://img.shields.io/badge/Plugins-Windows-lightgrey.svg)
![.NET](https://img.shields.io/badge/.NET%20Framework-4.7-blue.svg)
[![Revit-2019](https://img.shields.io/badge/Revit-2019-lightgrey.svg)](http://autodesk.com/revit)


![Advanced](https://img.shields.io/badge/Level-Advanced-red.svg)
[![MIT](https://img.shields.io/badge/License-MIT-blue.svg)](http://opensource.org/licenses/MIT)

# Description
This sample demonstrates how to update a file-based Revit model stored in BIM 360 Docs, using Design Automation for Revit. The sample does two things:
1. export Revit parameters (Door Type Parameter “Fire Rating”, and/or Door Instance Parameter “Comments”) to an excel file.
2. Import Revit parameters (same as above) from a locally stored excel file.
 
The custom button in a viewer is provided to make it easier to see the parameter values. You can also see the values in the default property panel as well.
 

# Thumbnail
![thumbnail](/thumbnail.png)

# Demonstration
[![https://youtu.be/nOAEzimdq5Q](http://img.youtube.com/vi/nOAEzimdq5Q/0.jpg)](http://www.youtube.com/watch?v=nOAEzimdq5Q "Export|Import Revit parameter values to|from Excel")

# Live Demo
[https://revitexcel2020.herokuapp.com/](https://revitexcel2020.herokuapp.com/)

# Main Parts of The Work
1. Create a Revit Plugin to be used within AppBundle of Design Automation for Revit. Please check [PlugIn](./ExportImportExcelPlugin/) 

2. Create your App, upload the AppBundle, define your Activity and test the workitem with the Postman collection under [Postman Collection](./PostmanCollection/), or you can refer ([https://youtu.be/1NCeH7acIko](https://youtu.be/1NCeH7acIko)) and simply use the `Configure` button in the Web Application to create the Appbundle & Activity. 

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

    git clone https://github.com/Autodesk-Forge/design.automation-nodejs-revit.parameters.excel

Install the required packages using `npm install`.

### ngrok

Run `ngrok http 3000` to create a tunnel to your local machine, then copy the address into the `FORGE_WEBHOOK_URL` environment variable. Please check [WebHooks](https://forge.autodesk.com/en/docs/webhooks/v1/tutorials/configuring-your-server/) for details.

### Environment variables

Set the environment variables with your client ID & secret and finally start it. Via command line, navigate to the folder where this repository was cloned and use the following:

Mac OSX/Linux (Terminal)

    npm install
    export FORGE_CLIENT_ID=<<YOUR CLIENT ID FROM DEVELOPER PORTAL>>
    export FORGE_CLIENT_SECRET=<<YOUR CLIENT SECRET>>
    export FORGE_CALLBACK_URL=<<YOUR CALLBACK URL>>
    export FORGE_WEBHOOK_URL=<<YOUR DESIGN AUTOMATION FOR REVIT CALLBACK URL>>
    export DESIGN_AUTOMATION_NICKNAME=<<YOUR DESIGN AUTOMATION FOR REVIT NICK NAME>>
    export DESIGN_AUTOMATION_ACTIVITY_NAME=<<YOUR DESIGN AUTOMATION FOR REVIT ACTIVITY NAME>>
    npm start

Windows (use **Node.js command line** from Start menu)

    npm install
    set FORGE_CLIENT_ID=<<YOUR CLIENT ID FROM DEVELOPER PORTAL>>
    set FORGE_CLIENT_SECRET=<<YOUR CLIENT SECRET>>
    set FORGE_CALLBACK_URL=<<YOUR CALLBACK URL>>
    set FORGE_WEBHOOK_URL=<<YOUR DESIGN AUTOMATION FOR REVIT CALLBACK URL>>
    set DESIGN_AUTOMATION_NICKNAME=<<YOUR DESIGN AUTOMATION FOR REVIT NICK NAME>>
    set DESIGN_AUTOMATION_ACTIVITY_NAME=<<YOUR DESIGN AUTOMATION FOR REVIT ACTIVITY NAME>>
    npm start

Windows (use **PowerShell**)

    npm install
    $env:FORGE_CLIENT_ID="YOUR CLIENT ID FROM DEVELOPER PORTAL"
    $env:FORGE_CLIENT_SECRET="YOUR CLIENT SECRET"
    $env:FORGE_CALLBACK_URL="YOUR CALLBACK URL"
    $env:FORGE_WEBHOOK_URL="YOUR DESIGN AUTOMATION FOR REVIT CALLBACK URL"
    $env:DESIGN_AUTOMATION_NICKNAME="YOUR DESIGN AUTOMATION FOR REVIT NICK NAME"
    $env:DESIGN_AUTOMATION_ACTIVITY_NAME="YOUR DESIGN AUTOMATION FOR REVIT ACTIVITY NAME"
    npm start

**Note.**
environment variable examples:
- FORGE_CALLBACK_URL: `http://localhost:3000/api/forge/callback/oauth`
- FORGE_WEBHOOK_URL: `http://808efcdc123456.ngrok.io/api/forge/callback/designautomation`
- DESIGN_AUTOMATION_NICKNAME: You can pass your client id here
- DESIGN_AUTOMATION_ACTIVITY_NAME: `ExportImportExcelActivity`

### Using the app

Open the browser: [http://localhost:3000](http://localhost:3000), it provides the abilities to export & import parameter with Excel: 

1. Select Revit file version in BIM360 Hub to view the Model, Select parameters which you want to export|import, choose either export or import and click 'Execute'.
2. Select the Door type or instance in Model Viewer, and open the customized property panel to see the result.

`Note`: When you deploy the app, you have to open the `Configure` button to create the AppBundle & Activity before running the Export|Import feature, please check the video for the steps at [https://youtu.be/1NCeH7acIko](https://youtu.be/1NCeH7acIko). You can also delete the existing AppBundle & Activity and re-create with different Design Automation Revit engine version.

## Deployment

To deploy this application to Heroku, the **Callback URL** for Forge must use your `.herokuapp.com` address. After clicking on the button below, at the Heroku Create New App page, set your Client ID, Secret, Callback URL and Revit Design Automation variables for Forge.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/Autodesk-Forge/design.automation-nodejs-revit.parameters.excel)

Watch [this video](https://www.youtube.com/watch?v=Oqa9O20Gj0c) on how deploy samples to Heroku.

## Packages used

The [Autodesk Forge](https://www.npmjs.com/package/forge-apis) packages is included by default. Some other non-Autodesk packaged are used, including [socket.io](https://www.npmjs.com/package/socket.io), [express](https://www.npmjs.com/package/express).

Within the Revit Plugin, [LibXL](http://www.libxl.com) is used to read/write the date of Excel. 

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
- Before using the sample to call the workitem, you need to setup your Appbundle & Activity of Design Automation, you can follow my Postman script to understand the whole process, or you can simply use the `Configure` button in the Web Application to create the Appbundle & Activity([https://youtu.be/1NCeH7acIko](https://youtu.be/1NCeH7acIko)). 
- Currently Revit Cloud Worksharing is not supported by the Design Automation.  The scenario that this sample demonstrates is applicable only with a file-based Revit model. 
- The free version of [LibXL](http://www.libxl.com) I used will write a banner in the first row of each spreadsheet and it will be able to read only 300 cells (first row is unavailable). If you want to remove banner and reading restriction, you may contact them for a license.
- It takes time for BIM360 to automatically translate the new uploaded Revit file version, please wait for a while to see the viewable and properties.
- Client JavaScript requires modern browser.
- Currently, the sample support Design Automation engine 2019 & 2020, you can use `Configure` button to delete|create different versions of Design Automation Revit engine.

## License

This sample is licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT). Please see the [LICENSE](LICENSE) file for full details.

## Written by

Zhong Wu [@johnonsoftware](https://twitter.com/johnonsoftware), [Forge Partner Development](http://forge.autodesk.com)
Eason Kang [@yiskang](https://twitter.com/yiskang), [Forge Partner Development](http://forge.autodesk.com)