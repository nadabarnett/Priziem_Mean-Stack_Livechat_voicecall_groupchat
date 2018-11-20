"use strict";

angular.module("rpi3x").controller("LoadingController", ['$scope','$state','$rootScope','$stateParams',function($scope,$state,$rootScope,$stateParams) {
    $scope.cancelState=$stateParams.cancelState;
    $scope.message=$stateParams.message;
    if($scope.cancelState)
    {
        document.getElementById('cancelButton').focus();
    }
    $scope.cancelClick=function()
    {
        if(!!$rootScope.cancelFunction)
        {
            $rootScope.cancelFunction();

        }

        if($scope.cancelState)
        {
            $state.go($stateParams.cancelState)
        }
    }

}]);


