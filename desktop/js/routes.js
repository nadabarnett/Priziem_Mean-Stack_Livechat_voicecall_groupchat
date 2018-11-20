"use strict";

angular.module("rpi3x").config(["$stateProvider", "$urlRouterProvider", function($stateProvider, $urlRouterProvider){
    // return
    // $urlRouterProvider.otherwise("/loading//Connecting");

    $stateProvider.state("main", {
        url: "/main",
        templateUrl: "components/main/main.html",
        title: "",
        controller: "MainController",
        controllerAs: "main"
    }).state("login", {
        url: "/login",
        templateUrl: "components/login/login.html",
        title: "Profile|My Profile",
        controller: "LoginController",
        controllerAs: "login"
    }).state("streaming", {
        url: "/streaming",
        templateUrl: "components/streaming/streaming.html",
        title: "Streaming|Streaming",
        controller: "StreamingController",
        controllerAs: "streaming"
    }).state("sharing", {
        url: "/sharing",
        title: "Content|",
        controllerAs: "sharing"
    }).state("screenSelect", {
        url: "/screenSelect",
        templateUrl: "components/screenSelect/screenSelect.html",
        title: "Content Sharing|Pick desktop or app to stream",
        controller: "ScreenSelectController",
        controllerAs: "screenSelect"
    }).state("loading", {
        url: "/loading/:cancelState/:message",
        templateUrl: "components/loading/loading.html",
        title: "Loading|",
        controller: "LoadingController",
        controllerAs: "screenSelect"
    }).state("wifi", {
        url: "/wifi",
        templateUrl: "components/wifi/wifi.html",
        title: "Pairing|Connect to a device",
        controller: "WiFiController",
        controllerAs: "wifi"
    }).state("users", {
        url: "/users",
        templateUrl: "components/users/users.html",
        title: "Roster|Roster",
        controller: "UsersController",
        controllerAs: "users"
    }).state("create_team", {
        url: "/team",
        templateUrl: "components/group/create_team.html",
        title: "team|Create a team",
        controller: "create-team",
        controllerAs: "team"
    }).state("create_doc", {
        url: "/doc",
        templateUrl: "components/group/create_document.html",
        title: "Document|Create a Document",
        controller: "create-doc",
        controllerAs: "doc"
    }).state("rename_doc", {
        url: "/renamedoc",
        templateUrl: "components/group/rename_document.html",
        title: "Document|Rename a Document",
        controller: "rename-doc",
        controllerAs: "renamedoc"
    }).state("empty", {
        url: "/empty",
        title: "",
        controllerAs: "empty"
    });



}]).directive('title', ['$rootScope', '$timeout','$transitions',
    function($rootScope, $timeout,$transitions) {
        return {
            link: function() {

                var listener = function($transition) {

                    $timeout(function() {
                        var toState=$transition.$to();
                        if(toState.title && toState.title!='')
                        {
                            $rootScope.title = toState.title.split('|')[0];
                            if(toState.title.split('|').length>1)
                            {
                                $rootScope.innerTitle = toState.title.split('|')[1];
                            }
                        }
                        else if( $rootScope.isGroup)
                            $rootScope.title = 'Teams';
                        if(toState.name && toState.title!='loading')
                        {
                            $rootScope.stateName = toState.name;
                        }
                    });
                };

                $transitions.onSuccess({}, listener);
            }
        };
    }
]);