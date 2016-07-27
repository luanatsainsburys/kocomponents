//This module manages the "ObjectiveSet/Index" view.
define(["text!App/kocomponents/objectivesUserView.html", "jquery", "knockout", "common", "moment", "toastr", "dataService", "featureContainerService", "RegisterKoComponents"], function (htmlTemplate, $, ko, common, moment, toastr, dataService, ftc) {
    "use strict";

    var networkError = function (jqXHR, exception) {
        toastr.error(common.getAjaxError(jqXHR, exception));
        ftc.refreshContent("objFeatureContainer", {}, '<div class="linkBox3 linkPadding"><p class="grey-color margin-0">Unfortunately we are unable to retrieve the objective sets at the moment.</p></div>');
    };

    //View model
    var objectivesUserViewVm = function (params) {
        var vm = {};
        vm.requestCurrentObjectivesViewToSave = false;

        vm.currentViewId = common.makeNextTagId(); //Element tag id
        vm.historicalViewId = common.makeNextTagId(); //Element tag id

        //PROPERTIES
        vm.currentView = ko.observable("latest");
        vm.currentView.subscribe(function (newValue) {
            var colleagueId = vm.ownerColleague.ColleagueId;
            if (newValue === "historical") {
                //Check if the existing view has data to save
                vm.requestCurrentObjectivesViewToSave = true;
                $("#" + vm.currentViewId).trigger("canYouGo");
                //Show historical view
                //vm.showHistoricalObjectiveSets(colleagueId);
            } else {
                //show latest view
                vm.showLatestObjectiveSet(colleagueId);
            }
        });

        vm.canYouGoEventReply = function (eventReply) {
            //Did we ask for it
            if (vm.requestCurrentObjectivesViewToSave) {
                if (eventReply.eventName == "canYouGo") {
                    if (eventReply.success) {
                        //Show historical view
                        vm.showHistoricalObjectiveSets(vm.ownerColleague.ColleagueId);
                    }
                }

                vm.requestCurrentObjectivesViewToSave = false; //Done
            }
        };

        //vm.noActiveSet = ko.observable(false);
        vm.noActiveSet = params.noActiveSet || ko.observable(false);
        vm.managerView = params.managerView || false;
        vm.readOnly = params.readOnly || false;
        if (vm.managerView) {
            vm.readOnly = true;
        }

        //Defaults to logged in user if not specified
        vm.ownerColleague = params.ownerColleague || common.getUserInfo().colleague;

        vm.printMode = ko.observable(false);

        //BEHAVIOUR
        vm.makeObjectiveSet = function (colleagueId, managerId) {
            var dateNow = moment().utc();
            var newObj = {
                Id: 0,
                //ColleagueId: common.getUserInfo().colleagueId,
                //ManagerId: common.getUserInfo().managerId,//Required
                ColleagueId: colleagueId,
                ManagerId: managerId,//Required
                Title: "My objectives " + moment.months()[dateNow.month()] + " 16/17",
                //Title: "My objectives " + moment.months()[dateNow.month()] + " " + dateNow.year(),
                //Title: "My objectives " + moment.months()[moment().month()] + " " + moment().year(),
                CreatedDate: new Date(), // will be overwritten on server side with UTC date
                UpdatedDate: new Date(), // will be overwritten on server side with UTC date
                SharedDate: null, // will be overwritten on server side with UTC date
                AgreedDate: null, // will be overwritten on server side with UTC date
                DeletedDate: null, // will be overwritten on server side with UTC date
                Objectives: []
            };

            return newObj;
        };

        //Non manager action only
        vm.showNewObjectiveSet = function () {
            var viewModel = {};
            viewModel.data = vm.makeObjectiveSet(vm.ownerColleague.ColleagueId, vm.ownerColleague.ManagerId);
            viewModel.ownerColleague = vm.ownerColleague;
            viewModel.onEventReply = vm.canYouGoEventReply;

            ftc.refreshContent("objFeatureContainer", viewModel, "<objective-set id='" + vm.currentViewId + "' params='onEventReply: $root.onEventReply, ownerColleague: $root.ownerColleague, data: $root.data, readOnly: false'></objective-set>");
        };

        vm.newObjectiveSet = function (data, event) {
            vm.noActiveSet(false);
            vm.showNewObjectiveSet();
        };

        vm.activeSetFound = function () {
            vm.noActiveSet(false);
        };

        vm.noActiveSetFound = function () {
            vm.noActiveSet(true);
        };

        //Action to take when user select an objective set from the historical list
        vm.objectiveSetSelected = function (objectiveSetId) {
            var $promise = dataService.getObjectiveSet(objectiveSetId);

            $promise.done(function (result) {
                if (result.success) {
                    var objectiveSetData = {};
                    objectiveSetData.data = result.data;
                    objectiveSetData.onClose = vm.closeObjectiveSet;
                    objectiveSetData.managerView = vm.managerView;
                    objectiveSetData.ownerColleague = vm.ownerColleague;
                    ftc.refreshContent("objFeatureContainer", objectiveSetData, "<objective-set params='ownerColleague: $root.ownerColleague, data: $root.data, closeable: true, onClose: $root.onClose, managerView: $root.managerView'></objective-set>");
                } else {
                    toastr.error(result.message);
                }
            });
        };

        //Owner user action.User can create a new set of objectives by cloning the last agreed set.
        vm.cloneObjectiveSet = function (objectiveSetId) {
            var $promise = dataService.cloneObjectiveSet(objectiveSetId);

            $promise.done(function (result) {
                if (result.success) {
                    vm.noActiveSet(false);//We now have a new active set
                    var objectiveSetData = {};
                    objectiveSetData.data = result.data;
                    objectiveSetData.ownerColleague = vm.ownerColleague;
                    objectiveSetData.onEventReply = vm.canYouGoEventReply;
                    ftc.refreshContent("objFeatureContainer", objectiveSetData, "<objective-set params='onEventReply: $root.onEventReply, ownerColleague: $root.ownerColleague, data: $root.data'></objective-set>");
                } else {
                    toastr.error(result.message);
                }
            });

            $promise.fail(networkError);
        };

        vm.showHistoricalObjectiveSets = function (colleagueId) {
            var $promise = dataService.getAllObjectiveSets(colleagueId);

            $promise.done(function (result) {
                var message = "";
                if (result.success) {
                    var objectiveSetListData = result.data;
                    objectiveSetListData.onSelect = vm.objectiveSetSelected;

                    if (objectiveSetListData.length > 1) {
                        //Skip the latest one
                        objectiveSetListData.shift();
                        ftc.refreshContent("objFeatureContainer", objectiveSetListData, "<objective-set-list params='data: $root, onSelect: $root.onSelect, readOnly: false'></objective-set-list>");
                    } else {
                        //Display friendly message
                        if (vm.managerView) {
                            message = vm.ownerColleague.FirstName + " currently have no previous objectives to share with you";
                        } else {
                            message = "You currently have no previous objectives.";
                        }

                        ftc.refreshContent("objFeatureContainer", {}, '<div class="linkBox3 linkPadding"><p class="grey-color margin-0">' + message + '</p></div>');
                    }

                } else {
                    toastr.error(result.message);
                    ftc.refreshContent("objFeatureContainer", {}, '<div class="linkBox3 linkPadding"><p class="grey-color margin-0">' + result.message + '</p></div>');
                }
            });
        };

        vm.closeObjectiveSet = function () {
            //Just show the historical list again
            //var colleagueId = common.getUserInfo().colleague.ColleagueId;
            vm.showHistoricalObjectiveSets(vm.ownerColleague.ColleagueId);
        };

        vm.showLatestObjectiveSet = function (colleagueId) {
            var message = "";
            //For managers, only shared ones are accessible
            var $promise = !vm.managerView
                ? dataService.getLatestObjectiveSet(colleagueId)
                : dataService.getSharedOrLatestObjectiveSet(colleagueId);

            $promise.done(function (result) {

                if (result.success) {
                    if (!result.data) {
                        //User has no objective set
                        vm.noActiveSet(true);
                        if (vm.managerView) {
                            message = vm.ownerColleague.FirstName + " has not shared their objectives with you yet.<br/>"
                                        + "Please speak to " + vm.ownerColleague.FirstName + " to ensure they are drafting their personal objectives, reflecting on their role and how they will support their team / store / region to achieve its goals";
                        } else {
                            message = "You have not created objectives yet. Please select the 'New objective set' button to add them.";
                        }

                        ftc.refreshContent("objFeatureContainer", {}, '<div class="linkBox3 linkPadding"><p class="grey-color margin-0">'
                            + message
                            + "</p></div>");
                        return;
                    }

                    var objectiveSetData = result.data;
                    var latestSetVm = {};

                    vm.noActiveSet(objectiveSetData.AgreedDate ? true : false);

                    if (vm.noActiveSet()) {
                        latestSetVm.data = result.data;
                        latestSetVm.onClone = vm.cloneObjectiveSet;
                        latestSetVm.managerView = vm.managerView;
                        latestSetVm.ownerColleague = vm.ownerColleague;

                        ftc.refreshContent("objFeatureContainer", latestSetVm, "<objective-set id='" + vm.currentViewId + "' params='ownerColleague: $root.ownerColleague, data: $root.data, readOnly: true, managerView: $root.managerView, cloneable: !$root.managerView, onClone: $root.onClone'></objective-set>");
                    } else {
                        //Active set of objectives
                        latestSetVm.data = result.data;
                        latestSetVm.managerView = vm.managerView;
                        latestSetVm.ownerColleague = vm.ownerColleague;
                        latestSetVm.refreshTab = function () { vm.showLatestObjectiveSet(colleagueId) };
                        latestSetVm.onEventReply = vm.canYouGoEventReply;

                        ftc.refreshContent("objFeatureContainer", latestSetVm, "<objective-set id='" + vm.currentViewId + "' params='onEventReply: $root.onEventReply, onAgree: $root.refreshTab, onDisagree: $root.refreshTab, ownerColleague: $root.ownerColleague, data: $root.data, managerView: $root.managerView, readOnly: !$root.managerView'></objective-set>");
                    }
                } else {
                    toastr.error(result.message);
                    ftc.refreshContent("objFeatureContainer", {}, '<div class="linkBox3 linkPadding"><p class="grey-color margin-0">' + result.message + '</p></div>');
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
            //var colleague = common.getUserInfo().colleague;
            vm.showLatestObjectiveSet(vm.ownerColleague.ColleagueId);

            return vm;
        }
    };
    return { viewModel: viewModel, template: htmlTemplate };
});