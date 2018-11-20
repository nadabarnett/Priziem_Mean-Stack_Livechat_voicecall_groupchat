var selfEasyrtcid = "";
var haveSelfVideo = false;
var otherEasyrtcid = null;

var callerPending = null;

easyrtc.setCallCancelled(function(easyrtcid) {
    console.log('setCallCancelled');

    if (easyrtcid === callerPending) {
        document.getElementById('acceptCallBox').style.display = "none";
        callerPending = false;
    }
});

easyrtc.setAcceptChecker(function(easyrtcid, callback) {
    console.log('setAcceptChecker');

    otherEasyrtcid = easyrtcid;
    if (easyrtc.getConnectionCount() > 0) {
        easyrtc.hangupAll();
    }
    callback(true, easyrtc.getLocalMediaIds());
});

function connectAndShare() {
    console.log("Initializing.");


    easyrtc.connect("easyrtc.multistream", loginSuccessAndShare, loginFailureAndShare);
    easyrtc.setAutoInitUserMedia(false);

    var localFilter = easyrtc.buildLocalSdpFilter( {
        videoSendCodec:'H264', videoRecvCodec:'H264'
    });
    var remoteFilter = easyrtc.buildRemoteSdpFilter({
    });
    easyrtc.setSdpFilters(localFilter, remoteFilter);

}

function loginSuccessAndShare(easyrtcid) {
    disableShare("connectButton");
    //  enable("disconnectButton");
    //enable('otherClients');
    selfEasyrtcid = easyrtcid;
    document.getElementById("iam").innerHTML = "I am " + easyrtc.cleanId(easyrtcid);
    console.log('Share request');
    var numScreens = 0;
    numScreens++;
    var streamName = "screen" + numScreens;
    easyrtc.initDesktopStream(
        function(stream) {
            createLocalVideoShare(stream, streamName);
            if (otherEasyrtcid) {
                easyrtc.addStreamToCall(otherEasyrtcid, streamName);
            }
        },
        function(errCode, errText) {
            easyrtc.showError(errCode, errText);
        },
        streamName);
}


function loginFailureAndShare(errorCode, message) {
    easyrtc.showError(errorCode, message);
}



function disableShare(domId) {
    console.log("about to try disabling " + domId);
    document.getElementById(domId).disabled = "disabled";
}
function createLabelledButton(buttonLabel) {
    var button = document.createElement("button");
    button.appendChild(document.createTextNode(buttonLabel));
    document.getElementById("videoSrcBlk").appendChild(button);
    return button;
}
function createLocalVideoShare(stream, streamName) {
    var labelBlock = addMediaStreamToDiv("localVideos", stream, streamName, true);
    var closeButton = createLabelledButton("close");
    closeButton.onclick = function() {
        easyrtc.closeLocalStream(streamName);
        labelBlock.parentNode.parentNode.removeChild(labelBlock.parentNode);
    };
    labelBlock.appendChild(closeButton);
}
function addMediaStreamToDiv(divId, stream, streamName, isLocal)
{
    var container = document.createElement("div");
    container.style.marginBottom = "10px";
    var formattedName = streamName.replace("(", "<br>").replace(")", "");
    var labelBlock = document.createElement("div");
    labelBlock.style.width = "220px";
    labelBlock.style.cssFloat = "left";
    labelBlock.innerHTML = "<pre>" + formattedName + "</pre><br>";
    container.appendChild(labelBlock);
    var video = document.createElement("video");
    video.width = 1440;
    video.height = 900;
    video.muted = isLocal;
    video.style.verticalAlign = "middle";
    container.appendChild(video);
    document.getElementById(divId).appendChild(container);
    video.autoplay = true;
    easyrtc.setVideoObjectSrc(video, stream);
    return labelBlock;
}