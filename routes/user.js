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
const { UserProfileApi } = require('forge-apis');

const { OAuth } = require('./common/oauthImp');

let router = express.Router();

router.get('/user/v1/profile', async (req, res) => {
    try {
        const oauth = new OAuth(req.session);
        const internalToken = await oauth.getInternalToken();
        if( internalToken ){
            const user = new UserProfileApi();
            const profile = await user.getUserProfile(oauth.getClient(), internalToken);
            res.json({
                name: profile.body.firstName + ' ' + profile.body.lastName,
                picture: profile.body.profileImages.sizeX40
            });
    
        }else{
            res.status(500).end();
        }
    }
    catch (err) {
        res.status(500).end(JSON.stringify(err));
    }
});

module.exports = router;
