"use strict";

angular.module("rpi3x").controller("StreamingController", ['$scope','$rootScope','$state',function($scope,$rootScope,$state) {
    document.getElementById('stopButton').focus();
    $scope.onStopClick=function()
    {
        $rootScope.closeConnections();
        $rootScope.bShowWhiteboard = false;
        $rootScope.bShowScreen = false;
        $rootScope.bShowTextChat = true;
        $state.go('screenSelect');
    }

}]);