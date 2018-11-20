"use strict";

angular.module("rpi3x").controller("ScreenSelectController", ['$scope','$state','$rootScope',function($scope,$state,$rootScope) {
    $scope.screenSources=[];
    $scope.SHARE_TYPE_WHITEBOARD=SHARE_TYPE_WHITEBOARD;
    $scope.safeApply = function(fn) {
        var phase = $scope.$$phase;
        if(phase == '$apply' || phase == '$digest') {
            if(fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            $scope.$apply(fn);
        }
    };
    if($rootScope.isWeb)
    {
        var screenSources=[];
        screenSources.push({id:SHARE_TYPE_WHITEBOARD, name:'Whiteboard'});
        screenSources.push({id:SHARE_TYPE_SCREEN, name:'Screen'});

        $scope.safeApply(function()
        {
            $scope.screenSources=screenSources;


        });
    }
    else
    {
        var getScreens=()=>desktopCapturer.getSources({types: ['window', 'screen'],thumbnailSize:{width:960,height:540}}, (error, sources) => {
            if (error)
            {
                log.info(error);
            }
            else
            {
                log.info('got sources',sources);
                var screenSources=[];
                screenSources.push({id:SHARE_TYPE_WHITEBOARD, name:'Whiteboard'});
                log.info('add source',SHARE_TYPE_WHITEBOARD);
                for(var i=0;i<sources.length;i++)
                {
                    log.info('check source',sources[i].name);

                    if(sources[i].name!=$rootScope.appName) {
                        sources[i].thumb = sources[i].thumbnail.toBitmap();
                        var validScreen = false;
                        for (var n = 0; n < sources[i].thumb.length; n += 4*10) {
                            if (sources[i].thumb[n] != 0 || sources[i].thumb[n+1] != 0 || sources[i].thumb[n+2] != 0 || sources[i].thumb[n+3] != 255 ) {
                                validScreen=true;
                                break;
                            }
                        }
                        if (validScreen) {
                            screenSources.push(sources[i]);
                            log.info('add source',sources[i].name);
                        }
                        else
                        {
                            log.info('skip source',sources[i].name);
                        }
                    }
                    else
                    {
                        log.info('skip source',sources[i].name);

                    }
                }
                $scope.safeApply(function()
                {
                    $scope.screenSources=screenSources;


                });
            }
            if($state.current.name=='screenSelect')
            {
                //setTimeout(getScreens,5000);
            }


        });
        getScreens();
    }


    $scope.onCancel=function()
    {
        $state.go('main');
    };
    $scope.onSelectScreen=function(sourceId)
    {
        log.info('onSelectScreen',sourceId);
        if(sourceId==SHARE_TYPE_WHITEBOARD)
        {
            $rootScope.signalOffers(SHARE_TYPE_WHITEBOARD);

        }
        else
        {
            if($rootScope.isWeb)
            {
                if($rootScope.localPlaying)
                {

                }
                else
                {
                    $rootScope.safeParam('showSettings',false);
                    // $state.go('empty');

                    window.getCaptureSourceId(function(sourceId) {
                        if(!$rootScope.remotePlaying)
                        {
                            log.log('getCaptureSourceId',sourceId);

                            var constraints=getConstraints();
                            constraints.video.mandatory.chromeMediaSourceId=sourceId;
                            navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia ;
                            navigator.getUserMedia(constraints,function(stream) {
                                stream.getVideoTracks()[0].onended = function () {
                                    $rootScope.bShowWhiteboard = false;
                                    $rootScope.bShowScreen = false;
                                    $rootScope.bShowTextChat = true;
                                    $rootScope.maxChatLayout();
                                    $rootScope.closeConnections();
                                };
                                $rootScope.safeApply(()=>{
                                    $rootScope.stream = stream;
                                    log.info('set local stream');
                                    $rootScope.signalOffers(SHARE_TYPE_SCREEN);
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
            else {
                var constraints = getConstraints();
                constraints.video.mandatory.chromeMediaSourceId = sourceId;
                navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
                        $rootScope.safeApply(function () {
                            $rootScope.stream = stream;
                            log.info('set local stream');
                            $rootScope.signalOffers(SHARE_TYPE_SCREEN);
                        });

                    })
                    .catch(function (error) {
                        log.info(error);
                    });
            }
        }

    }

}]);


