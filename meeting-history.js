define(["jquery", "text!App/kocomponents/meeting-history.html", "underscore", "knockout"], function ($, htmlTemplate, _) {
    "use strict";

    var getYears = function (colleagueMeetings) {
        var dateList = $.map(colleagueMeetings, function (item) {
            return item.Year;
        });
        return dateList;
    };

    var normaliseData = function (colleagueMeetings) {
        //Transform a colleague's meetings date into a nested list of year/quarters/meeting links
        //for convenience use by ui
        var meetingTree = {};

        meetingTree.years = getYears(colleagueMeetings);
        meetingTree.years = _.uniq(meetingTree.years);

        var Quarter = function (name) {
            this.name = name;
            this.meetings = new Array();
        };

        //Add quarters
        var addQuarters = function (item) {
            return {
                year: item,
                //quarters: ["Q1", "Q2", "Q3", "Q4"]
                quarters: [new Quarter("Q1"), new Quarter("Q2"), new Quarter("Q3"), new Quarter("Q4")]
            };
        };

        meetingTree.years = $.map(meetingTree.years, addQuarters);

        //Add meeting links
        //Sample link to view meeting "http://localhost/JsPlc.Ssc.Link.Portal/LinkForm/ViewMeeting/2"
    };

    //View model
    var viewModel = function (params) {
        var self = this;
        normaliseData(params.data.Meetings);

        return self;
    };

    return {
        viewModel: viewModel,
        template: htmlTemplate
    };
});