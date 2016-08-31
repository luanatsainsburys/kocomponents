define(["jquery", "toastr", "confirmModal", "text!App/kocomponents/pdp.html", "underscore", "knockout", "komap", "common", "autogrow", "dataService"],
	function ($, toastr, confirmModal, htmlTemplate, _, ko, komap, commonService, autogrow, dataService) {
	    "use strict";

	    var makePdp = function () {
	        var pdp = {
	            Id: 0,
	            ColleagueId: '',
	            achieveObjectives: '',
	            achieveObjectivesActions: '',
	            achieveObjectivesWhen: '',
	            keyStrengths: '',
	            keyStrengthsActions: '',
	            keyStrengthsWhen: '',
	            careerAspirations: '',
	            careerAspirationsActions: '',
	            careerAspirationsWhen: '',
	            ColleagueSignOff: 0,
	            ColleagueSignOffDate: null,
	            ManagerSignOff: 0,
	            ManagerSignOffDate: null,
	            SharingDate: null,
	            ApprovalDate: null,
	            CreatedDate: null,
	            UpdatedDate: null
	        };
	        return pdp;
	    };

	    var fieldsToTrack = function (pdp) {
	        var container = {};
	        container.achieveObjectives = pdp.achieveObjectives;
	        container.achieveObjectivesActions = pdp.achieveObjectivesActions;
	        container.achieveObjectivesWhen = pdp.achieveObjectivesWhen;
	        container.careerAspirations = pdp.careerAspirations;
	        container.careerAspirationsActions = pdp.careerAspirationsActions;
	        container.careerAspirationsWhen = pdp.careerAspirationsWhen;
	        container.keyStrengths = pdp.keyStrengths;
	        container.keyStrengthsActions = pdp.keyStrengthsActions;
	        container.keyStrengthsWhen = pdp.keyStrengthsWhen;
	        return container;
	    };

	    //View model
	    var viewModel = function (params) {

	        var self = {}, dataModel;

	        //Ran after this component has rendered
	        self.componentLoaded = function () {
	            $('textarea').autogrow({ onInitialize: true });
	            $('.collapse').on('shown.bs.collapse', function () {
	                $('textarea').autogrow({ onInitialize: true });
	            });
	        };

            //Services used
	        self.commonService = commonService;

            //Input data
	        //self.pdp = params.data || makePdp();
	        self.pdp = komap.fromJS(params.data || makePdp());//params.data is JSON form of a LinkObjective server object
	        dataModel = self.pdp; //alias

	        self.trackedData = fieldsToTrack(self.pdp);
	        self.dirtyFlag = ko.oneTimeDirtyFlag(self.trackedData);


	        self.readOnly = params.readOnly !== undefined ? params.readOnly : true;
	        if (!ko.isObservable(self.readOnly)) {
	            self.readOnly = ko.observable(self.readOnly);
	        }
	        self.readOnly(dataModel.SharingDate() ? true : false); //Data takes precedence


	        self.managerView = params.managerView !== undefined ? params.managerView : false;

            //Added to allow the display of the pdp owner's full name in manager view
	        self.ownerColleague = params.ownerColleague; // || self.commonService.getUserInfo().colleague;
	        self.ownerFullName = self.ownerColleague ? self.ownerColleague.FirstName + " " + self.ownerColleague.LastName : "Unknown";
	        self.ownerFirstName = self.ownerColleague ? self.ownerColleague.FirstName : "Unknown";
	        self.managerFullName = self.ownerColleague && self.ownerColleague.Manager ? self.ownerColleague.Manager.FirstName + " " + self.ownerColleague.Manager.LastName : "Unknown";

	        //attach accordion events
	        $('.collapse').on('shown.bs.collapse', function () {
	            $(this).parent().find(".glyphicon-plus").removeClass("glyphicon-plus").addClass("glyphicon-minus");
	        }).on('hidden.bs.collapse', function () {
	            $(this).parent().find(".glyphicon-minus").removeClass("glyphicon-minus").addClass("glyphicon-plus");
	        });


            //BEHAVIOUR (functions)
	        self.yesHandlerForApproval = function () {

	            var $promise = $.ajax({
	                url: '/pdp/ApprovePdp?colleagueId=' + self.data.ColleagueId,
	                type: "get",
	                dataType: "json"
	            });

	            $promise.done(function (result) {
	                if (result.ErrorMessage) {
	                    toastr.error(result.ErrorMessage);
	                }
	                //else {
	                //    self.showTab(2);
	                //}
	            });

	            $promise.fail(function (jqXHR, exception) {
	                toastr.error(commonService.getAjaxError(jqXHR, exception));
	            });
	        };

	        self.noHandlerForUnshare = function () {

	            var $promise = dataService.disagreePdp(self.data.ColleagueId);

	            $promise.done(function (result) {
	                //self.showTab(2);
	            });

	            $promise.fail(function (jqXHR, exception) {
	                toastr.error(commonService.getAjaxError(jqXHR, exception));
	            });
	        };

	        self.approve = function () {
	            confirmModal.init({
	                titleText: "Agree Performance Development Plan?",
	                bodyText: "This action cannot be undone",
	                yesHandler: self.yesHandlerForApproval,
	                noHandler: self.noHandlerForUnshare,
	                showCloseButton: false
	            });

	            confirmModal.show();
	        };

	        var transformDates = function (pdp) {
	            pdp.SharingDate = commonService.jsonDateToString(pdp.SharingDate);
	            pdp.ApprovalDate = commonService.jsonDateToString(pdp.ApprovalDate);
	            pdp.CreatedDate = commonService.jsonDateToString(pdp.CreatedDate);
	            pdp.UpdatedDate = commonService.jsonDateToString(pdp.UpdatedDate);
	            pdp.ColleagueSignOffDate = commonService.jsonDateToString(pdp.ColleagueSignOffDate);
	            pdp.ManagerSignOffDate = commonService.jsonDateToString(pdp.ManagerSignOffDate);
	            pdp.PdpSections.forEach(function (entry) {
	                entry.PdpItems.forEach(function (item) {
	                    item.forEach(function (pdps) { pdps.CreatedDate = commonService.jsonDateToString(pdps.CreatedDate) })
	                }
                        )
	            });
	        };

            //Save/Update this pdp
	        self.update = function (data) {
	            var modifiedPdp = komap.toJS(data.pdp);

	            transformDates(modifiedPdp); //Transform dates before calling mvc actions
	            var $promise = dataService.updatePdp(modifiedPdp);

	            $promise.done(function (result) {
	                if (result.success) {
	                    dataModel.UpdatedDate(result.data.UpdatedDate);
	                    self.dirtyFlag = ko.oneTimeDirtyFlag(self.pdp); //Reset dirty flag as client/server data now in sync
	                    toastr.info("PDP updated");
	                } else {
	                    toastr.error(result.message);
	                }
	            });

	            $promise.fail(function (jqXHR, exception) {
	                toastr.error(commonService.getAjaxError(jqXHR, exception));
	            });

	        };

	        self.toggleShare = function (data, services) {
	            var modifiedPdp = komap.toJS(data.pdp);

	            transformDates(modifiedPdp); //Transform dates before calling mvc actions
	            var $promise = services.serviceToCall(modifiedPdp);

	            $promise.done(function (result) {
	                if (result.success) {
	                    dataModel.SharingDate(result.data.SharingDate);
	                    dataModel.UpdatedDate(result.data.UpdatedDate);

	                    self.readOnly(dataModel.SharingDate() ? true : false);

	                    //Data is saved before it is shared. So the share action would result in data being in sync.
                        //Data cannot be changed between shared and unshared so they are still in sync.
	                    self.dirtyFlag = ko.oneTimeDirtyFlag(self.pdp); //Reset dirty flag as client/server data now in sync
	                } else {
	                    toastr.error(result.message);
	                }
	            });

	            $promise.fail(function (jqXHR, exception) {
	                toastr.error(commonService.getAjaxError(jqXHR, exception));
	            });
	        };

	        self.confirmUnshare = function (data) {
	            var dialogOptions = {
	                titleText: "Un-Share your PDP?",
	                bodyText: "Are you sure you want to un-share this PDP with your manager?",
	                yesHandler: function () { self.toggleShare(data, { serviceToCall: dataService.unsharePdp }); },
	                showCloseButton: false
	            };

	            confirmModal.init(dialogOptions);

	            confirmModal.show();
	        };

	        self.confirmShare = function (data, event) {
	            
	            var dialogOptions = {
	                titleText: "Share your PDP?",
	                bodyText: "Are you sure you want to share this PDP with your manager?",
	                yesHandler: function () { self.toggleShare(data, { serviceToCall: dataService.sharePdp }) },
	                showCloseButton: false
	            };

	            confirmModal.init(dialogOptions);

	            confirmModal.show();
	        };

	        self.print = function () {
	            if (!self.readOnly()) {
	                self.readOnly(true);
	                window.print();
	                self.readOnly(false);
	            } else {
	                window.print();
	            }
	        };

	        //Save data before leaving
	        self.leavingPage = function () {
	            if (self.dirtyFlag()) {
	                return "Data has been modified";
	            }
	        };

	        $(window).on('beforeunload', self.leavingPage);

	        return self;
	    };

	    return {
	        viewModel: viewModel,
	        template: htmlTemplate
	    };
	});