(function() {
    var iframeUrl =  'https://www.webrtc-experiment.com/getSourceId/';

     window.getCaptureSourceId=function(successCallback, failureCallback) {

         var cb = function(event) {
             if (!event.data) return;

             if (event.data.chromeMediaSourceId) {
                 window.removeEventListener("message", cb);
                 if (event.data.chromeMediaSourceId === 'PermissionDeniedError') {
                     failureCallback(event.data.chromeMediaSourceId);
                 } else {
                     successCallback(event.data.chromeMediaSourceId)
                 }
             }
         }
         window.addEventListener('message', cb);

         postMessage();
    }


    var iframe = document.createElement('iframe');
    
    function postMessage() {
        if (!iframe.isLoaded) {
            setTimeout(postMessage, 100);
            return;
        }

        iframe.contentWindow.postMessage({
            captureSourceId: true
        }, '*');
    }

    iframe.onload = function() {
        iframe.isLoaded = true;
    };

    iframe.src = iframeUrl;

    iframe.style.display = 'none';
    (document.body || document.documentElement).appendChild(iframe);
})();
