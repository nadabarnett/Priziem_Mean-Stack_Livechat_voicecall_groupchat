Open Source software being used (with version and license):

-Prizem Desktop and Web Application:
```
Electron v1.7.9 - MIT
  electron-log v2.2.11 - MIT
  electron-settings v3.1.4 - ISC
AngularJS v1.6.6 - MIT
  AngularJS UI Router v0.4.3 - MIT
  AngularJS Material Design v1.1.5 - MIT
Canvas Designer v1.2.1- MIT
getScreenId.js - MIT
CodecsHandler.js - MIT
WebRTC Adapter v6.0.1 - BSD-3-Clause
FileSaver.js v1.3.2- MIT
wifi-control v2.0.0 - MIT
node-wifi v2.0.0 - LGPL-3.0
```
-Prizem Server:
```
Node.js v4.6.0 - X11
websocket v1.0.25 - ISC
uuid v3.1.0 - Apache-2.0
express v4.16.2 - MIT
https v1.0.0 - ISC
```
Programming/scripting languages used:
```
JavaScript
NodeJS
```
To build app on Windows and Mac you need:
```
  electron-packager v9.1.0 - BSD-2-Clause
```
To pack build to dmg installer on Mac you need:
```
appdmg v0.5.2 - MIT
```
To pack build to exe installer on Windows you need:
```
NSIS Quick Setup Script Generator v1.09.18.2006 - as-is
```
Also on every OS you need:
- Node https://nodejs.org/en/

Building Prizem App on MacOS:
```bash
сd desktop/
npm install
npm install -g electron-prebuilt
npm install -g electron-packager
npm install -g macos-alias
sudo npm install -g appdmg
npm run macbuild
appdmg macdmg.json ~/prizemYYYDDMM.dmg
```

Building Prizem App on Windows:
```bash
сd desktop/
npm install
npm install -g electron-prebuilt
npm install -g electron-packager
npm run winbuild
```
-for x32 version last command will be:
```
npm run winbuild32
```
-install NSIS http://nsis.sourceforge.net/Download

-install NSIS Quick Setup Script Generator http://nsis.sourceforge.net/NSIS_Quick_Setup_Script_Generator

-run NSIS Quick Setup Script Generator

-check "Load a previously saved project" option

-browse for installers\PrizemApp.ini

-rename build folder from PrizemApp-xxxxx-xxx to simply PrizemApp

-click "Next" two times and specify "Main exe" to desktop\PrizemApp\PrizemApp.exe and "Add Files" to desktop\PrizemApp

-click "Next", set output file location and click "Generate"

To run Prizem Server and Web App you need to run:
```bash
cd desktop
npm i
cd ../server
npm i
npm start
```
You will find it running on your server's port 8082

To run PrizemApp with your custom options launch it with parameters %wifi-prefix% %wifi-password% %server-address%

On Windows in will be something like:
```
"C:\Program Files (x86)\PrizemApp\PrizemApp.exe" mywifi mypass myserver.com
```
And on MacOS:
```
/Applications/PrizemApp.app/Contents/MacOS/PrizemApp mywifi mypass myserver.com
```
%server-address% param can be both IP and DNS

Also you can add fourth parameter "true" to launch PrizemApp with Developer Tools opened. Otherwise you can enable it by using hotkey "Control or Command + D"
