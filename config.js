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

// Autodesk Forge configuration
module.exports = {
    // Set environment variables or hard-code here
    credentials: {
        client_id: process.env.FORGE_CLIENT_ID,
        client_secret: process.env.FORGE_CLIENT_SECRET,
        callback_url: process.env.FORGE_CALLBACK_URL
    },
    scopes: {
        // Required scopes for the server-side application
        internal: ['code:all', 'bucket:create', 'bucket:read', 'data:read', 'data:create', 'data:write'],

        // Required scopes for the server-side design automation api
        internal_2legged: ['code:all', 'bucket:create', 'bucket:read', 'data:read', 'data:create', 'data:write'],

        // Required scope for the client-side viewer
        public: ['viewables:read']
    },
    designAutomation:{
        webhook_url: process.env.FORGE_WEBHOOK_URL,
        endpoint: 'https://developer.api.autodesk.com/da/us-east/v3/',
        nickname:     process.env.DESIGN_AUTOMATION_NICKNAME?process.env.DESIGN_AUTOMATION_NICKNAME:process.env.FORGE_CLIENT_ID,
        activity_name: process.env.DESIGN_AUTOMATION_ACTIVITY_NAME || 'ExportImportExcelActivity',
        appbundle_activity_alias: 'dev',

        URL:{
            GET_ENGINES_URL:    "https://developer.api.autodesk.com/da/us-east/v3/engines",
            ACTIVITIES_URL:     "https://developer.api.autodesk.com/da/us-east/v3/activities",
            ACTIVITY_URL:       "https://developer.api.autodesk.com/da/us-east/v3/activities/{0}",
            APPBUNDLES_URL:     "https://developer.api.autodesk.com/da/us-east/v3/appbundles",
            APPBUNDLE_URL:      "https://developer.api.autodesk.com/da/us-east/v3/appbundles/{0}",

            CREATE_APPBUNDLE_VERSION_URL: "https://developer.api.autodesk.com/da/us-east/v3/appbundles/{0}/versions",
            CREATE_APPBUNDLE_ALIAS_URL:   "https://developer.api.autodesk.com/da/us-east/v3/appbundles/{0}/aliases",

            UPDATE_APPBUNDLE_ALIAS_URL:  "https://developer.api.autodesk.com/da/us-east/v3/appbundles/{0}/aliases/{1}",
            CREATE_ACTIVITY_ALIAS: "https://developer.api.autodesk.com/da/us-east/v3/activities/{0}/aliases",
        }
    }
};
