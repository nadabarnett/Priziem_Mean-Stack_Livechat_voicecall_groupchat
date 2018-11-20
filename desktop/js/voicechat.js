'use strict';

var InserVoiceTag = function( peer ) {
    var container = document.getElementById("voiceContainer");
    var video = document.createElement("VIDEO");
    video.setAttribute("autoplay", "");
    video.setAttribute("id", "voice-"+peer);
    video.setAttribute("display", "none");
    container.appendChild(video);
    return video;
}

var RemoveVoiceTag = function(peer) {
    var container = document.getElementById("voiceContainer");
    for( let i = 0; i < container.children.length; i++ ) {
        if( container.children[i].getAttribute("id") == "voice-"+peer )
            container.removeChild(container.children[i]);
    }
}
var RemoveAllVoiceTag = function(peer) {
    var container = document.getElementById("voiceContainer");
    for( let i = 0; i < container.children.length; i++ ) {
        container.removeChild(container.children[i]);
    }
}

function voiceMedia() {
    this.localStream = null;
    var self = this;
    
    this.mute = function(value) {
        if( this.localStream )
            this.localStream.getAudioTracks()[0].enabled = value;
    };
    this.start = function(callback) {
        var voiceConstraints = { video: false, audio: true };
        navigator.mediaDevices.getUserMedia(voiceConstraints).then(function (stream) {
            log.info('set local audio stream');
            self.localStream = stream;
            if( callback )
                callback(self.localStream);
        })
        .catch(function (error) {
            log.info(error);
        });
    };
    this.stop = function() {
        if ( this.localStream ) {
            this.localStream.getTracks().forEach(function(track) {
                track.stop();
            });
            this.localStream = null;
        }
        log.info('stop local audio stream');
    };
}

function voiceCaller(callee,media,$rootScope) {
    this.callee = callee; // socket id
    this.media = media; // socket id
    this.localStream = null;
    this.connector = null;
    this.candidatesQueue = [];
    var self = this;

    this.addICE = function(ice) {
        if( this.connector ) {
            log.info('VoiceCaller: received candidate - 3 step');
            
            this.connector.addIceCandidate(new RTCIceCandidate(ice)).catch(function(error) {
                log.info(error);
            });
        }
        else {
            log.info('VoiceCaller: received candidate add - 3 step');
            candidatesQueue.push(ice)
        }
    };

    this.start = function() {
        if( this.media.localStream ) {
            this.localStream = this.media.localStream;
            self.doRun();
        }
        else {
            this.media.start(function(stream){
                self.localStream = stream;
                self.doRun();
            })
        }
    };

    this.stop = function() {
        if( this.connector ) {
            this.connector.close();
            this.connector = null;
        }
        this.candidatesQueue = [];
        log.info('stop local audio stream');
    };

    this.processSdp = function(sdp) {
        var bandwidth = {
            screen: 4096
        };
        var isScreenSharing = true;
        sdp = BandwidthHandler.setApplicationSpecificBandwidth(sdp, bandwidth, isScreenSharing);
        sdp = BandwidthHandler.setVideoBitrates(sdp, {
            min: 3000,
            max: 5000
        });
        sdp = BandwidthHandler.setOpusAttributes(sdp);
        return sdp;
    }
    this.doRun = function() {
        this.connector = new RTCPeerConnection(peerConnectionConfig);
        if(this.candidatesQueue.length) {
            while( this.candidatesQueue.length) {
                var ice = candidatesQueue.shift();
                this.connector.addIceCandidate(new RTCIceCandidate(ice)).catch(function(error) {
                    log.info(error);
                });
            }
        }

        this.connector.onicecandidate = function(event) {
            log.info('VoiceCaller: onicecandidate - 1 step',event.candidate);
            if (event.candidate != null) {
                $rootScope.sendMessage({'action': 'relay',to:self.callee,data:{'action':'voice','id': 'ice','mode':'caller','ice': event.candidate,'to': self.callee}});
                log.info('VoiceCaller: sending candidate - 1 step');
            }
        };

        this.connector.addStream(this.localStream);

        this.connector.createOffer().then(function (description) {
            log.info('VoiceCaller: setLocalDescription for offer');
            self.connector.setLocalDescription(description).then(function () {
                log.info('VoiceCaller: start sending offer  - 2 step');
                var sdp = JSON.stringify(self.connector.localDescription);
                sdp = self.processSdp(sdp);
                var offer = {
                    'action': 'relay',
                    to:self.callee,
                    data:{'action':'voice',
                        'id': 'sdp',
                        'mode':'caller',
                        'sdp':JSON.parse(sdp),
                        'to': self.callee
                    }
                };
                $rootScope.sendMessage(offer);
                log.info('VoiceCaller: offer sent  - 2 step',offer);

            }).catch(function (error) {
                log.info('VoiceCaller: ',error);
            });
        }).catch(function (error) {
            log.info('VoiceCaller: creating error', error);
        });
    
    }
    this.addRemoteSDP = function(sdp) {
        this.connector.setRemoteDescription(new RTCSessionDescription(sdp)).then(function() {
            if(sdp.type == 'offer') {
                self.connector.createAnswer().then(function(description) {
                    self.connector.setLocalDescription(description).then(function() {
                        $rootScope.sendMessage({'action': 'relay',to:self.callee,data:{'action':'voice','id': 'sdp','mode':'caller','sdp': self.connector.localDescription, 'to':self.callee}});
                    }).catch(function(error) {
                        log.info(error);
                    });
                }).catch(function(error) {
                    log.info(error);
                });
            }
        }).catch(function(error) {
            log.info(error);
        });    
    }

    
}

