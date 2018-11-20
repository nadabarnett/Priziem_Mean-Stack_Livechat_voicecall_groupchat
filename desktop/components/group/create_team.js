"use strict";
angular.module("rpi3x").controller("create-team", ['$scope','$rootScope','$state','$http','$timeout',function($scope,$rootScope,$state,$http,$timeout) {
    $scope.team_name="";
    $scope.teamerror = "";
    $scope.onCreateTeamClick=function(team_name)
    {
        if(team_name && team_name.length>0)
        {
            var idx = $rootScope.findTeam(team_name);
            if( idx != -1 ) {
                $scope.teamerror = "Team name already exsists";
                return;
            }
            $rootScope.sendMessage({action: 'create_team', name:team_name,creator:$rootScope.loginName,collab:[]});
            $rootScope.teams.push({name:team_name,creator:$rootScope.loginName,chats:[],voicePublish:false,voiceCaller:[],voiceCallee:[],collab:[]});
            var idx = $rootScope.findTeam(team_name);
            $rootScope.onClickTeam($rootScope.teams[idx]);
            $state.go('empty');
        }
    }
    //-------------------------------------------------------------//
    // Event handlers
    $scope.onTeamKeyDown = function ($event) {
        $scope.teamerror = "";
    };

}]);