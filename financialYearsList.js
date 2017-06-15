define(["jquery", "knockout", "text!App/kocomponents/financialYearsList.html", "common"], function ($, ko, htmlTemplate, common) {
    "use strict";

    var testData = [{ Name: "2010/2011" }, { Name: "2011/2012" }, { Name: "2012/2013" }, { Name: "2013/2014" }, { Name: "2014/2015" }, { Name: "2015/2016" }, ];

    //View model
    function viewModel(params) {
        var vm = {};
        vm.commonService = common;

        //TODDO!!!Remove later
        params.data = testData;
        //END TODDO!!!Remove later

        vm.financialYears = params.data || ko.observableArray([]);//Observable array
        if (!ko.isObservable(vm.financialYears)) {
            vm.financialYears = ko.observableArray(vm.financialYears);
        }

        vm.onSelect = common.setHandler(params.onSelect);
        vm.onClone = common.setHandler(params.onClone);
        vm.expandedView = ko.observable(false);

        //vm.details = params.details;
        //vm.colleagueFullName = params.colleagueFullName;
        vm.readOnly = params.readOnly ? params.readOnly : true;
        vm.managerView = params.managerView || false;

        vm.expandedAll = ko.observable(false);
        //vm.unsharedByManager = function (objectiveSetId) {
        //    vm.financialYears.remove(function (item) { return item.Id === objectiveSetId; });
        //};

        vm.expandPrintCollapseAll = function () {
            vm.expandedAll(true);
            window.print();
            vm.expandedAll(false);
        };

        //Display the objective set selected
        vm.show = function (data) {
            vm.onSelect(data.Id);
        };

        //Create a new "active" objective set by cloning an existing one.
        //This is possible only when there is no current active objective set
        vm.clone = function (data) {
            vm.onClone(data.Id);
        };

        vm.toggleView = function () {
            vm.expandedView(!vm.expandedView());
        };

        return vm;
    }

    return { viewModel: viewModel, template: htmlTemplate };
});