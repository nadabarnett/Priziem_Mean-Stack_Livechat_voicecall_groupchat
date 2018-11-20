# RPI3X
Content Collaboration

## Knowledgebase

We are using Raspberry Pi 3B device, needs max 32Gb micro SD card

Etcher utility (https://etcher.io/) is used to burn Raspbian image (https://www.raspberrypi.org/downloads/raspbian/) onto a micro SD.

Then Raspberry boots up, its IP address can be located with IP Scanner (https://itunes.apple.com/lt/app/ip-scanner/id404167149?mt=12).

default ssh user/pw is pi/raspberry. to be able to access SSH, put file 'SSH' into root folder of ISO. normally password access is disabled, using just public key.

Backing up is done by selecting whole drive (not volume) in macOS Disk Utility and backing up as 'CD/DVD Master Image' (.cdr), which has to be renamed to '.iso' to be restored with Etcher. Backing up and restoring takes up to an hour so it's better be avoided.

Video display and webrtc on Raspberry PI 3

https://raspberrypi.stackexchange.com/questions/44384/how-to-get-chromium-on-raspberry-3 https://planb.nicecupoftea.org/2016/10/24/a-presence-robot-with-chromium-webrtc-raspberry-pi-3-and-easyrtc/

Later when we need to do wifi to wifi routing:

https://realiesone.wordpress.com/2015/03/11/the-raspberry-pi-as-an-internet-pass-through-web-server-using-two-wireless-adapters/

streaming to HDMI output of the device itself is done as:

on client:

```bash
ffmpeg -threads 1 -re -f avfoundation -i "1:0" -f rawvideo -s 1920x1080 -r 30 -an -pix_fmt yuv420p - | \
ffmpeg -threads 1 -f rawvideo -pix_fmt yuv420p -s 1920x1080 -r 30 -an -i - -an -c:v libx264 \
-vprofile baseline -pass 1 -preset ultrafast -g 5 -b:v 10M -f mpegts udp://192.168.0.101:1234
```

on Raspberry device:
```bash
omxplayer -o hdmi —live —threshold 0 udp://192.168.0.100:1234
```

achieved latency ca. 600-900ms

Bandwidth control in webrtc:

https://stackoverflow.com/questions/16712224/how-to-control-bandwidth-in-webrtc-video-call

https://codeda.com:8043/mindemo/send.html
https://codeda.com:8043/mindemo/receive.html

Chrome flags on device for playback:

sudo apt-get install mesa-vdpau-drivers

Chromium on device is launched as:

```ssh
chromium-browser --enable-native-gpu-memory-buffers --enable-zero-copy --enable-gpu-rasterization --force-gpu-rasterization --num-raster-threads 4
```

To avoid the need to install any extensions

Media constraints are put as

```javascript
{
  video: {
    mandatory: {
      chromeMediaSource:'desktop',
      chromeMediaSourceId: event.data.chromeMediaSourceId,
      minWidth: 640,
      minHeight: 480,
      maxWidth: 1920,
      maxHeight: 1080,
      minFrameRate: 3,
      maxFrameRate: 30
    }
}
```

No need for any SDP filters when sending computer to computer - that will default to VP8 which works best there.

For streaming computer to RPI, set SDP filter:

```javascript
var localFilter = easyrtc.buildLocalSdpFilter( {
  videoSendCodec:'H264', videoRecvCodec:'H264',
  videoRecvBitrate:10000, videoSendBitrate:10000
});
var remoteFilter = easyrtc.buildRemoteSdpFilter({
  videoSendCodec:'H264', videoRecvCodec:'H264',
  videoSendBitrate:10000, videoRecvBitrate:10000
});
```

to force switch to H264 because that's what RPI hardware can decode. set for both local and remote for both sender and receiver.

Preferably set device GPU RAM to 32 Mb because that's what works best of all for video playback, while not critical.

Device has to be overclocked with the heatsink installed, with settings in 
```sh
/boot/config.txt
```
going as:

```sh
gpu_freq=525
core_freq=525
force_turbo=1
boot_delay=1
```

```bash
сd desktop/
npm install
npm install -g electron-prebuilt
npm install -g electron-packager
npm run winbuild
```
http://nsis.sourceforge.net/NSIS_Quick_Setup_Script_Generator

"NSIS Quick Setup Script Generator" + \installers\PrizemApp.ini


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
