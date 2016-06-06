define(["jquery", "knockout", "komap", "moment", "toastr", "text!App/kocomponents/oneObjective.html", "dataService", "common", "confirmModal", "RegisterKoComponents"],
	function ($, ko, komap, moment, toastr, htmlTemplate, dataService, common, confirmModal) {
    "use strict";
    var getDateStr = function (jsonDate) {
    	var moDate = moment(jsonDate);
    	if (moDate.isValid()) {
            return moDate.toISOString();
        } else {
            return "";
        }
    };

    var setHandler = function (clientHandler) {
        return (typeof clientHandler === "undefined" || !$.isFunction(clientHandler))
                ? $.noop
                : clientHandler;
    };

    //Transform js dates into string forms acceptable to ASP.NET MVC controller actions
    var transformDates = function (linkObjective) {
        linkObjective.CreatedDate = getDateStr(linkObjective.CreatedDate);
        linkObjective.LastAmendedDate = getDateStr(linkObjective.LastAmendedDate);
        linkObjective.SignOffDate = getDateStr(linkObjective.SignOffDate);
        linkObjective.DateShared = getDateStr(linkObjective.DateShared);
        linkObjective.DateApproved = getDateStr(linkObjective.DateApproved);
        return linkObjective;
    };

    var oneObjectiveModel = function (params) {
        var vm = {};

        //Reference common module
        vm.commonService = common;

        vm.details = params.details;
        vm.onCreate = setHandler(params.onCreate);
        vm.onSave = setHandler(params.onSave);
        vm.onCancel = setHandler(params.onCancel);
        vm.onUnsharedByManager = setHandler(params.onUnsharedByManager);

        vm.data = komap.fromJS(params.data);//params.data is JSON form of a LinkObjective server object
        vm.readOnly = params.readOnly !== undefined ? params.readOnly : true;
        if (!ko.isObservable(vm.readOnly)) {
            vm.readOnly = ko.observable(vm.readOnly);
        }

        //Once approved or shared, it's read only.
        if (vm.data.Approved() || vm.data.SharedWithManager()) {
            vm.readOnly(true);
        }
        vm.managerView = params.managerView !== undefined ? params.managerView : false;

        //Show expanded view initially. We default to collapsed view normally.
        vm.expanded = params.expanded !== undefined ? params.expanded : false;

        //Show/hide the +/- top right view toggle control
        vm.enableViewToggle = params.enableViewToggle !== undefined ? params.enableViewToggle : true;

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
            var shared = vm.data.SharedWithManager(),
                approved = vm.data.Approved(),
                dateStr = "",
                mgrName = vm.getManagerName(),
                statusMsg = "";

            if (shared) {
                if (approved) {
                    dateStr = moment(vm.data.DateApproved()).format("Do MMMM YYYY"); // dd/mm/yyyy
                    if (vm.managerView) {
                    	statusMsg = "You agreed " + vm.details.ColleagueFirstName.trim() + "'s objective on " + dateStr;
                    } else {
                    	statusMsg = "Agreed by " + mgrName.trim() + " on " + dateStr;
                    }
                } else {
                	dateStr = moment(vm.data.DateShared()).format("Do MMMM YYYY"); // dd/mm/yyyy
                    statusMsg = vm.managerView
                        ? "If you are happy with this record, please click AGREE, this will lock the record from further editing. Alternatively, if you wish to RECOMMEND CHANGES, have a chat to " + vm.details.ColleagueFirstName.trim() + ", they can update the records and re-share them with you for your sign off."
						//"Are you sure you want to agree and lock this objective from further editing? If No, please share your recommended changes with " 
                        : "Shared with " + mgrName + " on " + dateStr;
                }
            } else {
                statusMsg = "Share this objective with " + mgrName;
            }

            return statusMsg;
        };

        vm.getSubMessage = function () {
            var shared = vm.data.SharedWithManager(),
                approved = vm.data.Approved(),
                mgrName = vm.getManagerName();

            var subMessage = "";

            if (!shared) {
                subMessage = "Allow " + mgrName + " to view and agree this objective";
            } else if (shared && !approved && !vm.managerView) {
                subMessage = "Un-sharing allows you to edit your objectives. " + mgrName + " will not be able to view and agree unless the objective is shared.";
            }

            return subMessage;
        };

        vm.expandedView = ko.observable(vm.expanded);

        vm.expandedAll = params.expandedAll;

        vm.statusMessage = ko.observable(vm.getStatusMessage());

        vm.subMessage = ko.observable(vm.getSubMessage());

        vm.dirtyFlag = ko.oneTimeDirtyFlag(vm.data);

        vm.update = function (action) {
            var action = action || '';

            var jsonArgs = komap.toJS(vm.data);
            if ($.isEmptyObject(jsonArgs.Title)) {
            	toastr.info("Please enter the title for your new objective");
                return;
            }

            transformDates(jsonArgs);

            var mvcCreateAction = "objective/create";
            
            var mvcAction = (jsonArgs.Id === 0)
                ? mvcCreateAction
                : "objective/update";

            var $promise = $.ajax({
                data: jsonArgs,
                url: mvcAction,
                type: "post",
                dataType: "json"
            });

            $promise.done(function (result) {
            	if (result.success) {
            		vm.data.LastAmendedDate(result.data.LastAmendedDate);
            		vm.data.LastAmendedBy(result.data.LastAmendedBy);

            		vm.data.CreatedDate(result.data.CreatedDate);
            		vm.data.DateShared(result.data.DateShared);
            		vm.data.DateApproved(result.data.DateApproved);
            		vm.data.SignOffDate(result.data.SignOffDate);



                    if (mvcAction === mvcCreateAction) {
                        vm.onCreate(result.data);
                    } 

                	//We've just saved. So refresh the dirty flag
                    vm.dirtyFlag = ko.oneTimeDirtyFlag(vm.data);
                    vm.onSave();
                    //toastr.info("Your objective has been saved");
                } else {
                    toastr.error(result.message);
                }
            });

            $promise.fail(function (jqXHR, exception) {
                toastr.error(common.getAjaxError(jqXHR, exception));
            });
        };

        vm.confirmDiscard = function (calledByToggle) {
            //Can be called from the "Cancel" button or the +/- toggle
            var dialogOptions = {};

            var yesHandlerForNew = function () {
                if (calledByToggle) {
                    vm.expandedView(false);
                }
                vm.onCancel();
            };

            var yesHandlerForUpdates = function () {
                //Restore the data as user cancels modifications
                var $promise = dataService.getOneObjective(vm.data.Id());
                $promise.done(function (data) {
                    komap.fromJS(data, vm.data);
                    vm.dirtyFlag = ko.oneTimeDirtyFlag(vm.data);
                    vm.statusMessage(vm.getStatusMessage());
                    vm.subMessage(vm.getSubMessage());
                    if (calledByToggle) {
                        vm.expandedView(false);
                    }
                    vm.onCancel();
                });
            };

            if (vm.data.Id() === 0) {
                //Create new objective view
                dialogOptions = {
                    titleText: "Add A New Objective",
                    bodyText: "Are you sure? This objective has not been saved. Are you sure you want to discard it?",
                    yesHandler: yesHandlerForNew
                };
            } else {
                //Update existing objective view
                dialogOptions = {
                    titleText: "Edit/View Objective",
                    bodyText: "You have modified this objective. Are you sure you want to discard it?",
                    yesHandler: yesHandlerForUpdates
                };
            }
            confirmModal.init(dialogOptions);

            confirmModal.show();
        };//confirmDiscard

        vm.cancel = function () {
            if (vm.dirtyFlag()) {
                vm.confirmDiscard(false);
            } else {
                vm.toggleView();
                vm.onCancel();
            }
        };

        vm.toggleView = function () {
            if (vm.dirtyFlag()) {
                if (vm.expandedView()) {
                    vm.confirmDiscard(true);
                }
            } else {
                vm.expandedView(!vm.expandedView());
            }
        };

        vm.shareObjective = function (share) {
            var linkObjective = komap.toJS(vm.data);
            transformDates(linkObjective);

            var $promise;
            if (share) {
                $promise = dataService.shareObjective(linkObjective);
            } else {
                $promise = dataService.unshareObjective(linkObjective);
            }

            $promise.done(function (result) {
                if (result.success) {
                    vm.data.LastAmendedDate(result.data.LastAmendedDate);
                    vm.data.LastAmendedBy(result.data.LastAmendedBy);
                    vm.data.SharedWithManager(result.data.SharedWithManager);
                    vm.data.DateShared(result.data.DateShared);//null for unshare

                    //We've just saved. So refresh the dirty flag
                    vm.dirtyFlag = ko.oneTimeDirtyFlag(vm.data);
                    vm.readOnly(vm.data.SharedWithManager()); //Read only when shared
                    //toastr.info("You have successfully " + (share ? "shared" : "unshared") + " the objective");
                } else {
                    //Failed to share/unshare objective.
                    vm.data.SharedWithManager(!vm.data.SharedWithManager());//Toggle back. Undo
                    vm.dirtyFlag = ko.oneTimeDirtyFlag(vm.data);
                    toastr.error(result.message);
                }
                vm.statusMessage(vm.getStatusMessage());
                vm.subMessage(vm.getSubMessage());
            }); 

            $promise.fail(function (jqXHR, exception) {
                //Service call problem
                vm.data.SharedWithManager(!vm.data.SharedWithManager());//Toggle back. Undo
                vm.dirtyFlag = ko.oneTimeDirtyFlag(vm.data);
                toastr.error(common.getAjaxError(jqXHR, exception));
                vm.statusMessage(vm.getStatusMessage());
                vm.subMessage(vm.getSubMessage());
            });
        };
        //vm.shareObjective

        vm.share = function (data) {
            data.data.SharedWithManager(!data.data.SharedWithManager());//Toggle manually
            vm.shareObjective(data.data.SharedWithManager());
        };

        //This function is meant to be used by a manager to approve his direct reports objectives.
        //The only thing this function can change is to set the Aprroved flag to true.
        //This is the only thing that can be done in manager view. If we fail this then we need to reset the dirtyFlag.
        vm.doApprove = function (objectiveId, ownerColleagueId) {
            var $promise = dataService.approveObjective(objectiveId, ownerColleagueId);

            $promise.done(function (result) {
                if (result.success) {
                    vm.data.LastAmendedDate(result.data.LastAmendedDate);
                    vm.data.LastAmendedBy(result.data.LastAmendedBy);
                    vm.data.DateApproved(result.data.DateApproved);

                    //We've just saved. So refresh the dirty flag
                    vm.dirtyFlag = ko.oneTimeDirtyFlag(vm.data);
                    //vm.onSave();//?? do we need this
                    toastr.info("You have successfully approved the objective");
                } else {
                    //Failure. Revert the UI (and UI model) states
                    vm.data.Approved(false);
                    vm.setApprovalUi(vm.data.Approved());
                    vm.dirtyFlag = ko.oneTimeDirtyFlag(vm.data);
                    toastr.error(result.message);
                }
            });

            $promise.fail(function (jqXHR, exception) {
                //We failed to approval so revert.
                vm.data.Approved(false);
                vm.setApprovalUi(vm.data.Approved());
                vm.dirtyFlag = ko.oneTimeDirtyFlag(vm.data);
                toastr.error(common.getAjaxError(jqXHR, exception));

            });

        };

        vm.doDisapprove = function (objectiveId, ownerColleagueId) {
            var $promise = dataService.disapproveObjective(objectiveId, ownerColleagueId);

            $promise.done(function (result) {
                if (result.success) {
                    vm.data.LastAmendedDate(result.data.LastAmendedDate);
                    vm.data.LastAmendedBy(result.data.LastAmendedBy);
                    vm.data.DateApproved(result.data.DateApproved);
                    vm.data.SharedWithManager(result.data.SharedWithManager);

                    //We've just saved. So refresh the dirty flag
                    vm.dirtyFlag = ko.oneTimeDirtyFlag(vm.data);
                    //vm.onSave();//?? do we need this
                    toastr.info("You have successfully disagree the objective");
                    vm.onUnsharedByManager(vm.data.Id());
                } else {
                    //Failure. Revert the UI (and UI model) states
                    //vm.data.Approved(false);
                    vm.setApprovalUi(vm.data.Approved());
                    vm.dirtyFlag = ko.oneTimeDirtyFlag(vm.data);
                    toastr.error(result.message);
                }
            });

            $promise.fail(function (jqXHR, exception) {
                //We failed to approval so revert.
                //vm.data.Approved(false);
                vm.setApprovalUi(vm.data.Approved());
                vm.dirtyFlag = ko.oneTimeDirtyFlag(vm.data);
                toastr.error(common.getAjaxError(jqXHR, exception));
            });
        };

        //Update UI for according to Approved flag
        vm.setApprovalUi = function (isApproved) {
            if (isApproved) {
                vm.data.DateApproved(new Date());
                vm.readOnly(true);
            } else {
                vm.data.DateApproved(null);
                vm.readOnly(false);
            }

            vm.statusMessage(vm.getStatusMessage());
            vm.subMessage(vm.getSubMessage());
        };

        vm.approveObjective = function (viewModel) {
            viewModel.data.Approved(!viewModel.data.Approved());//Toggle manually

            vm.setApprovalUi(viewModel.data.Approved());

            //When associated checkbox is ticked it disappear and data is saved (as per UX doc LINK-247)
            vm.doApprove(viewModel.data.Id(), viewModel.data.ColleagueId());
        };

        vm.disapproveObjective = function (viewModel) {
            vm.doDisapprove(viewModel.data.Id(), viewModel.data.ColleagueId());
        };

        vm.approve = function (viewModel) {

        	var dialogOptions = {};

        	var yesHandler = function () {
        		vm.approveObjective(viewModel);
        	};

        	var noHandler = function () {
        		vm.disapproveObjective(viewModel);
        	};

        	dialogOptions = {
        		titleText: "Agree objective?",
        		bodyText: "This action cannot be undone",
        		yesHandler: yesHandler,
        		noHandler: noHandler,
        		showCloseButton: false
        	};

        	confirmModal.init(dialogOptions);

        	confirmModal.show();
        };

        //vm.formatDateMonthDYHM = function (dateObj) {
        //	if (!dateObj) {
        //		return '-';
        //	}
        //	var formattedString = moment(dateObj).format('dddd, MMMM Do YYYY [at] HH:mm');
        //	return formattedString;
        //};

        return vm;
    };

    var viewModel = {
        createViewModel: function (params, componentInfo) {
            var vm = oneObjectiveModel(params);
            return vm;
        }
    };

    return { viewModel: viewModel, template: htmlTemplate };
});
