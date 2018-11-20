angular.module('rpi3x', [
    'ui.router','ngMaterial','ngRoute'
])
.config(function($routeProvider) {

    $routeProvider
        .when("/", {
            templateUrl : "components/login/login.html"
        })
        .when("/login", {
            templateUrl : "components/login/login.html"
        })    
        .when("/join", {
            templateUrl : "components/join/join.html"
        })    
        .when("/room", {
            templateUrl : "components/room/room.html"
        }) 

})

.run(function($rootScope,$state,$transitions){

    $state.defaultErrorHandler(function() { /* do nothing */});
    var socketio = null;  // real time socketio
    var candidatesQueue={};
    $rootScope.safeApply = function(fn) {
        var phase = $rootScope.$$phase;
        if(phase == '$apply' || phase == '$digest') {
            if(fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            $rootScope.$apply(fn);
        }
    };
    $rootScope.safeParam = function(key,value) {
        $rootScope.safeApply(function()
        {
            $rootScope[key]=value;
        });
    };

    $rootScope.appName='Prizem';
    $rootScope.isWeb=typeof(require) == "undefined";
    $rootScope.connectedWiFi=null;
    $rootScope.logined=false;
    $rootScope.showSettings=true;
    $rootScope.isWhiteboard=false;
    $rootScope.connected=false;
    $rootScope.timeout=null;
    $rootScope.uuid=null;
    $rootScope.connections={};
    $rootScope.remotePlaying=false;
    $rootScope.localPlaying=false;
    $rootScope.stream=null;
    $rootScope.networks=[];
    $rootScope.recents=[];
    $rootScope.cancelFunction=null;
    $rootScope.maximized=false;

    $rootScope.loginName = settings.get('username')||os.userInfo().username;

    $rootScope.bShowWhiteboard = false;
    $rootScope.streamer = null;
    $rootScope.streamer_screen = null;
    $rootScope.bShowDoc = false;
    $rootScope.bShowTextChat = true;
    $rootScope.bSharingStream = false;

    $rootScope.bPublisher = false;
    // publiser

    $rootScope.manual_connect = true;
    //-----------------//
    $rootScope.voiceMedia = new voiceMedia();
    //-----------------//
    window.addEventListener("dragover",function(e){
        e = e || event;
        e.preventDefault();
    },false);
    window.addEventListener("drop",function(e){
        e = e || event;
        e.preventDefault();
    },false);
    
    //-------------------------------------------------------------//
    //-------------------------------------------------------------//
    //-------------------------------------------------------------//
    var default_team = "Public";
    $rootScope.entered_team = default_team;

    $rootScope.cls=[];
    $rootScope.ownerID = "";

    //-------------------------------------------------------------//
    $rootScope.public_teams=[];
    $rootScope.private_teams=[];

    $rootScope.enteredPrivateRoom = {};
    $rootScope.enteredPublicRoom = {};
    $rootScope.currentTeam = {}

    //-------------------------------------------------------------//
    $rootScope.currentRoomState = "";
    //-------------------------------------------------------------//

    $rootScope.findUser = function( name ) {
        for( var i = 0; i < $rootScope.cls.length; i++ )
            if( $rootScope.cls[i].login == name )
                return i;
        return -1;
    }
    //-------------------------------------------------------------//
    $rootScope.findPublicTeam = function( teamname ) {
        
        for( var i = 0; i < $rootScope.public_teams.length; i++ )
            if( $rootScope.public_teams[i].name == teamname )
                return i;
        return -1;
    }
    $rootScope.findPrivateTeam = function( teamname ) {
        
        for( var i = 0; i < $rootScope.private_teams.length; i++ )
            if( $rootScope.private_teams[i].name == teamname )
                return i;
        return -1;
    }

    $rootScope.findCollab = function( team,url ) {
        
        for( var i = 0; i < team.collab.length; i++ )
            if( team.collab[i].url == url )
                return i;
        return -1;
    }
    $rootScope.findDocumentName = function( doc_name ) {
        
        for( var i = 0; i < $rootScope.teams.length; i++ ) {
            var team = $rootScope.teams[i];
            for( var j = 0; j < team.collab.length; j++ ) {
                if( team.collab[j].name == doc_name )
                    return true;
            }
        }
        return false;
    }
    //---------------------------------------------------------------//
    $rootScope.findCaller = function(team,id) {
        for( var i = 0; i < team.voiceCaller.length; i++ ) {
            if(team.voiceCaller[i].callee == id)
                return i;
        }
        return -1;
    }
    $rootScope.findCallee = function(team,id) {
        for( var i = 0; i < team.voiceCallee.length; i++ ) {
            if(team.voiceCallee[i].caller == id)
                return i;
        }
        return -1;
    }

    $rootScope.isActiveTeam = function( team ) {
        if( $rootScope.currentTeam.name == team )
            return true;
        return false;
    }

    //-------------------------------------------------------------//
    //-------------------------------------------------------------//
    //-------------------------------------------------------------//
    // socket module
    $rootScope.sendMessage = function( message ) {
        if( socketio == null ) {
            return;
        }
        var team = "";
        if( $rootScope.currentRoomState == "public" ) {
            team = $rootScope.enteredPublicRoom.name;
        }
        else {
            team = $rootScope.enteredPrivateRoom.name;
        }
        message.team = team;
        socketio.emit('message',message);
    };

    var connectSocket = function() {
        if( socketio ) {
            return;
        }
        //---------------------------------------------------------------//
        //---------------------------------------------------------------//
        //---------------------------------------------------------------//
        // connect to server        
        console.log(netServer);
        socketio = io.connect('https://' + netServer);
        //socketio = io.connect('http://' + netServer + ':80');
        socketio.on('connection', function(message){
            $rootScope.ownerID = message.id;
            if(status && status.canceled) {
                cancelConnection();
                return;
            }
            switchConnection(true);
            log.info("Connection is made");
            $rootScope.safeParam('connected',true);
            if($rootScope.logined) {
                $state.go('empty');
                //$rootScope.onShareSettingsClick();

            }
            else {
                $state.go('login');
            }

        });
        socketio.on('disconnect', function(){
            console.log('user disconnected');
            $rootScope.safeParam('connected',false);
            $rootScope.safeParam('logined',false);
            $rootScope.closeConnections();
            $rootScope.onReceiveStopScreen();
            log.info('onclose');
            switchConnection(false);
            // mainConnect();        
        });
        socketio.on('message', function (message) {
            if( message.action == 'relay') {
                console.log( message );
                var team = message.team;
                var from = message.from;
                message = message.data;
                message.team = team;
                message.from = from;
            }
            switch(message.action) {
                case 'login':
                    // $rootScope.sendTeams(message);
                    break;
                case 'clients':
                    log.info(message.data);
                    log.info('clients');
                    $rootScope.safeParam('cls',message.data);
                    if( $rootScope.onEnterExitInRoom != undefined )
                        $rootScope.onEnterExitInRoom();
                    break;
                case 'uuid':
                log.info('uuid');
                    $rootScope.safeParam('uuid',message.data);
                    break;

                case 'join_team':
                    $rootScope.sendPublisher(message);
                    // $rootScope.sendVoicePublisher(message);
                    break;
                case 'leave_team':
                    if( message.public == "on" ) {
                        var idx = $rootScope.findPublicTeam(message.name);
                        if( idx != -1 ) {
                            break;
                        }
                        // var team = $rootScope.public_teams[idx];
                        // idx = $rootScope.findCallee( team,message.from );
                        // if( idx != -1 ) {
                        //     var callee = team.voiceCallee[idx];
                        //     callee.stop();
                        //     team.voiceCallee.splice(idx,1);
                        // }                
                    }
                    else {
                        var idx = $rootScope.findPrivateTeam(message.name);
                        if( idx != -1 ) {
                            break;
                        }
                        // var team = $rootScope.private_teams[idx];
                        // idx = $rootScope.findCallee( team,message.from );
                        // if( idx != -1 ) {
                        //     var callee = team.voiceCallee[idx];
                        //     callee.stop();
                        //     team.voiceCallee.splice(idx,1);
                        // }                
                    }
                    $rootScope.safeApply(()=>{
                    });
                    break;
                case 'create_team':
                    if( message.public == "on" ) {
                        var idx = $rootScope.findPublicTeam(message.name);
                        if( idx != -1 ) {
                            break;
                        }
                        $rootScope.public_teams.push({name:message.name,public:message.public,creator:message.creator,chats:[],voicePublish:false,voiceCaller:[],voiceCallee:[],collab:message.collab});
                    }
                    else {
                        var idx = $rootScope.findPrivateTeam(message.name);
                        if( idx != -1 ) {
                            break;
                        }
                        $rootScope.private_teams.push({name:message.name,public:message.public,creator:message.creator,chats:[],voicePublish:false,voiceCaller:[],voiceCallee:[],collab:message.collab});
                    }
                    $rootScope.safeApply(()=>{
                    });

                    break;
                case 'remove_team': // from server
                    var idx = $rootScope.findTeam(message.teamname);
                    if( idx == -1 )
                        break;
                    var team = $rootScope.teams[idx];
                    $rootScope.onRemoveTeam( team,idx );
                    break;

                case 'create_collab':
                    var idx = $rootScope.findTeam(message.team);
                    if( idx == -1 ) {
                        break;
                    }
                    var team = $rootScope.teams[idx];
                    var idx2 = $rootScope.findCollab(team,message.url);
                    if( idx2 != -1 )
                        break;
                    team.collab.push({url:message.url,name:message.name});
                    $rootScope.insertDocCollabration({url:message.url,name:message.name})
                    $rootScope.safeApply(()=>{
                    });
                    break;
                case 'rename_collab':
                    var idx = $rootScope.findTeam(message.team);
                    if( idx == -1 ) {
                        break;
                    }
                    var team = $rootScope.teams[idx];
                    var idx2 = $rootScope.findCollab(team,message.url);
                    if( idx2 == -1 )
                        break;
                    team.collab[idx2].name = message.name;
                    $rootScope.safeApply(()=>{
                    });
                    break;
                case 'remove_collab':
                    $rootScope.onRemoveCollab( message.team,message.url );
                    break;
                case 'sendMeOffer':
                    if( $rootScope.isActiveTeam(message.team) == false )
                        break;
                    createPeer(message);
                    $rootScope.connections[message.data].addStream($rootScope.stream);

                    log.info('WEBRTC: creating offer');

                    $rootScope.connections[message.data].createOffer().then(function (description) {
                        log.info('WEBRTC: setLocalDescription for offer');

                        $rootScope.connections[message.data].setLocalDescription(description).then(function () {
                            log.info('WEBRTC: start sending offer');
                            var sdp = JSON.stringify($rootScope.connections[message.data].localDescription);
                            sdp=processSdp(sdp);
                            var offer = {
                                'action': 'sdp',
                                'sdp':JSON.parse(sdp),
                                'to': message.data
                            };
                            $rootScope.sendMessage(offer);
                            log.info('WEBRTC: offer sent',offer);

                        }).catch(function (error) {
                            log.info('WEBRTC: ',error);
                        });
                    }).catch(function (error) {
                        log.info('WEBRTC: creating error', error);
                    });
                    break;
                case 'readyToStream':
                    if( $rootScope.isActiveTeam(message.team) == false )
                        break;
                    
                    $rootScope.bSharingStream = true;
                    $rootScope.safeParam('remotePlaying', true);
                    $rootScope.safeParam('isGroup',true);

                    if(message.type==SHARE_TYPE_SCREEN) {
                        $rootScope.onReceiveStartScreen(message);
                    }
                    else if(message.type==SHARE_TYPE_WHITEBOARD)
                    {
                        $rootScope.onReceiveStartWiteboard();
                    }
                    break;
                case 'stopStreaming':
                    if( $rootScope.isActiveTeam(message.team) == false )
                        break;
                    if( message.type == SHARE_TYPE_WHITEBOARD )
                        $rootScope.onStopWhiteboard(message.data);
                    else
                        $rootScope.onReceiveStopScreen(message.data);
                    $rootScope.safeParam('remotePlaying', false);
                    break;
                case 'sdp':
                    if( $rootScope.isActiveTeam(message.team) == false )
                        break;
                    if(message.sdp.type == 'offer') {
                        createPeer(message);
                        // $rootScope.connections[message.data] = new RTCPeerConnection(peerConnectionConfig);
                        if(candidatesQueue[message.data])
                        {
                            while (candidatesQueue[message.data].length) {
                                ice = candidatesQueue[message.data].shift();
                                $rootScope.connections[message.data].addIceCandidate(new RTCIceCandidate(ice)).catch(function(error) {
                                    log.info(error);
                                });
                            }
                        }
                        $rootScope.connections[message.data].onaddstream = function(event) {
                            log.info('WEBRTC: got remote stream');

                            $rootScope.safeParam('stream',event.stream);
                            document.getElementById('streamVideo').srcObject=event.stream;

                        };

                        $rootScope.connections[message.data].oniceconnectionstatechange = function(event) {
                            if(!$rootScope.connections[message.data]||$rootScope.connections[message.data].iceConnectionState=='disconnected')
                            {
                                log.info('WEBRTC: stopping stream');
                                $rootScope.onReceiveStopScreen(message.data)
                            }

                        };

                    }

                    $rootScope.connections[message.data].setRemoteDescription(new RTCSessionDescription(message.sdp)).then(function() {
                        if(message.sdp.type == 'offer') {
                            $rootScope.connections[message.data].createAnswer().then(function(description) {
                                $rootScope.connections[message.data].setLocalDescription(description).then(function() {
                                    $rootScope.sendMessage({'action': 'sdp','sdp': $rootScope.connections[message.data].localDescription, 'to':message.data});
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
                    break;
                case 'ice':
                    if( $rootScope.isActiveTeam(message.team) == false )
                        break;
                    if($rootScope.connections[message.data])
                    {
                        $rootScope.connections[message.data].addIceCandidate(new RTCIceCandidate(message.ice)).catch(function(error) {
                            log.info(error);
                        });
                    }
                    else
                    {
                        if(!candidatesQueue[message.data])
                        {
                            candidatesQueue[message.data]=[];
                        }
                        candidatesQueue[message.data].push(message.ice)
                    }
                    break;
                case 'error':
                    window.alert(message.message);
                    if (message.code == '333') {
                        $rootScope.safeParam('logined',false);
                        $state.go('login');
                    }
                    break;
                case 'wbSync':
                    if( $rootScope.isActiveTeam(message.team) == false )
                        break;
                    var wbSync = function() {
                        if (!!designer && !!designer.iframe && designer.isReady) {
                            designer.syncData(message.sync);

                        } else {
                            $rootScope.syncQueue.push(message.sync);
                        }

                    };
                    wbSync();
                    break;
                case 'text':
                    $rootScope.recievedText(message);
                    break;
                case 'startVoice':
                    console.log( message );
                    if( $rootScope.isActiveTeam(message.team) == false )
                        break;
                    var idx = $rootScope.findTeam(message.team);
                    if( idx == -1 )
                        break;
                    var team = $rootScope.teams[idx];
                    log.info('VoiceCallee: start video - 0');
                    var callee = new voiceCallee(message.from,$rootScope.voiceMedia,$rootScope);
                    
                    team.voiceCallee.push(callee);
                    $rootScope.sendMessage({
                        'action': 'relay',
                        'to': message.from,
                        data: {
                            'action': 'voice',
                            'id':'voicecalleer',
                        }
                    });                        
                    break;
                case 'stopVoice':
                    console.log( message );
                    if( $rootScope.isActiveTeam(message.team) == false )
                        break;
                    var idx = $rootScope.findTeam(message.team);
                    if( idx == -1 )
                        break;
                    var team = $rootScope.teams[idx];
                    idx = $rootScope.findCallee( team,message.from );
                    if( idx != -1 ) {
                        var callee = team.voiceCallee[idx];
                        callee.stop();
                        team.voiceCallee.splice(idx,1);
                    }
                    break;
            
                case 'voice':
                    console.log( message );
                    $rootScope.processVoiceEvent(message);
                    break;
            }
        })
    };
    //---------------------------------------------------------------//
    //---------------------------------------------------------------//
    //---------------------------------------------------------------//                



    if(!$rootScope.isWeb)
    {
        var oldBounds=null;
        var win = require('electron').remote.getCurrentWindow();
        win.on('maximize',()=>$rootScope.safeParam('maximized',true));
        win.on('unmaximize',()=>$rootScope.safeParam('maximized',false));
        var hideTopPanelTimeout,hideTopPanelResetTimeout;
        var onMoveHandler;
        win.on('move',(event)=>{
            if(onMoveHandler)
            {
                onMoveHandler(event);
            }
        });

        $rootScope.onMinimizeClick=function()
        {
            require('electron').remote.getCurrentWindow().minimize();
        };
        $rootScope.onMaximizeClick=function()
        {
            win=require('electron').remote.getCurrentWindow();

            if (win.isMaximized())
            {
                win.unmaximize();
            }
            else
            {
                win.maximize();

            }

        };
        $rootScope.onCloseClick=function()
        {
            require('electron').remote.getCurrentWindow().close();
        };
    }
    window.addEventListener('resize',()=>{
        if(!!designer) {
            designer.setSize();
        }
    });

    $rootScope.processVoiceEvent = function(message) {
        switch(message.id) {
            case 'voicecalleer':
                log.info('VoiceCaller: request - 0');
                var caller = new voiceCaller(message.from,$rootScope.voiceMedia,$rootScope);
                var idx = $rootScope.findTeam(message.team);
                if( idx == -1 )
                    break;
                var team = $rootScope.teams[idx];
                team.voiceCaller.push(caller);
                caller.start();
                break;
            case 'sdp':
                if(message.sdp.type == 'offer') {
                    var idx = $rootScope.findTeam(message.team);
                    if( idx == -1 )
                        break;
                    var team = $rootScope.teams[idx];
                    idx = $rootScope.findCallee( team,message.from );
                    if( idx != -1 ) {
                        team.voiceCallee[idx].start();
                    }
                }
                if( message.mode == 'caller') {
                    var idx = $rootScope.findTeam(message.team);
                    if( idx == -1 )
                        break;
                    var team = $rootScope.teams[idx];
                    idx = $rootScope.findCallee( team,message.from );
                    if( idx != -1 ) {
                        team.voiceCallee[idx].addRemoteSDP(message.sdp);
                    }
                }
                else if( message.mode == 'callee') {
                    var idx = $rootScope.findTeam(message.team);
                    if( idx == -1 )
                        break;
                    var team = $rootScope.teams[idx];
                    idx = $rootScope.findCaller( team,message.from );
                    if( idx != -1 ) {
                        team.voiceCaller[idx].addRemoteSDP(message.sdp);
                    }
                }
                break;
            case 'ice':
                if( message.mode == 'caller') {
                    var idx = $rootScope.findTeam(message.team);
                    if( idx == -1 )
                        break;
                    var team = $rootScope.teams[idx];
                    idx = $rootScope.findCallee( team,message.from );
                    if( idx != -1 ) {
                        team.voiceCallee[idx].addICE(message.ice);   
                    }
                }
                else if( message.mode == 'callee') {
                    var idx = $rootScope.findTeam(message.team);
                    if( idx == -1 )
                        break;
                    var team = $rootScope.teams[idx];
                    idx = $rootScope.findCaller( team,message.from );
                    if( idx != -1 ) {
                        team.voiceCaller[idx].addICE(message.ice);   
                    }
                }            
                break;
        }
        
    }
    //---------------------------------------------------------------//
    $rootScope.sendTeams=function(message) {
        for( var i = 1; i < $rootScope.teams.length; i++ ) {
            if( $rootScope.teams[i].creator == $rootScope.loginName ) {
                socketio.emit('message',{action:'relay',to:message.id,team:$rootScope.currentTeam.name,data:{action:'create_team',name:$rootScope.teams[i].name,creator:$rootScope.loginName,data:$rootScope.ownerID,team:$rootScope.currentTeam.name}});
            }
        }
    }
    
    $rootScope.sendPublisher=function(message) {
        if( $rootScope.currentTeam.name != message.team )
            return;
        if( $rootScope.streamer_screen ) {
            socketio.emit('message',{action:'relay',to:message.id,team:$rootScope.currentTeam.name,data:{action:'readyToStream',data:$rootScope.ownerID,type: $rootScope.streamer_screen.type,team:$rootScope.currentTeam.name}});
        }
        if( $rootScope.streamer ) {
            socketio.emit('message',{action:'relay',to:message.id,team:$rootScope.currentTeam.name,data:{action:'readyToStream',data:$rootScope.ownerID,type: $rootScope.streamer.type,team:$rootScope.currentTeam.name}});
        }

        for (var i = 0; i <  $rootScope.wbSync.length; i++) {
            $rootScope.wbSync[i].team = $rootScope.currentTeam.name;
            $rootScope.wbSync[i].data = $rootScope.ownerID;
            socketio.emit('message',{action:'relay',to:message.id,team:$rootScope.currentTeam.name,data: $rootScope.wbSync[i]});
        }        
    }
    $rootScope.sendVoicePublisher=function(message) {
        if( $rootScope.currentTeam.name != message.team )
            return;
        if( $rootScope.currentTeam.voicePublish == false )
            return;
        socketio.emit('message',{action:'relay',to:message.id,team:$rootScope.currentTeam.name,data:{action:'startVoice',id:message.id}});
    }
    // Screen Sharing
    var createPeer = function(json)
    {
        $rootScope.connections[json.data]= new RTCPeerConnection(peerConnectionConfig);
        if(candidatesQueue[json.data])
        {
            while (candidatesQueue[json.data].length) {
                var ice = candidatesQueue[json.data].shift();
                $rootScope.connections[json.data].addIceCandidate(new RTCIceCandidate(ice)).catch(function(error) {
                    log.info(error);
                });
            }
        }

        $rootScope.connections[json.data].onicecandidate = function (event) {
            log.info('WEBRTC: onicecandidate',event.candidate);
            if (event.candidate != null) {
                
                $rootScope.sendMessage({'action': 'ice','ice': event.candidate,'to': json.data});
                log.info('WEBRTC: sending candidate');

            }
        };
    };

    $rootScope.closeConnections=function()
    {
        $rootScope.bSharingStream = false;
        $rootScope.bPublisher = false;

        document.getElementById('streamVideo').srcObject=null;
        $rootScope.safeParam('stream',null);

        if($rootScope.localPlaying)
        {
            log.info('stop streaming');

            for(var j=0;j<$rootScope.connections.length;j++)
            {
                if($rootScope.connections[j])
                {
                    $rootScope.connections[j].close();
                    $rootScope.connections[j]=null;
                }

            }
            $rootScope.safeParam('localPlaying',false);

            $rootScope.sendMessage({
                'action': 'stopStreaming', type:SHARE_TYPE_SCREEN
            });
        }

        if($rootScope.isWhiteboard)
        {
            $rootScope.sendMessage({
                'action': 'stopStreaming', type:SHARE_TYPE_WHITEBOARD
            });
            $rootScope.safeParam('isWhiteboard',false);

        }
        $rootScope.streamer_screen=null;
        $rootScope.streamer=null;
        $rootScope.wbSync=[];

    };

    $rootScope.safeApply(()=>{
        connectSocket();
    })
    return

    $transitions.onSuccess({}, ($transition)=> {
        var toState=$transition.$to();
        var fromState=$transition.$from();

        if(toState)
        {
            if(toState.name!='loading')
            {
                $rootScope.safeParam('cancelFunction', null);

            }

            if(toState.name=='sharing')
            {
                $rootScope.safeParam('showSettings',false);
                if(!$rootScope.isWeb) {
                    win = require('electron').remote.getCurrentWindow();
                    var topPanel = document.getElementById('topPanel');
                    var h = topPanel.offsetHeight + 1;
                    var resizeFunction = ()=> {
                        if (!win.isMaximized() && win.getMinimumSize()[1] == 1 && win.isResizable()) {
                            oldBounds = win.getBounds();
                            var workAreaSize = require('electron').remote.screen.getPrimaryDisplay().workAreaSize;
                            var _x = (workAreaSize.width - win.getSize()[0]) / 2;

                            log.info('workAreaWidth', workAreaSize);
                            var _bounds = {
                                width: win.getSize()[0],
                                height: h,
                                x: _x,
                                y: 0
                            };
                            log.info('setting bounds', _bounds);

                            win.setBounds(_bounds, true);
                            var postResizeFunction = ()=> {
                                if (win.getBounds().width == _bounds.width && win.getBounds().height == _bounds.height) {
                                    log.info('setBounds done', _bounds);
                                    win.setResizable(false);
                                    win.setAlwaysOnTop(true, "floating", 1);
                                    win.setVisibleOnAllWorkspaces(true);
                                    log.info('set rezible false, allways on top and visible on all workspaces')
                                }
                                else {
                                    setTimeout(postResizeFunction, 25);
                                }
                            };
                            postResizeFunction();
                            var hideTopPanel = ()=> {
                                clearTimeout(hideTopPanelTimeout);
                                clearTimeout(hideTopPanelResetTimeout);
                                var onMouseEnter = (e)=> {
                                    clearTimeout(hideTopPanelTimeout);
                                    var _point = require('electron').remote.screen.getCursorScreenPoint();
                                    if (_point.y <= 5 && _point.x >= _x && _point.x <= (_x + _bounds.width)) {
                                        dockVisible(true);
                                        hideTopPanelTimeout = setTimeout(hideTopPanel, 5000);
                                        hideTopPanelResetTimeout = setTimeout(onMouseEnterReset, 25);
                                    }
                                    else {
                                        hideTopPanelTimeout = setTimeout(onMouseEnter, 25);

                                    }

                                };
                                dockVisible(false);
                                hideTopPanelTimeout = setTimeout(onMouseEnter, 25);

                            };

                            var onMouseEnterReset = ()=> {
                                clearTimeout(hideTopPanelResetTimeout);
                                var _point = require('electron').remote.screen.getCursorScreenPoint();
                                if (_point.y >= _bounds.y && _point.y <= (_bounds.y + _bounds.height) &&
                                    _point.x >= _bounds.x && _point.x <= (_bounds.x + _bounds.width)) {
                                    clearTimeout(hideTopPanelTimeout);
                                    hideTopPanelTimeout = setTimeout(hideTopPanel, 5000);
                                    hideTopPanelResetTimeout = setTimeout(onMouseEnterReset, 25);

                                }
                                else {
                                    hideTopPanelResetTimeout = setTimeout(onMouseEnterReset, 10);

                                }
                            };
                            // hideTopPanelTimeout = setTimeout(hideTopPanel, 5000);
                            hideTopPanelResetTimeout = setTimeout(onMouseEnterReset, 25);
                            onMoveHandler = (event)=> {
                                if (event.sender.getBounds().x != _x || event.sender.getBounds().y != _bounds.y) {
                                    log.info('onMoveHandler');
                                    clearTimeout(hideTopPanelTimeout);
                                    clearTimeout(hideTopPanelResetTimeout);
                                    onMoveHandler = null;
                                }
                            }

                        }
                        else {
                            setTimeout(resizeFunction, 25)
                        }

                    };
                    if (win.isMaximized()) {
                        win.unmaximize();
                    }
                    if (win.getMinimumSize()[1] != 0) {
                        win.setMinimumSize(1, 1);
                    }
                    if (!win.isResizable()) {
                        win.setResizable(true);
                    }
                    resizeFunction();
                }
            }
            else {
                $rootScope.safeParam('showSettings',toState.name!='empty');
                if(!$rootScope.isWeb) {
                    clearTimeout(hideTopPanelTimeout);
                    clearTimeout(hideTopPanelResetTimeout);
                    if (oldBounds) {
                        log.info('setting old bounds');
                        onMoveHandler = null;
                        win = require('electron').remote.getCurrentWindow();
                        win.setResizable(true);
                        win.setBounds(oldBounds, true);
                        win.setMinimumSize(appMinWidth, appMinHeight);
                        win.setAlwaysOnTop(false);
                        win.setVisibleOnAllWorkspaces(false);
                        oldBounds = null;
                    }
                }
            }

        }
        log.info(fromState?fromState.name:'null',toState?toState.name:'null');

    });

    $rootScope.onCloseSettingsClick=function()
    {
        $rootScope.title=null;
        $rootScope.innerTitle=null;

        $rootScope.safeParam('showSettings',false);
        if(!!$rootScope.cancelFunction)
        {
            $rootScope.cancelFunction();
        }
        $state.go('empty');
    };
    $rootScope.onWiFiSettingsClick=function()
    {
        $rootScope.safeParam('showSettings',true);
        startLoading(null,'Scanning Wi-Fi',callScanWiFi);
    };

    $rootScope.onScanWiFiAuto=function()
    {
        $rootScope.safeParam('showSettings',true);
        setTimeout(callScanWiFi, 1000);
    };

    $rootScope.onHomepage=function()
    {
        $rootScope.safeParam('showSettings',false);
        $rootScope.safeParam('isWhiteboard',false);
        $rootScope.safeParam('stream',false);
        
        $rootScope.safeParam('isGroup',false);
        $rootScope.title = 'Home';        
        $state.go('empty');
    };

    $rootScope.onLoginSettingsClick=function()
    {
        if($rootScope.connected)
        {
            $rootScope.safeParam('showSettings',true);
            $state.go('login');
        }
    };
    $rootScope.onParticipantsSettingsClick=function()
    {
        if($rootScope.logined)
        {
            $rootScope.safeParam('showSettings',true);
            $state.go('users');

        }
    };
    $rootScope.onShareSettingsClick=function()
    {

        $rootScope.safeParam('showSettings',true);

        $state.go('screenSelect');

    };
    $rootScope.onGroupClick=function()
    {
        if($rootScope.logined)
        {
            $rootScope.safeParam('showSettings',false);
            $rootScope.safeParam('isWhiteboard',false);
            $rootScope.safeParam('stream',false);
            
            $rootScope.safeParam('isGroup',true);
            $state.go('empty');
            $rootScope.title = 'Teams';

        }
    };
    $rootScope.onStopClick=function()
    {
        $rootScope.bShowDoc = false;
        $rootScope.bShowWhiteboard = false;
        $rootScope.bShowScreen = false;
        $rootScope.bShowTextChat = true;
        $rootScope.maxChatLayout();
        $rootScope.closeConnections();
        $state.go('empty');
        //$rootScope.onShareSettingsClick();
    };
    var cancelConnection=()=>
    {
        $rootScope.safeParam('connected',false);
        $rootScope.safeParam('logined',false);
        clearTimeout($rootScope.timeout);
        $rootScope.closeConnections();
        $rootScope.onStopStream();
        log.info('onclose');
        switchConnection(false);
        if(socketio)
        {
            socketio = null;
        }
    };
    var startLoading=(status,message,runFunction,cancelState,cancelFunction)=>
    {
        message=message||null;
        cancelState=cancelState||null;

        if(!status)
        {
            status={canceled:false};
        }
        var applyFunction=()=>{
            if(status.canceled)
            {
                return;
            }
            $rootScope.cancelFunction=()=> {
                status.canceled = true;
                if (!!cancelFunction) {
                    cancelFunction();
                }
                $rootScope.safeParam('cancelFunction', null);

            };
            var _runFunction=()=>{
                if(!status.canceled && !!runFunction)
                {
                    runFunction(status);
                }
            };
            if(runFunction)
            {
                if($state.current.name=='loading')
                {
                    _runFunction();
                }
                else
                {

                    var deregisterListener=$transitions.onSuccess({}, ($transition)=> {
                        setTimeout(()=> {
                            deregisterListener();
                            _runFunction();
                        },100)
                    });
                }

            }
            console.log(message,cancelState);
            //$state.go('wifi');
            $state.go('loading',{message: message,cancelState:cancelState});
        };
        $rootScope.safeApply(applyFunction);

    };

    var callScanWiFi=(status)=>scanWiFi((err,response)=> {
        if(status && status.canceled)
        {
            log.info("callScanWifi: status = cancelled");
            return;
        }
        if(err) {
            if(checkWifi($rootScope)) {
                setTimeout(callScanWiFi, 1000);
                return;
            }
            return;
        }
        var networks=[];
        var recents=[];
        var _recents=settings.get('recents');
        log.info(_recents);
        for(var i=0;i<response.length;i++)
        {
            if(response[i].ssid.startsWith(netName))
            {
                networks.push(response[i]);
                if(_recents&&_recents[response[i].mac])
                {
                    recents.push(response[i]);
                }

            }
        }

        $rootScope.safeApply(()=>{
            $rootScope.networks=networks;
            $rootScope.recents=recents;
            $state.go('wifi');
        });

    });
    
    $rootScope.connectManual=()=>{
        if( socketio ) {
            socketio.emit('disconnect',"");
            delete socketio;
            socketio = null;
        }
        $rootScope.connected = false;
        $rootScope.logined = false;
        $state.go('empty');
        connectSocket(null);

    }

    $rootScope.clickDevice=(device)=>{
        startLoading(null,'Connecting Wi-Fi',(status)=>{
            if(status.canceled)
            {
                return;
            }
            var _recents=settings.get('recents')||{};
            if(!_recents[device.mac])
            {
                _recents[device.mac]=device.ssid;
                settings.set('recents',_recents);
            }
            if (!isManualMode) {
                log.info("Connecting in wifi mode ...");
                connectWiFi(device.ssid,(err)=> {
                    if(status.canceled)
                    {
                        return;
                    }
                    if(err) {
                        mainConnect(status);
                        return;
                    }
                    connectSocketFunc(status);
                })
            } else {
                log.info("Connecting in manual mode ...");
                connectSocketFunc(status);
            }
        },'wifi');
    };
    var mainConnect=(status)=> startLoading(status,'Connecting to server',mainConnectFunc,'wifi',cancelConnection);
    var mainConnectFunc=function(status)
    {
        if(status.canceled)
        {
            return;
        }
        clearTimeout($rootScope.timeout);

        if(!checkWifi($rootScope))
        {
            if( $rootScope.manual_connect == false )
                setTimeout(startLoading, 1000,status,'Connecting Wi-Fi',callScanWiFi);
        }
        else
        {
            $rootScope.safeParam('timeout',setTimeout(connectSocketFunc, 100,status));

        }

    };
    $rootScope.onLoginClicked = function (loginValue) {
        log.info('onLoginClicked', loginValue);
        $rootScope.loginName = loginValue;

        var hasWebCam=false,hasMic=false;
        if( navigator.mediaDevices )
        navigator.mediaDevices.enumerateDevices().then(function(devices) {
            devices.forEach(function(device) {
                if(!hasMic && device.kind=='audioinput')
                {
                    hasMic=true;
                }
                if(!hasWebCam && device.kind=='videoinput')
                {
                    hasWebCam=true;
                }
            });
           // $rootScope.onShareSettingsClick();
            $rootScope.sendMessage({action: 'login', login: loginValue, hasWebCam:hasWebCam, hasMic:hasMic});
            $rootScope.safeParam('logined',true);

            // $rootScope.safeParam('showSettings',false);
            // $rootScope.safeParam('isWhiteboard',false);
            // $rootScope.safeParam('stream',false);
            
            // $rootScope.safeParam('isGroup',true);
            $state.go('empty');          
            $rootScope.onHomepage();
        });
        else {
            $rootScope.sendMessage({action: 'login', login: loginValue, hasWebCam:hasWebCam, hasMic:hasMic});
            $rootScope.safeParam('logined',true);

            // $rootScope.safeParam('showSettings',false);
            // $rootScope.safeParam('isWhiteboard',false);
            // $rootScope.safeParam('stream',false);
            
            // $rootScope.safeParam('isGroup',true);
            $state.go('empty');          
            $rootScope.onHomepage();
        }


    };

    
    var connectSocketFunc=(status)=> startLoading(status,'Connecting to server',connectSocket,'wifi',cancelConnection);
    

    $rootScope.signalOffers=function(type)
    {
        log.info('signalOffers','go to sharing',type);
        $rootScope.isGroup = true;
        $rootScope.bSharingStream = true;
        $rootScope.bPublisher = true;

        if(type==SHARE_TYPE_SCREEN)
        {

            $rootScope.safeParam('isGroup',true);
            $state.go('empty');

            $rootScope.bShowDoc = false;
            $rootScope.bShowWhiteboard = false;
            $rootScope.bShowTextChat = false;
            $rootScope.bShowScreen = true;
            $rootScope.smallChatLayout();
            if($rootScope.isWeb)
            {
                $rootScope.safeApply(()=>{
                    document.getElementById('streamVideo').srcObject=$rootScope.stream;
                });
            }
            else
            {
                // $rootScope.isWeb = true;
                $rootScope.safeApply(()=>{
                    document.getElementById('streamVideo').srcObject=$rootScope.stream;
                });
                // $state.go('sharing');
            }
            $rootScope.safeParam('localPlaying',true);

        }
        else if(type==SHARE_TYPE_WHITEBOARD)
        {
            $rootScope.safeParam('showSettings',false);
            $rootScope.safeParam('isWhiteboard',true);
            $rootScope.safeParam('stream',false);
            $rootScope.safeParam('isGroup',true);
            $state.go('empty');

            $rootScope.bShowWhiteboard = true;
            $rootScope.bShowDoc = false;
            $rootScope.bShowTextChat = false;
            $rootScope.bShowScreen = false;

            $rootScope.smallChatLayout();

            // $rootScope.safeParam('localPlaying',true);

            wbStart($rootScope);
        }

        $rootScope.sendMessage({'action':'readyToStream', type:type})
        $rootScope.streamer = {type:type};

    };
    if( $rootScope.isWeb ) {
        startLoading(connectSocketFunc(null));
        return;
    }
    if(initWifi($rootScope))
    {
        startLoading(connectSocketFunc(null));
    }
    else
    {
        $rootScope.safeParam('showSettings',true);
        startLoading(null,'Scanning Wi-Fi',callScanWiFi);
    }
}).config(function($mdThemingProvider, $mdGestureProvider) {

    var customMap = $mdThemingProvider.extendPalette('indigo', {
        '500': '#0C8FB3',
        '400': '#2F9EBD',
        '300': '#51AFC9',
        '200': '#6FC0D6',
        '100': '#8ACCDE'
    });
    $mdThemingProvider.definePalette('custom', customMap);
    $mdThemingProvider.theme('default')
        .primaryPalette('custom');
})
.filter('trustAsHtml', function($sce) { return $sce.trustAsHtml; })

function processSdp(sdp) {
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
function connectWiFi(ssid, callback)
{
    wifi.connectToAP({ssid: ssid, password: netPass}, (err, response)=>{
        if (err) {
            callback(err)
        }
        else {
            log.info('WiFi connected',response);
            callback(null)
        }
    });

}
function checkWifi($rootScope)
{
    if($rootScope.isWeb)
    {
        return true;
    }
    var ifaceState = wifi.getIfaceState();
    if(ifaceState.success && !!ifaceState.ssid)
    {
        $rootScope.safeParam('connectedWiFi',ifaceState);
        log.info(ifaceState);
        if(ifaceState.ssid.startsWith(netName))
        {
            return true;
        }
        else
        {
            $rootScope.safeParam('connectedWiFi',null);
        }
    }
    return false;
}
function initWifi($rootScope)
{
    if($rootScope.isWeb)
    {
        return true;
    }
    wifi.init({
        debug: true
    });
    wifiScan.init({
        iface: null
    });

    return checkWifi($rootScope);
}
function scanWiFi(callback)
{
    wifiScan.scan((err, response)=> {
        if (err) {
            log.info(err);
            callback(err)
        } else
        {
            log.info('WiFi',response);
            callback(null,response)
        }
    });
}
