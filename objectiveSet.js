define(["jquery", "knockout", "komap", "text!App/kocomponents/objectiveSet.html", "common", "dataService", "toastr", "moment", "confirmModal", "autogrow"],
function ($, ko, komap, htmlTemplate, common, dataService, toastr, moment, confirmModal, autogrow) {
    "use strict";

    var makeEmptyObjective = function () {
        var newObj = {
            Id: ko.observable(0),
            ObjectiveSetId: ko.observable(0),
            CreatedDate: common.jsonDateToString(new Date()), // will be overwritten on server side with UTC date
            UpdatedDate: common.jsonDateToString(new Date()),
            DeletedDate: common.jsonDateToString(null),
            Title: ko.observable(""),//Required
            Objective: ko.observable(""),
            MeasuredBy: ko.observable(""),
            RelevantTo: ko.observable("")
        };

        return newObj;
    };

    var networkError = function (jqXHR, exception) {
        toastr.error(common.getAjaxError(jqXHR, exception));
    };

    var mapData = function (result, vm) {
        vm.Id(result.Id);
        vm.UpdatedDate(result.UpdatedDate);
        vm.CreatedDate(result.CreatedDate);
        vm.SharedDate(result.SharedDate);
        vm.AgreedDate(result.AgreedDate);
        for (var i = 0; i < result.Objectives.length; i++) {
            var serverObjective = result.Objectives[i];
            var clientObjective = vm.Objectives()[i];

            clientObjective.Id(serverObjective.Id);
            clientObjective.ObjectiveSetId(serverObjective.ObjectiveSetId);
        }

        if (!vm.Objectives()) {
            vm.Objectives([]);
        }
    }

    //View model
    function objectiveSetViewModel(params) {
        var vm = {};
        vm.commonService = common;
        vm.onEventReply = common.setHandler(params.onEventReply);
        vm.onAgree = common.setHandler(params.onAgree);
        vm.onDisagree = common.setHandler(params.onDisagree);
        vm.onClose = common.setHandler(params.onClose);
        vm.onClone = common.setHandler(params.onClone);
        vm.expandedItemIndex = ko.observable(-1);
        //Ran after this component has rendered
        vm.componentLoaded = function () {
            $('#objectiveSetTitle').autogrow({ onInitialize: true });
        };

        vm.getManagerName = function () {
            var mgrName = common.getUserInfo().managerName;
            if (vm.managerView) {
                if (common.getUserInfo().colleagueId === vm.data.ManagerId()) {
                    mgrName = "you";
                }
                else {
                    mgrName = "another manager";
                }
            } else {
                mgrName = mgrName !== "" ? mgrName : "manager";
            }
            return mgrName;
        };

        vm.getStatusMessage = function () {
            var shared = vm.data.SharedDate() ? true : false,
                approved = vm.data.AgreedDate() ? true : false,
                dateStr = "",
                mgrName = vm.getManagerName(),
                statusMsg = "";

            if (shared) {
                if (approved) {
                    dateStr = moment(vm.data.AgreedDate()).format("Do MMMM YYYY"); // dd/mm/yyyy
                    if (vm.managerView) {
                        statusMsg = "You agreed " + vm.ownerColleague.FirstName.trim() + "'s objective set on " + dateStr;
                    } else {
                        statusMsg = "Agreed by " + mgrName.trim() + " on " + dateStr;
                    }
                } else {
                    dateStr = common.formatDateMonthDYHM(vm.data.SharedDate()); // dd/mm/yyyy
                    statusMsg = vm.managerView
                        ? "If you are happy with this record, please click AGREE, this will lock the record from further editing. Alternatively, if you wish to RECOMMEND CHANGES, have a chat with " + vm.ownerColleague.FirstName.trim() + ", he/she can update the records and re-share them with you for your sign off."
                        : "Shared with " + mgrName + " on " + dateStr;
                }
            } else {
                statusMsg = "Share this objective set with " + mgrName;
            }

            return statusMsg;
        };

        vm.getSubMessage = function () {
            var shared = vm.data.SharedDate() ? true : false,
                approved = vm.data.AgreedDate() ? true : false,
                mgrName = vm.getManagerName();

            var subMessage = "";

            if (!shared) {
                subMessage = "Allow " + mgrName + " to view and agree this objective";
            } else if (shared && !approved && !vm.managerView) {
                subMessage = "Un-sharing allows you to edit your objectives. " + mgrName + " will not be able to view and agree unless the objective is shared.";
            }

            return subMessage;
        };

        if (ko.isObservable(params.data)) {
            params.data = komap.toJS(params.data);
        }
        vm.data = komap.fromJS(params.data);//params.data is JSON form of a ObjectiveSetView server object
        if (!vm.data.Objectives()) {
            vm.data.Objectives([]);
        }
        
        vm.dirtyFlag = ko.oneTimeDirtyFlag(vm.data);
        vm.ownerColleague = params.ownerColleague;

        //Ensure it's observable
        vm.readOnly = params.readOnly !== undefined ? params.readOnly : true;
        if (!ko.isObservable(vm.readOnly)) {
            vm.readOnly = ko.observable(vm.readOnly);
        }

        //Read only if shared
        vm.readOnly(vm.data.SharedDate() || vm.data.AgreedDate() ? true : false);

        vm.managerView = params.managerView !== undefined ? params.managerView : false;
        vm.closeable = params.closeable || false;
        vm.cloneable = params.cloneable || false;

        vm.statusMessage = ko.observable(vm.getStatusMessage());
        vm.subMessage = ko.observable(vm.getSubMessage());

        //BEHAVIOUR
        vm.enterNewObjective = function () {
            var newObjective = makeEmptyObjective();
            newObjective.ObjectiveSetId(vm.data.Id());
            vm.data.Objectives.unshift(newObjective);//Add to top
            vm.expandedItemIndex(0);
        };

        vm.create = function (objectiveSet, $button) {
            var $promise = dataService.createObjectiveSet(objectiveSet);

            $promise.done(function (result) {
                if (result.success) {
                    mapData(result.data, vm.data);
                    vm.dirtyFlag = ko.oneTimeDirtyFlag(vm.data);
                    if (vm.parentRequest) {
                        vm.onEventReply({ eventName: "canYouGo", success: true });
                    }
                    toastr.info("Objective set saved");
                } else {
                    if (vm.parentRequest) {
                        vm.onEventReply({ eventName: "canYouGo", success: false });
                    }
                    toastr.error(result.message);
                }
            });

            $promise.fail(function (jqXHR, exception) {
                if (vm.parentRequest) {
                    vm.onEventReply({ eventName: "canYouGo", success: false });
                }
                toastr.error(common.getAjaxError(jqXHR, exception));
            });

            $promise.always(function () {
                if ($button) {
                    $button.data('requestRunning', false);
                }
            });
        };

        vm.update = function (objectiveSet, $button) {
            var $promise = dataService.updateObjectiveSet(objectiveSet);

            $promise.done(function (result) {
                if (result.success) {
                    mapData(result.data, vm.data);
                    vm.dirtyFlag = ko.oneTimeDirtyFlag(vm.data);
                    if (vm.parentRequest) {
                        vm.onEventReply({ eventName: "canYouGo", success: true });
                    }
                    toastr.info("Objective set updated");
                } else {
                    toastr.error(result.message);
                    if (vm.parentRequest) {
                        vm.onEventReply({ eventName: "canYouGo", success: false });
                    }
                }
            });

            $promise.fail(function (jqXHR, exception) {
                if (vm.parentRequest) {
                    vm.onEventReply({ eventName: "canYouGo", success: false });
                }
                toastr.error(common.getAjaxError(jqXHR, exception));
            });

            $promise.always(function () {
                if ($button) {
                    $button.data('requestRunning', false);
                }
            });
        };

        vm.prepareDataForServer = function (koObjectiveSet) {
            var objectiveSet = komap.toJS(koObjectiveSet);

            //To prevent model error in MVC. We donot set dates on client, only display them.
            //We also need to send dates to MVC as datestrings, not javascript dates
            objectiveSet.CreatedDate = common.jsonDateToString(objectiveSet.CreatedDate);
            objectiveSet.UpdatedDate = common.jsonDateToString(objectiveSet.UpdatedDate);
            objectiveSet.SharedDate = common.jsonDateToString(objectiveSet.SharedDate);
            objectiveSet.AgreedDate = common.jsonDateToString(objectiveSet.AgreedDate);
            objectiveSet.DeletedDate = common.jsonDateToString(objectiveSet.DeletedDate);

            objectiveSet.Objectives.forEach(function (item) {
                item.CreatedDate = common.jsonDateToString(item.CreatedDate);
                item.UpdatedDate = common.jsonDateToString(item.UpdatedDate);
            });
            return objectiveSet;
        };

        //Ensure required fields are filled in
        vm.validate = function (objectiveSet) {
            var errorMessages = [];
            if (!objectiveSet.Title) {
                errorMessages.push("<br/>Objective set title is missing");
            }

            //Check mandatory title for objectives
            if (objectiveSet.Objectives) {
                var errorsFound = false;
                objectiveSet.Objectives.forEach(function ShowResults(value, index, ar) {
                    if (!errorsFound) {
                        errorsFound = !value.Title;
                    }
                });

                if (errorsFound) {
                    errorMessages.push("<br/>One or more of your objectives have missing titles");
                }
            }

            //Display errors if any
            if (errorMessages.length > 0) {
                errorMessages.unshift("Please correct the following errors:");
                toastr.warning(errorMessages, "Validation errors");
                return false;
            }

            return true;
        }

        //Save button click handler
        vm.save = function (data, event) {
            //Use a 'requestRunning' flag to handle repeated button click.
            var $saveButton = $(event.target);
            if ($saveButton.data('requestRunning')) {
                return;
            }

            var objectiveSet = vm.prepareDataForServer(data.data);

            if (!vm.validate(objectiveSet)) {
                return;
            }

            $saveButton.data('requestRunning', true);

            if (objectiveSet.Id !== 0) {
                vm.update(objectiveSet, $saveButton);

            } else {
                vm.create(objectiveSet, $saveButton);
            }
        };

        //Save action prompted by component's parent
        vm.promptedSave = function (koObjectiveSetData) {
            var objectiveSet = vm.prepareDataForServer(koObjectiveSetData);

            if (!vm.validate(objectiveSet)) {
                return;
            }

            if (objectiveSet.Id !== 0) {
                vm.update(objectiveSet, null);

            } else {
                vm.create(objectiveSet, null);
            }
        };

        vm.share = function () {
            var $promise = dataService.shareActiveObjectiveSet();

            $promise.done(function (result) {
                if (result.success) {
                    //Update fields changed by server
                    vm.readOnly(true);
                    vm.data.UpdatedDate(result.data.UpdatedDate);
                    vm.data.SharedDate(result.data.SharedDate);
                    vm.dirtyFlag = ko.oneTimeDirtyFlag(vm.data);

                } else {
                    toastr.error(result.message);
                }
                vm.statusMessage(vm.getStatusMessage());
                vm.subMessage(vm.getSubMessage());
            });

            $promise.fail(networkError);
        };

        vm.updateAndShare = function (data, event) {
            var objectiveSet = vm.prepareDataForServer(data.data);

            var $promise = dataService.updateObjectiveSet(objectiveSet);

            $promise.done(function (result) {
                if (result.success) {
                    mapData(result.data, vm.data);
                    
                    vm.share();
                } else {
                    toastr.error(result.message);
                }
            });

            $promise.fail(networkError);
        };

        vm.unshare = function () {
            var $promise = dataService.unshareActiveObjectiveSet();

            $promise.done(function (result) {
                if (result.success) {
                    var alreadyDirty = vm.dirtyFlag();
                    //Update fields changed by server
                    vm.readOnly(false);
                    vm.data.UpdatedDate(result.data.UpdatedDate);
                    vm.data.SharedDate(null);

                    if (!alreadyDirty) {
                        //Data was not modified before we unshare
                        vm.dirtyFlag = ko.oneTimeDirtyFlag(vm.data);
                    }

                } else {
                    toastr.error(result.message);
                }
                vm.statusMessage(vm.getStatusMessage());
                vm.subMessage(vm.getSubMessage());
            });

            $promise.fail(networkError);
        };

        vm.confirmShare = function (data, event) {
            var yesHandler = function () {
                vm.updateAndShare(data, event);
            };

            var dialogOptions = {
                titleText: "Share your set of objectives?",
                bodyText: "Are you sure you want to share this set of objectives with your manager?",
                yesHandler: yesHandler,
                showCloseButton: false
            };

            confirmModal.init(dialogOptions);

            confirmModal.show();
        };

        vm.confirmUnshare = function (data, event) {
            var dialogOptions = {
                titleText: "Un-Share your set of objectives?",
                bodyText: "Are you sure you want to un-share this set of objectives with your manager?",
                yesHandler: vm.unshare,
                showCloseButton: false
            };

            confirmModal.init(dialogOptions);

            confirmModal.show();
        };

        vm.toggleShare = function (data, event) {
            var objectiveSet = komap.toJS(data.data);
            if (objectiveSet.SharedDate) {
                vm.confirmUnshare();
            } else {
                vm.confirmShare(data, event);
            }
        };

        //Manager action
        vm.agree = function () {
            var $promise = dataService.agreeActiveObjectiveSet(vm.ownerColleague.ColleagueId);

            $promise.done(function (result) {
                if (result.success) {
                    var alreadyDirty = vm.dirtyFlag();
                    vm.data.UpdatedDate(result.data.UpdatedDate);
                    vm.data.AgreedDate(result.data.AgreedDate);
                    if (!alreadyDirty) {
                        //Data was not modified before we unshare
                        vm.dirtyFlag = ko.oneTimeDirtyFlag(vm.data);
                    }
                    vm.onAgree();
                } else {
                    toastr.error(result.message);
                }
                vm.statusMessage(vm.getStatusMessage());
                vm.subMessage(vm.getSubMessage());
            });

            $promise.fail(networkError);
        };

        //Manager action
        vm.disagree = function () {
            var $promise = dataService.disagreeActiveObjectiveSet(vm.ownerColleague.ColleagueId);

            $promise.done(function (result) {
                if (result.success) {
                    var alreadyDirty = vm.dirtyFlag();
                    vm.data.UpdatedDate(result.data.UpdatedDate);
                    vm.data.AgreedDate(null);
                    if (!alreadyDirty) {
                        //Data was not modified before we unshare
                        vm.dirtyFlag = ko.oneTimeDirtyFlag(vm.data);
                    }
                    vm.onDisagree();
                } else {
                    toastr.error(result.message);
                }
                vm.statusMessage(vm.getStatusMessage());
                vm.subMessage(vm.getSubMessage());
            });

            $promise.fail(networkError);
        };

        vm.confirmAgree = function (data, event) {

            var dialogOptions = {
                titleText: "Agree objective set?",
                bodyText: "Are you sure you want to agree this set of objectives? If so this record will be locked and no further edits will be possible.",
                yesHandler: vm.agree,
                showCloseButton: false
            };

            confirmModal.init(dialogOptions);

            confirmModal.show();
        };

        vm.confirmDisagree = function (data, event) {

            var dialogOptions = {
                titleText: "Disagree objective set?",
                bodyText: "Are you sure you want to disagree this set of objectives? If so, please share your recommended changes with " + vm.ownerColleague.FirstName.trim(),
                yesHandler: vm.disagree,
                showCloseButton: false
            };

            confirmModal.init(dialogOptions);

            confirmModal.show();
        };

        //Tell parant we want to be closed
        vm.close = function () {
            vm.onClose();
        };

        //Tell parent user wants to clone you
        vm.clone = function (data) {
            vm.onClone(data.data.Id());
        };

        vm.confirmClone = function (data, event) {
            var yesHandler = function () {
                vm.clone(data);
            };

            var dialogOptions = {
                titleText: "Clone your set of objectives?",
                bodyText: "Are you sure you want to create your new objectives by cloning this set of objectives?",
                yesHandler: yesHandler,
                showCloseButton: false
            };

            confirmModal.init(dialogOptions);

            confirmModal.show();
        };

        vm.expandedAll = ko.observable(false);

        //Printing
        vm.printObjectiveSet = function () {
            toastr.remove();
            vm.expandedAll(true);
            window.print();
            vm.expandedAll(false);
        };

        vm.confirmPromptedSave = function () {
            var dialogOptions = {};

            var noHandler = function () {
                vm.onEventReply({ eventName: "canYouGo", success: true });
                vm.parentRequest = null;
            };

            var yesHandler = function () {
                vm.promptedSave(vm.data);
            };

            var yesHandler = $.noop;

            dialogOptions = {
                titleText: "Objectives",
                bodyText: "You have modified your current objectives. Would you like to save them before viewing your previous objectives?",
                yesHandler: yesHandler,
                noHandler: noHandler
            };

            confirmModal.init(dialogOptions);

            confirmModal.show();
        };//confirmSave

        //'canYouGo' event handler
        vm.canYouGoHandler = function () {
            vm.parentRequest = { eventName: "canYouGo", success: false };
            if (vm.dirtyFlag()) {
                vm.confirmPromptedSave();
            } else {
                vm.onEventReply({eventName: "canYouGo", success: true});
            }
        };


        //Save data before leaving
        vm.leavingPage = function () {
            $(window).off('beforeunload');

            if (vm.dirtyFlag()) {
                return "Data has been modified";
            }
        };

        $(window).on('beforeunload', vm.leavingPage);

        return vm;
    }

    var viewModel = {
        createViewModel: function (params, componentInfo) {
            var vm = objectiveSetViewModel(params);

            $(componentInfo.element).on('canYouGo', function (event) {
                vm.canYouGoHandler();
            });

            return vm;
        }
    };

    return { viewModel: viewModel, template: htmlTemplate };
});