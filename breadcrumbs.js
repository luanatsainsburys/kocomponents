define(["jquery", "knockout", "text!App/kocomponents/breadcrumbs.html", "RegisterKoComponents"], function ($, ko, htmlTemplate) {
    "use strict";

    var oneLink = {};
    oneLink.title = "HOME";
    oneLink.url = "/";

    var testData = Array();
    testData.push(oneLink);
    testData.push(oneLink);
    testData.push(oneLink);
    testData.push(oneLink);
    testData.push(oneLink);
    testData.push(oneLink);

    //View model
    var breadcrumbsModel = function (params) {
        var self = {};
        //self.data = testData;
        self.data = params.data;

        return self;
    };

    var viewModel = {
        createViewModel: function (params, componentInfo) {
            var vm = breadcrumbsModel(params);

            //$(componentInfo.element).on('show', function (event, tabNo) {
            //    $("#showTab" + tabNo).trigger("click");
            //});

            return vm;
        }
    };

    return { viewModel: viewModel, template: htmlTemplate };
});