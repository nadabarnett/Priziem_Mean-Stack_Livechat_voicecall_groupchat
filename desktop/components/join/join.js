"use strict";
angular.module("rpi3x").controller("join", ['$scope','$rootScope',function($scope,$rootScope) {
    $scope.bShowCreatePublicTeam = false
    $scope.bShowCreatePrivateTeam = false
    $scope.teamerror = ""
    $scope.team_name = ""

    $scope.onload = function() {
        $(function () {
            $(".team-catagory").niceScroll({
                scrollspeed: 400,
                cursorborder: "1px solid #B7DBFF",
                cursorcolor: "#B7DBFF"
            });
        });
    }

    $scope.enterPublicRoom = function(team) {
        $rootScope.currentRoomState = "public";

        $rootScope.enteredPrivateRoom = {};
        $rootScope.enteredPublicRoom = team;
        $rootScope.currentTeam = team;

        // let message = { action:'join_team',from:$rootScope.loginName };
        // $rootScope.sendMessage(message);

        window.location.href = "#!room";
    }

    $scope.enterPrivateRoom = function(team) {
        $rootScope.currentRoomState = "private";

        $rootScope.enteredPublicRoom = {};
        $rootScope.enteredPrivateRoom = team;
        $rootScope.currentTeam = team;

        // let message = { action:'join_team',from:$rootScope.loginName };
        // $rootScope.sendMessage(message);

        window.location.href = "#!room";
    }

    $scope.getPublicTeams = function() {
        return $rootScope.public_teams.length?$rootScope.public_teams.length:"";
    }

    $scope.getPrivateTeams = function() {
        return $rootScope.private_teams.length?$rootScope.private_teams.length:"";
    }

    $scope.onShowCreatePublic = function() {
        $scope.bShowCreatePublicTeam = true
        $scope.bShowCreatePrivateTeam = false
        $scope.safeApply(function() {
        });
    }
    $scope.onClosePublicTeam = function() {
        $scope.bShowCreatePublicTeam = false
        $scope.safeApply(function() {
        });
    }


    $scope.onCreatePublicTeam = function(team_name) {
        if( team_name && team_name.length > 0 ) {
            var idx = $rootScope.findPublicTeam(team_name);
            if( idx != -1 ) {
                $scope.teamerror = "Public Team name already exsists";
                $scope.safeApply(function() {
                });
                    return;
            }
            $rootScope.sendMessage({action: 'create_team', public:"on",name:team_name,creator:$rootScope.loginName,collab:[]});

            $rootScope.public_teams.push({name:team_name,creator:$rootScope.loginName,chats:[],voicePublish:false,voiceCaller:[],voiceCallee:[],collab:[]});
            var idx = $rootScope.findPublicTeam(team_name);

            $scope.bShowCreatePublicTeam = false;
            $scope.safeApply(function() {
            });
        }
        else {
            $scope.teamerror = "Please input Team name";
            $scope.safeApply(function() {
            });
        }
    }
    //-------------------------------------------------------------//
    // Event handlers
    $scope.onTeamKeyDown = function ($event) {
        $scope.teamerror = "";
    };

    $scope.onShowCreatePrivate = function() {
        $scope.bShowCreatePublicTeam = false
        $scope.bShowCreatePrivateTeam = true
        $scope.safeApply(function() {
        });
    }
    $scope.onClosePrivateTeam = function() {
        $scope.bShowCreatePrivateTeam = false
        $scope.safeApply(function() {
        });
    }
    $scope.onCreatePrivateTeam = function(team_name) {
        if( team_name && team_name.length > 0 ) {
            var idx = $rootScope.findPrivateTeam(team_name);
            if( idx != -1 ) {
                $scope.teamerror = "Private Team name already exsists";
                return;
            }
            
            $rootScope.sendMessage({action: 'create_team', public:"off",name:team_name,creator:$rootScope.loginName,collab:[]});

            $rootScope.private_teams.push({name:team_name,creator:$rootScope.loginName,chats:[],voicePublish:false,voiceCaller:[],voiceCallee:[],collab:[]});
            var idx = $rootScope.findPrivateTeam(team_name);

            $scope.bShowCreatePrivateTeam = false;
            $scope.safeApply(function() {
            });
        }
    }

}]);
