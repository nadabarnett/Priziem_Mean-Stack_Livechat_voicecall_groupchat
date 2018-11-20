const {app, Tray, Menu, BrowserWindow, globalShortcut,clipboard} = require('electron');
const nativeImage = require('electron').nativeImage;


const path = require('path');
global.platform=require('os').platform();
const iconPath = path.join(__dirname, platform=='darwin'?'css/logos/24x24.png':'prizemLogo.ico');
const log=require('electron-log');
const fs = require('fs');
log.transports.file.appName ='rpi3x';
log.transports.file.level = 'info';
log.info('starting');
log.info('build','201710191340');
let mainWindow;
app.commandLine.appendSwitch("ignore-certificate-errors");

var appName=path.dirname(__filename).split(path.sep).pop();
var argIndex=1;
if(process.argv[1] && process.argv[1].replace(/\./g,'').replace(/\//g,'')==appName)
{
    argIndex++;
}
global.netName=process.argv[argIndex];

if(!global.netName || global.netName.startsWith('-'))
{
    global.netName='PRIZEM';
}
//global.netName='';
global.netPass=process.argv[argIndex+1] || '12345678';
global.netServer=process.argv[argIndex+2] || '172.24.1.1';
global.isManualMode=process.argv[argIndex+3]=='true'||false;
global.isDebug=process.argv[argIndex+4]=='true'||false;
global.connected=false;
log.info(netName,netPass);

var appPath=path.dirname(path.dirname(app.getAppPath()));
log.info('starting',appPath);
fs.exists(appPath+path.sep+'!dummy', (exists) => {
    log.info('listen dummy');

    if(exists)
    {
        fs.watch(appPath+path.sep+'!dummy', {persistent:false}, function(eventType, filename) {
            log.info('quit on folder watcher',eventType, filename);
            app.quit();
        });
    }
});


global.appMinWidth=600;
global.appMinHeight=750;

global.appName='Prizem';
function createWindow() {
    mainWindow = new BrowserWindow({width: 1000, height: 750, icon:platform=='darwin'?'prizemLogo.icns':'prizemLogo.ico', backgroundColor: '#0C8FB3',
        minWidth:global.appMinWidth,minHeight:global.appMinHeight, fullscreenable: true, maximizable:false, show: false, frame: false});
    mainWindow.loadURL('file://' + __dirname + '/index.html');
    if(global.isDebug)
    {
        mainWindow.openDevTools({mode: 'detach'});

    }
    mainWindow.on('ready-to-show', function() {
        mainWindow.show();
        mainWindow.focus();
    });

}
var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
});

if (shouldQuit) {
    log.info('quit on duplicate');

    app.quit();
    return;
}
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
app.on('ready', () => {
    globalShortcut.register('CommandOrControl+D', () => {
        if(global.isDebug)
        {
            mainWindow.closeDevTools();
        }
        else
        {
            mainWindow.openDevTools({mode: 'detach'});

        }
        global.isDebug=!global.isDebug;
    });
    let trayImage = nativeImage.createFromPath(iconPath);

    const tray = new Tray(trayImage);
    global.dockVisible=(value)=>{
        if (global.platform == 'darwin') {
            if (value) {
                app.dock.show();
            }
            else {
                app.dock.hide();
            }
        }
        global.mainWindowVisible(value);
    };
    var refreshMenu=function()
    {
        var trayMenuTemplate = [
            {
                label: global.appName,
                enabled: false
            },

            {
                label: 'Open',
                enabled: mainWindow&&!mainWindow.isVisible(),
                click: function () {
                    global.mainWindowVisible(true);
                }
            },

            {
                label: 'Exit',
                click: function () {
                    app.quit();
                }
            }
        ];

        let trayMenu = Menu.buildFromTemplate(trayMenuTemplate);
        tray.setContextMenu(trayMenu);
    };
    refreshMenu();
    createWindow();

    tray.setToolTip(appName);

    tray.on('click', () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });

    mainWindow.on('close', () => {
        app.quit();
    });
    mainWindow.on('show', () => {
        tray.setHighlightMode('always');
        refreshMenu();

    });
    mainWindow.on('hide', () => {
        tray.setHighlightMode('never');
        refreshMenu();

    });
    mainWindow.on('minimize', () => {
        global.mainWindowVisible(false);
    });
    global.mainWindowVisible=function(visible)
    {

        if(visible && !mainWindow.isVisible())
        {
            mainWindow.show();

        }
        if(!visible && mainWindow.isVisible())
        {
            mainWindow.hide();
        }
    };

    global.switchConnection=function(value)
    {
        global.connected=value;
    };



});






