(function ($) {
	"use strict";

    jQuery(document).ready(function($){

        var bodyHeight = $('body').outerHeight();

        var windowHeight = $(window).outerHeight();
        if (bodyHeight < windowHeight) {
            $('body').addClass('fullheight');
        }

        $(".team-catagory").niceScroll({
            scrollspeed: 400,
            cursorborder: "1px solid #B7DBFF",
            cursorcolor: "#B7DBFF"
        });

        $(".perticipants-list").niceScroll({
            scrollspeed: 400,
            cursorborder: "1px solid #B7DBFF",
            cursorcolor: "#B7DBFF"
        });


        $("#chat").on('click', function (e) {
            e.preventDefault();
            $('.chat').toggleClass('show');
        });
        $("#roaster").on('click', function (e) {
            e.preventDefault();
            $('.perticipants-wrap').toggleClass('show');
        });
        $(".chat .fa-minus").on('click', function (e) {
            e.preventDefault();
            $('.chat').toggleClass('minimized');
        });
        $(".chat .fa-close").on('click', function (e) {
            e.preventDefault();
            $('.chat').removeClass('show');
        });
        $(".perticipants-wrap .fa-close").on('click', function (e) {
            e.preventDefault();
            $('.perticipants-wrap').removeClass('show');
        });



        


    });


    jQuery(window).load(function(){

        
    });


}(jQuery));	