"use strict";
angular.module("rpi3x").controller("create-doc", ['$scope','$rootScope','$state','$http','$timeout',function($scope,$rootScope,$state,$http,$timeout) {
    $scope.doc_name=$rootScope.currentTeam.name + "-";
    $scope.docerror = "";
    $scope.onCreateDocClick=function(doc_name)
    {
        if(doc_name && doc_name.length>0)
        {
            var idx = $rootScope.findDocumentName(doc_name);
            if( idx == true ) {
                $scope.docrror = "Document name already exsists";
                return;
            }
            $rootScope.CreateNewDocCollabration(doc_name);
        }
    }
    //-------------------------------------------------------------//
    // Event handlers
    $scope.onDocKeyDown = function ($event) {
        $scope.docrror = "";
    };

}]);