var selfEasyrtcid = "";
var haveSelfVideo = false;
var otherEasyrtcid = null;

easyrtc.setStreamAcceptor(function(easyrtcid, stream, streamName) {
    console.log('setStreamAcceptor');
    var labelBlock = addMediaStreamToDiv("remoteVideos", stream, streamName, false);
    labelBlock.parentNode.id = "remoteBlock" + easyrtcid + streamName;

});
easyrtc.setOnStreamClosed(function(easyrtcid, stream, streamName) {
    console.log('setOnStreamClosed');

    var item = document.getElementById("remoteBlock" + easyrtcid + streamName);
    item.parentNode.removeChild(item);
});

function connectAndReceive() {
    console.log("Initializing.");
    easyrtc.setRoomOccupantListener(convertListToButtons);
    easyrtc.connect("easyrtc.multistream", loginSuccessAndReceive, loginFailureAndReceive);
    easyrtc.setAutoInitUserMedia(false);
    var localFilter = easyrtc.buildLocalSdpFilter( {
        videoSendCodec:'H264', videoRecvCodec:'H264'
    });
    var remoteFilter = easyrtc.buildRemoteSdpFilter({
    });
    easyrtc.setSdpFilters(localFilter, remoteFilter);
}


function loginSuccessAndReceive(easyrtcid) {
    disableReceive("connectButton");
    //  enable("disconnectButton");
    //enable('otherClients');
    selfEasyrtcid = easyrtcid;
    document.getElementById("iam").innerHTML = "I am " + easyrtc.cleanId(easyrtcid);
    console.log('Receive request');
}


function loginFailureAndReceive(errorCode, message) {
    easyrtc.showError(errorCode, message);
}



function disableReceive(domId) {
    console.log("about to try disabling " + domId);
    document.getElementById(domId).disabled = "disabled";
}
function convertListToButtons(roomName, occupants, isPrimary) {
    console.log("about to convertListToButtons "+roomName);
    var easyrtcid;
    for (var _easyrtcid in occupants) {
        easyrtcid=_easyrtcid;
    }
    if(easyrtcid)
    {
        performCall(easyrtcid);
    }

}

function performCall(targetEasyrtcId) {
    console.log("about to performCall "+targetEasyrtcId);

    var acceptedCB = function(accepted, easyrtcid) {
        if (!accepted) {
            easyrtc.showError("CALL-REJECTED", "Sorry, your call to " + easyrtc.idToName(easyrtcid) + " was rejected");
        }
        else {
            otherEasyrtcid = targetEasyrtcId;
        }
    };


    var keys = easyrtc.getLocalMediaIds();
    var successCB = function() {
    };
    var failureCB = function() {
    };
    easyrtc.call(targetEasyrtcId, successCB, failureCB, acceptedCB, keys);
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