function voiceCallee(caller,media,$rootScope) {
    this.caller = caller; // socket id
    this.media = media; // media
    this.remoteStream = null;
    this.connector = null;
    this.candidatesQueue = [];    
    var self = this;
    
    this.addICE = function(ice) {
        if( this.connector ) {
            log.info('VoiceCallee: received candidate - 3 step');
            this.connector.addIceCandidate(new RTCIceCandidate(ice)).catch(function(error) {
                log.info(error);
            });
        }
        else {
            log.info('VoiceCallee: received candidate added - 3 step');
            candidatesQueue.push(ice)
        }
    };

    this.start = function() {
        this.doAnwser();
    };

    this.stop = function() {
        if( this.connector ) {
            this.connector.close();
            this.connector = null;
        }
        this.candidatesQueue = [];
        RemoveVoiceTag(self.caller);
        log.info('stop local audio stream');
    };

    this.doAnwser = function() {
        this.connector = new RTCPeerConnection(peerConnectionConfig);
        if(this.candidatesQueue.length) {
            while( this.candidatesQueue.length) {
                var ice = candidatesQueue.shift();
                this.connector.addIceCandidate(new RTCIceCandidate(ice)).catch(function(error) {
                    log.info(error);
                });
            }
        }

        this.connector.onicecandidate = function(event) {
            log.info('VoiceCallee: onicecandidate - 1 step',event.candidate);
            if (event.candidate != null) {
                $rootScope.sendMessage({'action': 'relay',to:self.caller,data:{'action':'voice','id': 'ice','mode':'callee','ice': event.candidate,'to': self.caller}});
                log.info('VoiceCallee: sending candidate - 1 step');
            }
        };
        this.connector.onaddstream = function(event) {
            log.info('VoiceCallee: got remote stream - 5');
            self.remoteStream = event.stream;
            InserVoiceTag(self.caller).srcObject = self.remoteStream;
        };

        this.connector.oniceconnectionstatechange = function(event) {
            if(!this.connector||this.connector.iceConnectionState=='disconnected') {
                log.info('Voice Call: stopping stream');
                // $rootScope.onStopStream(self.caller)
            }
        };
    };

    this.addRemoteSDP = function(sdp) {
        this.connector.setRemoteDescription(new RTCSessionDescription(sdp)).then(function() {
            if(sdp.type == 'offer') {
                log.info('VoiceCallee: ice offer - 4');
                self.connector.createAnswer().then(function(description) {
                    self.connector.setLocalDescription(description).then(function() {
                        $rootScope.sendMessage({'action': 'relay',to:self.caller,data:{'action':'voice','id': 'sdp','mode':'callee','sdp': self.connector.localDescription, 'to':self.caller}});
                        log.info('VoiceCallee: ice send - 4');
                    }).catch(function(error) {
                        log.info(error);
                    });
                }).catch(function(error) {
                    log.info(error);
                });
            }
        }).catch(function(error) {
            log.info(error);
        });    
    }
}

