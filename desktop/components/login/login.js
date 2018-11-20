"use strict";

angular.module("rpi3x").controller("login", ['$scope','$rootScope','$http',function($scope,$rootScope,$http) {
    $scope.email = $rootScope.loginName
    $scope.usererror = ""

    $scope.onClickLogin=function(email) {
        if( email && email.length > 0) {
            var idx = $rootScope.findUser(email);
            if( idx == -1 ) {
                settings.set('username',email);
                $rootScope.loginName = email

                var hasWebCam=false,hasMic=false;
                if( navigator.mediaDevices ) {
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
                        $rootScope.sendMessage({action: 'login', login: email, hasWebCam:hasWebCam, hasMic:hasMic});
                        $rootScope.safeParam('logined',true);
                        window.location.href = "#!join";
                        return;
                    });
                }
                else {
                    $rootScope.sendMessage({action: 'login', login: email, hasWebCam:hasWebCam, hasMic:hasMic});
                    $rootScope.safeParam('logined',true);
                    window.location.href = "#!join";
                    return;
                }

            }
            $scope.usererror = "* email already exsists";
            return;
        }
        else {
            $scope.usererror = "* Please input your email";
        }

    }
    //-------------------------------------------------------------//
    // Event handlers
    $scope.onLoginKeyDown = function ($event) {
        $scope.usererror = "";
    };    
}]);