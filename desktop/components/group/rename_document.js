"use strict";
angular.module("rpi3x").controller("rename-doc", ['$scope','$rootScope','$state','$http','$timeout',function($scope,$rootScope,$state,$http,$timeout) {
    $scope.doc_name=$rootScope.currentDoc;
    $scope.docerror = "";
    $scope.onRenameDocClick=function(doc_name)
    {
        if(doc_name && doc_name.length>0)
        {
            var idx = $rootScope.findDocumentName(doc_name);
            if( idx == true && doc_name != $rootScope.currentDoc ) {
                $scope.docrror = "Document name already exsists";
                return;
            }
            $rootScope.RenameDocCollabration(doc_name);
        }
    }
    //-------------------------------------------------------------//
    // Event handlers
    $scope.onDocKeyDown = function ($event) {
        $scope.docrror = "";
    };

}]);