
SHARE_TYPE_WHITEBOARD="whiteboard";
SHARE_TYPE_SCREEN="screen";
try
{
    var wifi = require('wifi-control');

    var wifiScan = require('node-wifi');
    var os=require("os");
    var {desktopCapturer} = require('electron');
    var {dialog} = require('electron').remote;

    var netName = require('electron').remote.getGlobal('netName');
    var netPass = require('electron').remote.getGlobal('netPass');
    var netServer = require('electron').remote.getGlobal('netServer');
    var isManualMode = require('electron').remote.getGlobal('isManualMode');
    var platform = require('electron').remote.getGlobal('platform');
    var appMinWidth = require('electron').remote.getGlobal('appMinWidth');
    var appMinHeight = require('electron').remote.getGlobal('appMinHeight');
    var dockVisible = require('electron').remote.getGlobal('dockVisible');

    var switchConnection = require('electron').remote.getGlobal('switchConnection');
    var log=require('electron-log');
    var settings = require('electron-settings');
}
catch (e)
{
    os={userInfo:()=>{return {username:''}}};
    netServer=window.location.hostname;
    if(netServer=='localhost')
    {
        netServer='codeda.com:8082';
    }
    switchConnection=(value)=>{};
    log=console;
    settings={
        get:(name)=>{
            return JSON.parse(localStorage.getItem(name));
        },
        set:(name, object)=>{
            localStorage.setItem(name, JSON.stringify(object));
        }
    };

}

var getConstraints=()=>{
    var screen_constraints = {
        mandatory: {
            chromeMediaSource: 'desktop',
            minWidth: 1920,
            minHeight: 1080,
            maxWidth: 1920,
            maxHeight: 1080
        },
        optional: []
    };
    return {
        video: screen_constraints,
        audio: false
    };

};
var getVoiceConstraints=()=>{
    return {
        video: false,
        audio: true
    };

};
var peerConnectionConfig = {
    'iceServers': [
        {'urls': 'stun:stun.services.mozilla.com'},
        {'urls': 'stun:stun.l.google.com:19302'}
    ]
};

var designer = new CanvasDesigner();
designer.widgetHtmlURL = 'components/designer/widget.html'; // you can place this file anywhere
designer.widgetJsURL = 'components/designer/widget.js'; // you can place this file anywhere
designer.setTools({
    pencil: true,
    text: true,
    image: false,
    eraser: true,
    line: true,
    arrow: true,
    dragSingle: false,
    dragMultiple: false,
    arc: true,
    rectangle: true,
    quadratic: false,
    bezier: false,
    marker: true,
    zoom: true,
    additional: false,
    triangle: true,
    star: true,
    colors:false,
    polyline:true,
    ellipse:true
});

var wbReady=false;
var wbExit=()=>{
    wbReady = false;
    designer.syncQueue=[];
    designer.undo('all');
    designer.destroy();
}

var wbStart=($rootScope)=>{
    if(!wbReady)  {
        var designerDiv = document.getElementById('sharedWhiteboard');
        // var designerDiv = document.getElementById('designerDiv');
        designer.appendTo(designerDiv);
        designer.addSyncListener($rootScope.syncWhiteboard);
        designer.addExitListener($rootScope.onExitWhiteboard);
        wbReady=true;
    }
    else {
        designer.undo('all');
    }
    var setExitVisibleAndSync=function(){
        if(!!designer && !!designer.iframe && designer.isReady) {

            var controlGroup=designer.iframe.contentWindow.document.getElementById('controlGroup');
            if(controlGroup && controlGroup.classList)
            {
                console.log('whiteboard-control-group-invisible',$rootScope.remotePlaying);
                if($rootScope.remotePlaying)
                {
                    if(!controlGroup.classList.contains('whiteboard-control-group-invisible'))
                    {
                        controlGroup.classList.add('whiteboard-control-group-invisible');

                    }

                }
                else
                {
                    if(controlGroup.classList.contains('whiteboard-control-group-invisible'))
                    {
                        controlGroup.classList.remove('whiteboard-control-group-invisible');

                    }

                }

                while ($rootScope.syncQueue.length) {
                    var sync = $rootScope.syncQueue.shift();
                    designer.syncData(sync);
                }
                return;
            }
        }

        designer.addReadyListener(setExitVisibleAndSync);

    };
    setExitVisibleAndSync();


};