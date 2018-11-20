angular.module("rpi3x").controller("room", ['$scope','$rootScope','$http','$timeout',function($scope,$rootScope,$http,$timeout) {
// angular.module("rpi3x").controller("GroupController", ['$scope','$rootScope','$state','$http','$timeout',function($scope,$rootScope,$state,$http,$timeout) {

    $scope.bShowShareMenu = true;
    $scope.bShowWhiteboard = false;
    $scope.bStartWhiteboard = false;
    $scope.bMasterWhiteboard = false;
    $scope.bShowScreen = false;
    $scope.bStartScreen = false;
    $scope.bMastertScreen = false;
    $rootScope.teams=[];
    $rootScope.teams.push({name:"Public",creator:$rootScope.loginName,active:true,enter:true,chats:[],voicePublish:false,voiceCaller:[],voiceCallee:[],collab:[]});
    $rootScope.currentTeam = $rootScope.teams[0];
    $scope.bShowScreenSelect = false;

    $scope.bShowDoc = false;
    $scope.roomTitle = ""
    $scope.roomName = ""

    $scope.bShowTab = false;
    $scope.nShowTabIndex = 0;
    $scope.bShowTabChat = true;
    $scope.bShowTabRoaster = false;

    $scope.roasters = $rootScope.cls;

    if( $rootScope.currentRoomState == "public") {
        $scope.roomTitle = "public rooms";
        $scope.roomName = $rootScope.enteredPublicRoom.name;
    }
    else {
        $scope.roomTitle = "private rooms";
        $scope.roomName = $rootScope.enteredPrivateRoom.name;
    }

    $scope.onload = function() {
        $(function () {
            $(".perticipants-list").niceScroll({
                scrollspeed: 400,
                cursorborder: "1px solid #B7DBFF",
                cursorcolor: "#B7DBFF"
            });
            $("#chat").on('click', function (e) {
                e.preventDefault();
                $('.chat').toggleClass('show');
            });
            $("#roaster").on('click', function (e) {
                e.preventDefault();
                $('.perticipants-wrap').toggleClass('show');
            });
            $(".chat .fa-minus").on('click', function (e) {
                e.preventDefault();
                $('.chat').toggleClass('minimized');
            });
            $(".chat .fa-close").on('click', function (e) {
                e.preventDefault();
                $('.chat').removeClass('show');
            });
            $(".perticipants-wrap .fa-close").on('click', function (e) {
                e.preventDefault();
                $('.perticipants-wrap').removeClass('show');
            });
        });
    }

    /* begin rango modified  */
    $scope.onFileUpload = function() {
        document.getElementById("upload-file").click();
    } 

    $scope.getChatContents = function( chat ) {
        if( chat.from == $scope.ownerID )
            return 'components/group/textchat_tag_owner.html';
        else
            return 'components/group/textchat_tag_user.html';
    }

    $rootScope.findTeam = function( teamname ) {
        for( var i = 0; i < $rootScope.teams.length; i++ )
            if( $rootScope.teams[i].name == teamname )
                return i;
        return -1;
    }

    $scope.onKeyDown = function ($event) {
        let keycode = (window.event ? $event.keyCode : $event.which);
        if( keycode == 13 && $event.shiftKey == false )
            $scope.doPostText();
    };

    $scope.text2html = function(text) {
        var len = text.length;
        var html = "";
        for( var i = 0; i < len; i++ ) {
            if( text[i] ==' ')
                html += "&nbsp;"
            else if( text[i] == '\n' )
                html += "<br>";
            else 
                html += text[i];
        }
        return html;
    }

    $scope.doPostText = function() {
        let editor = document.getElementById('chat_input_edit');
        var html = editor.value;
        editor.value = '';
        editor.focus();
        if( html.trim() == '' )
            return;
        html = $scope.text2html(html);
        let message = { action:'text',name:$rootScope.loginName,from:$rootScope.ownerID,text:{ text:html,team:$scope.roomName } };
        $rootScope.sendMessage( message );
        callbackTextChat( message );
        $scope.inputText = "";
    }

    $rootScope.recievedText = function(message) {
        var team = message.team;
        var chat = message;
        chat.bRead = 0;
        chat.date = new Date();       
        var teamIdx = $rootScope.findTeam(team); 
        
        if( $rootScope.enteredPublicRoom.name == team || $rootScope.enteredPrivateRoom.name == team)
            callbackTextChat( message );
        else
            if( teamIdx != -1 )
                $rootScope.teams[teamIdx].chats.push(chat);
    }

    function callbackTextChat(message) {
        var chat = message;
        chat.bRead = 1;
        chat.date = new Date();
        $rootScope.currentTeam.chats.push(chat);

        $rootScope.safeApply(function() {
            $timeout(function() {
                let scroller = document.getElementById('chatBody');
                scroller.scrollTop = scroller.scrollHeight;
              }, 0, false);            
        });            
    };

    /* end rango modified  */

    $scope.onClickExit = function() {
        window.location.href = "#!join";
        $scope.bStartWhiteboard = false;

        $rootScope.cls=[];
        $rootScope.wbSync=[];
        $rootScope.streamer=null;
        wbExit();
        $rootScope.streamer_screen=null;

        if( $scope.bMasterWhiteboard == true ) {
            $rootScope.sendMessage({
                'action': 'stopStreaming', type:SHARE_TYPE_WHITEBOARD
            });
        }
        $scope.bMasterWhiteboard = false;

        let message = { action:'leave_team',from:$rootScope.loginName };
        $rootScope.sendMessage(message);

        $rootScope.currentRoomState = "";
        $rootScope.enteredPublicRoom = {};
        $rootScope.enteredPrivateRoom = {};
    }

    $scope.onClickTab = function( item ) {
        if( item == 0 ) {
            $scope.bShowTabChat = true
            $scope.bShowTabRoaster = false
        }
        else {
            $scope.bShowTabChat = false
            $scope.bShowTabRoaster = true
        }
        document.getElementById('chat_tab1').checked =$scope.bShowTabChat;
        document.getElementById('chat_tab2').checked =$scope.bShowTabRoaster;
        $scope.safeApply(function() {
        });        
    }
    
    $scope.onClickToggleTab = function( item ) {
        if( $scope.bShowTab ) {
            if( item == $scope.nShowTabIndex) {
                $scope.bShowTab = false
            }
            else {
                $scope.nShowTabIndex = item
                if( item == 0 ) {
                    $scope.bShowTabChat = true
                    $scope.bShowTabRoaster = false
                }
                else {
                    $scope.bShowTabChat = false
                    $scope.bShowTabRoaster = true
                }
            }
        }
        else {
            $scope.bShowTab = true
            $scope.nShowTabIndex = item
            if( item == 0 ) {
                $scope.bShowTabChat = true
                $scope.bShowTabRoaster = false
            }
            else {
                $scope.bShowTabChat = false
                $scope.bShowTabRoaster = true
            }
        }
        document.getElementById('chat_tab1').checked =$scope.bShowTabChat;
        document.getElementById('chat_tab2').checked =$scope.bShowTabRoaster;
        $scope.safeApply(function() {
            $(function () {
                $(".perticipants-list").niceScroll({
                    scrollspeed: 400,
                    cursorborder: "1px solid #B7DBFF",
                    cursorcolor: "#B7DBFF"
                });
            })
        });        
    }
    $scope.onCloseTab = function() {
        $scope.bShowTab = false
        $scope.showTab = "max"
        $scope.safeApply(function() {
        })
    }
    $scope.showTab = "min";
    $scope.onCloseMinMax = function() {
        if( $scope.showTab == "max" ) {
            $scope.showTab = "min"
            document.getElementsByClassName("chat_tab")[0].style.height = "50px";
            document.getElementsByClassName("chat_tab_panel_area")[0].style.display = "none";
        }
        else {
            $scope.showTab = "max"
            document.getElementsByClassName("chat_tab")[0].style.height = "96.5%";
            document.getElementsByClassName("chat_tab_panel_area")[0].style.display = "";
        }
    }
    $scope.onClickShowAudioCall = function() {
        
    }
    
    $rootScope.onEnterExitInRoom = function() {
        $scope.roasters = $rootScope.cls;
        $scope.safeApply(function() {
            $(function () {
                $(".perticipants-list").niceScroll({
                    scrollspeed: 400,
                    cursorborder: "1px solid #B7DBFF",
                    cursorcolor: "#B7DBFF"
                });
            })
        });
    }

    $scope.onClickShowDocument = function() {
        $scope.bShowShareMenu = false;
        $scope.bShowWhiteboard = false;
        $scope.bShowScreen = false;
        $scope.bShowDoc = true;
        $scope.bShowScreenSelect = false;

        $scope.safeApply(function() {
        });
    }
    $scope.onClickShowShareMenu = function() {
        $scope.bShowShareMenu = true;
        $scope.bShowWhiteboard = false;
        $scope.bShowScreen = false;
        $scope.bShowDoc = false;
        $scope.bShowScreenSelect = false;
        $scope.safeApply(function() {
        });

    }

    $scope.onClickShowWiteboard = function() {
        $scope.bShowShareMenu = false;
        $scope.bShowWhiteboard = true;
        $scope.bShowScreen = false;
        $scope.bShowDoc = false;
        $scope.bShowScreenSelect = false;
        $scope.safeApply(function() {
            if( $scope.bStartWhiteboard==false ) {
                $scope.bStartWhiteboard = true;
                $scope.bMasterWhiteboard = true;
                wbStart($rootScope);
                $rootScope.sendMessage({'action':'readyToStream', type:SHARE_TYPE_WHITEBOARD})
            }
            $rootScope.streamer = {type:SHARE_TYPE_WHITEBOARD};
        });
    }
    $rootScope.onReceiveStartWiteboard = function() {
        $scope.bShowShareMenu = false;
        $scope.bShowWhiteboard = true;
        $scope.bShowScreen = false;
        $scope.bShowDoc = false;
        $scope.bShowScreenSelect = false;
        $scope.safeApply(function() {
            if( $scope.bStartWhiteboard==false ) {
                $scope.bStartWhiteboard = true
                wbStart($rootScope);
            }
        });
    }

    $rootScope.onReceiveStartScreen = function(message) {
        $scope.bShowShareMenu = false;
        $scope.bShowWhiteboard = false;

        $scope.bShowScreen = true;
        $scope.bStartScreen = true;
        $scope.bMastertScreen = false;

        $scope.bShowDoc = false;
        $scope.bShowScreenSelect = false;
        $scope.safeApply(function() {
            log.info('WEBRTC: remotePlaying true');
            $rootScope.sendMessage({
                'action': 'sendMeOffer',
                'to': message.data
            });
        });
    }
    $rootScope.onReceiveStopScreen=function(id)
    {
        if($rootScope.remotePlaying)
        {
            $rootScope.safeParam('remotePlaying',false);

            function checkFulScreen() {

                if (document.fullscreen||document.webkitIsFullScreen||document.mozFullScreen) {
                    console.log('addEventListener fullscreen');

                    document.addEventListener('webkitfullscreenchange', checkFulScreen, false);
                    document.addEventListener('mozfullscreenchange', checkFulScreen, false);
                    document.addEventListener('fullscreenchange', checkFulScreen, false);
                    if($rootScope.isWeb)
                    {
                        window.alert('Streaming has been stopped.');

                    }
                    else
                    {
                        dialog.showMessageBox({type:'info',message:'Streaming has been stopped. Please, exit full screen mode'})
                    }
                }
                else {
                    console.log('no fullscreen');
                    document.removeEventListener('webkitfullscreenchange', checkFulScreen);
                    document.removeEventListener('mozfullscreenchange', checkFulScreen);
                    document.removeEventListener('fullscreenchange', checkFulScreen);
                    $rootScope.safeParam('stream',null);
                    document.getElementById('streamVideo').srcObject=null;

                }
            }
            checkFulScreen();

            $scope.bShowShareMenu = true;
            $scope.bShowWhiteboard = false;
            $scope.bShowScreen = false;
            $scope.bShowDoc = false;
            $scope.bShowScreenSelect = false;

            $scope.bMastertScreen = false;
            $scope.bStartScreen = false;


        }

        if(id&&$rootScope.connections[id])
        {
            $rootScope.connections[id].close();
            $rootScope.connections[id]=null;
        }

    };

    $scope.onClickShowScreen = function() {
        $scope.bShowShareMenu = false;
        $scope.bShowWhiteboard = false;
        $scope.bShowScreen = false;
        $scope.bShowDoc = false;
        $scope.bShowScreenSelect = false;

        if( $scope.bStartScreen == false ) {
            $scope.onSelectScreen();
        }
        else {
            $scope.bShowScreen = true;
        }
    }
    $scope.onSelectScreen = function() {
        if($rootScope.isWeb)
        {
            if($rootScope.localPlaying) {
            }
            else
            {
                window.getCaptureSourceId(function(sourceId) {
                    if(!$rootScope.remotePlaying)
                    {
                        log.log('getCaptureSourceId',sourceId);
                        var constraints=getConstraints();
                        constraints.video.mandatory.chromeMediaSourceId=sourceId;
                        navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia ;
                        navigator.getUserMedia(constraints,function(stream) {
                            stream.getVideoTracks()[0].onended = function () {
                                $scope.bShowShareMenu = true;
                                $scope.bShowWhiteboard = false;
                                $scope.bShowScreen = false;
                                $scope.bShowDoc = false;
                                $scope.bShowScreenSelect = false;

                                $scope.bMastertScreen = false;
                                $scope.bStartScreen = false;
    
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
                                $scope.safeApply(function() {
                                });
                            };
                            $scope.bShowScreen = true;
                            $scope.bMastertScreen = true;
                            $scope.bStartScreen = true;

                            $rootScope.safeApply(()=>{
                                $rootScope.stream = stream;
                                log.info('set local stream');
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
                                $rootScope.sendMessage({'action':'readyToStream', type:SHARE_TYPE_SCREEN})
                                $rootScope.streamer_screen = {type:SHARE_TYPE_SCREEN};
                            });

                        },function(error) {
                            log.log('getUserMedia',error);
                        })
                    }
                    else
                    {
                        log.log('getCaptureSourceId','already remotePlaying');

                    }
                },function(event) {
                    log.log('getSourceIdError',event);
                });
            }
        }
    }
    //--------------------------------------------------------------//
    //--------------------------------------------------------------//
    //--------------------------------------------------------------//
    $rootScope.wbSync=[];
    $rootScope.syncQueue=[];
    $rootScope.syncWhiteboard=function(data) {
        $rootScope.sendMessage({
            action: 'wbSync',
            sync: data
        });

        if(!!data.clear)
            $rootScope.wbSync=[];
        else
            $rootScope.wbSync.push({action: 'wbSync',sync: data});
    };

    $rootScope.onExitWhiteboard=function() {
        $rootScope.wbSync=[];
        $rootScope.streamer=null;
        // wbExit();

        $scope.bShowShareMenu = true;
        $scope.bShowWhiteboard = false;
        $scope.bShowScreen = false;
        $scope.bShowDoc = false;
        $scope.bStartWhiteboard = false
        $scope.bMasterWhiteboard = false;
        $scope.bShowScreenSelect = false;

        $rootScope.sendMessage({
            'action': 'stopStreaming', type:SHARE_TYPE_WHITEBOARD
        });

        $scope.safeApply(function() {
        });
    };
    $rootScope.onStopWhiteboard=function(message) {
        $rootScope.wbSync=[];
        $rootScope.streamer=null;
        // wbExit();

        $scope.bShowShareMenu = true;
        $scope.bShowWhiteboard = false;
        $scope.bShowScreen = false;
        $scope.bShowDoc = false;
        $scope.bStartWhiteboard = false
        $scope.bShowScreenSelect = false;

        $scope.safeApply(function() {
        });

    }

    let message = { action:'join_team',from:$rootScope.loginName };
    $rootScope.sendMessage(message);
}]);