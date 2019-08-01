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

// *******************************************
// Custom Property Panel
// *******************************************
function CustomPropertyPanel(viewer, options) {
    this.viewer = viewer; 
    this.options = options; 
    this.nodeId = -1; // dbId of the current element showing properties
    Autodesk.Viewing.Extensions.ViewerPropertyPanel.call(this, this.viewer);
}
CustomPropertyPanel.prototype = Object.create(Autodesk.Viewing.Extensions.ViewerPropertyPanel.prototype);
CustomPropertyPanel.prototype.constructor = CustomPropertyPanel;

CustomPropertyPanel.prototype.setProperties = function (properties, options) {
    Autodesk.Viewing.Extensions.ViewerPropertyPanel.prototype.setProperties.call(this, properties, options);
    var that = this;
    this.removeAllProperties();
    this.viewer.getProperties(this.nodeId, function (props) {
        props.properties.forEach((prop) => {
            if (prop.displayName === "Fire Rating"
                || prop.displayName === "Comments")
                that.addProperty(prop.displayName, prop.displayValue, prop.displayCategory);
        })
        that.resizeToContent();
        that.respositionPanel();    
    })
}

CustomPropertyPanel.prototype.setNodeProperties = function (nodeId) {
    Autodesk.Viewing.Extensions.ViewerPropertyPanel.prototype.setNodeProperties.call(this, nodeId);
    this.nodeId = nodeId; // store the dbId for later use    
};


// *******************************************
// Custom Property Panel Extension
// *******************************************
function CustomPropertyPanelExtension(viewer, options) {
    Autodesk.Viewing.Extension.call(this, viewer, options);
    this.viewer  = viewer;
    this.options = options;
    this.panel   = null;
}

CustomPropertyPanelExtension.prototype = Object.create(Autodesk.Viewing.Extension.prototype);
CustomPropertyPanelExtension.prototype.constructor = CustomPropertyPanelExtension;

CustomPropertyPanelExtension.prototype.load = function () {
    this.panel = new CustomPropertyPanel(this.viewer, this.options);
    if (this.viewer.toolbar ) {
        this.createMyUI()
    } else {
        this.onToolbarBinded = this.onToolbarCreated.bind(this);
        this.viewer.addEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, this.onToolbarBinded)
        console.log('Events are registered')
    }

    // Selection change event
    this.onSelectionBinded = this.onSelectionChanged.bind(this);
    this.viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, this.onSelectionBinded)
    return true;
};

CustomPropertyPanelExtension.prototype.unload = function () {
    this.viewer.removeEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, this.onSelectionBinded);
    this.onSelectionBinded = null;

    this.viewer.toolbar.removeControl(this.subToolbar)
    this.onToggleOnBinded = this.toggleOnEvent.bind(this);
    this.onToggleOffBinded = this.toggleOffEvent.bind(this);

    this.panel = null;
    return true;
};


CustomPropertyPanelExtension.prototype.createMyUI = function () {
    var toggleButton = new Autodesk.Viewing.UI.Button('my-toggle-button');
    toggleButton.icon.style.backgroundImage = 'url(../res/properties.png)';
    toggleButton.setToolTip('Show custom property panel');
    toggleButton.addClass('my-toggle-button');

    this.onToggleOnBinded = this.toggleOnEvent.bind(this);
    this.onToggleOffBinded = this.toggleOffEvent.bind(this);
    toggleButton.onClick = this.createToggler(
        toggleButton,
        this.onToggleOnBinded,
        this.onToggleOffBinded
    );

    // SubToolbar
    this.subToolbar = new Autodesk.Viewing.UI.ControlGroup('my-custom-toolbar');
    this.subToolbar.addControl(toggleButton);

    // Add button to toolbar
    this.viewer.toolbar.addControl(this.subToolbar);
}

CustomPropertyPanelExtension.prototype.toggleOnEvent = function(  ){
    this.panel.setVisible( true );
}

CustomPropertyPanelExtension.prototype.toggleOffEvent = function(  ){
    this.panel.setVisible( false );
}

CustomPropertyPanelExtension.prototype.createToggler = function (button, click, unclick) {
    return function () {
        var state = button.getState();
        if (state === Autodesk.Viewing.UI.Button.State.INACTIVE) {
            button.setState(Autodesk.Viewing.UI.Button.State.ACTIVE);
            click();
        } else if (state === Autodesk.Viewing.UI.Button.State.ACTIVE) {
            button.setState(Autodesk.Viewing.UI.Button.State.INACTIVE);
            unclick();
        }
    };
};

CustomPropertyPanelExtension.prototype.onToolbarCreated = function (e) {
    this.viewer.removeEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, this.onToolbarBinded)
    this.onToolbarBinded = null;

    this.createMyUI()
}


CustomPropertyPanelExtension.prototype.onSelectionChanged = function (e) {
    // Nothing need to do here for now
  }

Autodesk.Viewing.theExtensionManager.registerExtension('CustomPropertyPanelExtension', CustomPropertyPanelExtension);
