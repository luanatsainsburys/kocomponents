//This module manages the "ObjectiveSet/Index" view.
define(["text!App/kocomponents/objectivesUserView.html", "jquery", "knockout", "common", "toastr", "dataService", "featureContainerService", "RegisterKoComponents"], function (htmlTemplate, $, ko, common, toastr, dataService, ftc) {
    "use strict";

    //List of objective sets section

    var makeObjectiveSet = function (title) {
        var newObj = {
            Id: 0,
            ColleagueId: common.getUserInfo().colleagueId,
            ManagerId: common.getUserInfo().managerId,//Required
            Title: title || "",
            CreatedDate: new Date(), // will be overwritten on server side with UTC date
            UpdatedDate: new Date(), // will be overwritten on server side with UTC date
            SharedDate: null, // will be overwritten on server side with UTC date
            AgreedDate: null, // will be overwritten on server side with UTC date
            DeletedDate: null, // will be overwritten on server side with UTC date
            Objectives: []
        };

        newObj.ColleagueId = common.getUserInfo().colleagueId;

        return newObj;
    };

    var networkError = function (jqXHR, exception) {
        toastr.error(common.getAjaxError(jqXHR, exception));
        ftc.refreshContent("featureContainer", {}, '<div class="linkBox3 linkPadding"><p class="grey-color margin-0">Unfortunately we are unable to retrieve the objective sets at the moment.</p></div>');
    };



    var showNewObjectiveSet = function () {
        var viewModel = makeObjectiveSet();

        ftc.refreshContent("featureContainer", viewModel, "<objective-set params='data: $root, readOnly: false'></objective-set>");
    };

    //End of List of objective sets section

    //View model
    var objectivesUserViewVm = function (params) {
        var vm = {};

        //PROPERTIES
        vm.currentView = ko.observable("latest");
        vm.currentView.subscribe(function (newValue) {
            var colleagueId = common.getUserInfo().colleague.ColleagueId;
            if (newValue === "historical") {
                //Show historical view
                vm.showHistoricalObjectiveSets(colleagueId);
            } else {
                //show latest view
                vm.showLatestObjectiveSet(colleagueId);
            }
        });

        //vm.noActiveSet = ko.observable(false);
        vm.noActiveSet = params.noActiveSet||ko.observable(false);
        vm.printMode = ko.observable(false);

        //BEHAVIOUR
        vm.newObjectiveSet = function (data, event) {
            vm.noActiveSet(false);
            showNewObjectiveSet();
        };

        vm.activeSetFound = function () {
            vm.noActiveSet(false);
        };

        vm.noActiveSetFound = function () {
            vm.noActiveSet(true);
        };

        vm.objectiveSetSelected = function (objectiveSetId) {
            var $promise = dataService.getObjectiveSet(objectiveSetId);

            $promise.done(function (result) {
                if (result.success) {
                    var objectiveSetData = result.data;
                    objectiveSetData.onClose = vm.closeObjectiveSet;
                    ftc.refreshContent("featureContainer", objectiveSetData, "<objective-set params='data: $root, closeable: true, onClose: $root.onClose'></objective-set>");
                } else {
                    toastr.error(result.message);
                }
            });
        };

        vm.cloneObjectiveSet = function (objectiveSetId) {
            var $promise = dataService.cloneObjectiveSet(objectiveSetId);

            $promise.done(function (result) {
                if (result.success) {
                    vm.noActiveSet(false);//We now have a new active set
                    var objectiveSetData = result.data;
                    ftc.refreshContent("featureContainer", objectiveSetData, "<objective-set params='data: $root'></objective-set>");
                } else {
                    toastr.error(result.message);
                }
            });

            $promise.fail(networkError);
        };

        vm.showListOfObjectiveSets = function (colleagueId) {
            var $promise = dataService.getAllObjectiveSets(colleagueId);

            $promise.done(function (result) {
                if (result.success) {
                    var objectiveSetListData = result.data;
                    objectiveSetListData.onSelect = vm.objectiveSetSelected;
                    //objectiveSetListData.onClone = vm.cloneObjectiveSet;

                    if (objectiveSetListData.length > 0) {
                        ftc.refreshContent("featureContainer", objectiveSetListData, "<objective-set-list params='data: $root, onSelect: $root.onSelect, readOnly: false'></objective-set-list>");
                    }

                } else {
                    toastr.error(result.message);
                    ftc.refreshContent("featureContainer", {}, '<div class="linkBox3 linkPadding"><p class="grey-color margin-0">' + result.message + '</p></div>');
                }
            });
        };

        vm.showHistoricalObjectiveSets = function (colleagueId) {
            var $promise = dataService.getAllObjectiveSets(colleagueId);

            $promise.done(function (result) {
                if (result.success) {
                    var objectiveSetListData = result.data;
                    objectiveSetListData.onSelect = vm.objectiveSetSelected;

                    if (objectiveSetListData.length > 1) {
                        //Skip the latest one
                        objectiveSetListData.shift();
                        ftc.refreshContent("featureContainer", objectiveSetListData, "<objective-set-list params='data: $root, onSelect: $root.onSelect, readOnly: false'></objective-set-list>");
                    } else {
                        //Display friendly message
                        ftc.refreshContent("featureContainer", {}, '<div class="linkBox3 linkPadding"><p class="grey-color margin-0">You currently have no historical objectives.</p></div>');
                    }

                } else {
                    toastr.error(result.message);
                    ftc.refreshContent("featureContainer", {}, '<div class="linkBox3 linkPadding"><p class="grey-color margin-0">' + result.message + '</p></div>');
                }
            });
        };

        vm.closeObjectiveSet = function () {
            //Just show the historical list again
            var colleagueId = common.getUserInfo().colleague.ColleagueId;
            vm.showHistoricalObjectiveSets(colleagueId);
        };

        vm.showLatestObjectiveSet = function (colleagueId) {
            var $promise = dataService.getLatestObjectiveSet(colleagueId);

            $promise.done(function (result) {

                if (result.success) {
                    if (!result.data) {
                        //User has no objective set
                        vm.noActiveSet(true);
                        ftc.refreshContent("featureContainer", {}, '<div class="linkBox3 linkPadding"><p class="grey-color margin-0">'
                            + "You have not created objectives yet. Please select the 'New objective set' button to add them.</p></div>");
                        return;
                    }

                    var objectiveSetData = result.data;
                    var historicVm = {};

                    vm.noActiveSet(objectiveSetData.AgreedDate ? true : false);

                    if (vm.noActiveSet()) {
                        historicVm.data = objectiveSetData;
                        historicVm.onClone = vm.cloneObjectiveSet;

                        ftc.refreshContent("featureContainer", historicVm, "<objective-set params='data: $root.data, readOnly: true, cloneable: true, onClone: $root.onClone'></objective-set>");
                    } else {
                        ftc.refreshContent("featureContainer", objectiveSetData, "<objective-set params='data: $root, readOnly: false'></objective-set>");
                    }
                } else {
                    toastr.error(result.message);
                    ftc.refreshContent("featureContainer", {}, '<div class="linkBox3 linkPadding"><p class="grey-color margin-0">' + result.message + '</p></div>');
                }
            });

            $promise.fail(networkError);
        };

        return vm;
    };

    var viewModel = {
        createViewModel: function (params, componentInfo) {
            var vm = objectivesUserViewVm(params);

            $(componentInfo.element).on('newObjectiveSet', function (event) {
                vm.newObjectiveSet();
            });

            //Is this going to work??
            var colleague = common.getUserInfo().colleague;
            vm.showLatestObjectiveSet(colleague.ColleagueId);

            return vm;
        }
    };
    return { viewModel: viewModel, template: htmlTemplate };
});