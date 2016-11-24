define(["text!App/kocomponents/colleagueMeetings.html", "meetingService"], function (htmlTemplate, meetingService) {
    "use strict";

    function viewModel(params) {

        // params.data is an object returned from meetingService.buildColleagueMeetingsViewModel
        var self = params.data || {};

        //To provide methods used in the templates
        self.meetingService = meetingService;

        return self;
    }

    return {viewModel: viewModel, template: htmlTemplate};
});