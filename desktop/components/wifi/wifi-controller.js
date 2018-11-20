"use strict";

angular.module("rpi3x").controller("WiFiController", ['$scope','$state','$rootScope','$stateParams',function($scope,$state,$rootScope,$stateParams) {
    $scope.networks=$rootScope.networks;
    $scope.recents=$rootScope.recents;
    $scope.server_ip = netServer;
    $scope.dpmToBars=(dbm)=>
    {
        return Math.floor(dbmToPercent(dbm)/25);
    }
    $scope.clickManual = function() {
        if( $scope.server_ip == "" )
            return;
        netServer = $scope.server_ip;
        $rootScope.connectManual();
    }
    $scope.onManual = function(value) {
        log.info("onManual(): " + value);
        if( value == false ) {
            $rootScope.onScanWiFiAuto();
        }
    } 

}]);
function dbmToPercent(dBm)
{
    if(dBm <= -100)
       var quality = 0;
    else if(dBm >= -50)
        quality = 100;
    else
        quality = 2 * (dBm + 100);
    return quality;
}