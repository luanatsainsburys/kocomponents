define(["jquery", "knockout", "text!App/kocomponents/objectivesManagerView.html", "dataService", "toastr"], function ($, ko, htmlTemplate, dataService, toastr) {
    "use strict";

    //View model
    var viewModel = function (params) {
        var vm = {};
        vm.colleague = params.colleague;
        vm.selectedOne = ko.observable(); //The currently selected set of objectives
        vm.objectiveSets = ko.observableArray([]); //The list of all objective sets for the colleague


        vm.getAllObjectiveSets = function (colleagueId) {
            var $promise = dataService.getAllObjectiveSets(colleagueId);

            $promise.done(function (result) {
                if (result.success) {
                    vm.objectiveSets(result.data);
                } else {
                    toastr.error(result.message);
                }
            });
        };

        //When an objected set in the list is selected
        vm.onSelect = function (objectiveSetId) {
            var $promise = dataService.getObjectiveSet(objectiveSetId);

            $promise.done(function (result) {
                if (result.success) {
                    vm.selectedOne(result.data);
                } else {
                    toastr.error(result.message);
                }
            });
        };

        //Get the data to display
        vm.getAllObjectiveSets(vm.colleague.ColleagueId);

        return vm;
    };

    return { viewModel: viewModel, template: htmlTemplate };
});