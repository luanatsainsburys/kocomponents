define(["jquery", "knockout", "text!App/kocomponents/objectiveSetListFy.html", "common"], function ($, ko, htmlTemplate, common) {
    "use strict";

    var getByFinancialYear = function (osArray, fy) {
        return ko.utils.arrayFirst(osArray, function (item) {
            return item.financialYear === fy;
        });
    };

    //Group by financial years
    var groupByFinancialYears = function (os) {
        var groups = [], foundGroup = null, i=0;

        for (i = 0; i < os.length; i++) {
            if (groups.length === 0) {
                //Add new group
                groups.push({financialYear: os[i].FinancialYear, entries: [os[i]]});
            } else {
                foundGroup = getByFinancialYear(groups, os[i].FinancialYear);
                if (foundGroup) {
                    //Add items to group
                    foundGroup.entries.push(os[i]);
                } else {
                    //Add new group
                    groups.push({ financialYear: os[i].FinancialYear, entries: [os[i]] });
                }
            }
        }

        return groups;
    };


    //View model
    function viewModel(params) {
        var vm = {};
        vm.commonService = common;

        vm.objectiveSets = params.data || ko.observableArray([]);//Observable array
        if (!ko.isObservable(vm.objectiveSets)) {
            vm.objectiveSets = ko.observableArray(vm.objectiveSets);
        }

        //First group objective sets
        vm.osGroups = groupByFinancialYears(vm.objectiveSets());
        //END - First group objective sets

        vm.onSelect = common.setHandler(params.onSelect);
        //vm.onClone = common.setHandler(params.onClone);

        //vm.details = params.details;
        vm.colleagueFullName = params.colleagueFullName;
        vm.readOnly = params.readOnly ? params.readOnly : true;
        vm.managerView = params.managerView || false;

        vm.expandedView = ko.observable(false);
        vm.expandedAll = ko.observable(false);
        vm.unsharedByManager = function (objectiveSetId) {
            vm.objectiveSets.remove(function (item) { return item.Id === objectiveSetId; });
        };

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
        //vm.clone = function (data) {
        //    vm.onClone(data.Id);
        //};

        vm.toggleView = function () {
            vm.expandedView(!vm.expandedView());//As per new objective set
        };

        return vm;
    }

    return { viewModel: viewModel, template: htmlTemplate };
});