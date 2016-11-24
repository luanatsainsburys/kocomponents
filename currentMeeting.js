define(["jquery", "text!App/kocomponents/currentMeeting.html", "dataService", "meetingService", "knockout"], function ($, htmlTemplate, dataService, meetingService) {
    "use strict";

    //View model
    var viewModel = function (params) {
        var self = params.data;
        self.meetingService = meetingService;
        return self;
    };

    return {
        viewModel: viewModel,
        template: htmlTemplate
    };
});