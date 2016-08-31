define(["jquery", "moment", "toastr", "confirmModal", "text!App/kocomponents/pdpAccordion.html", "underscore", "knockout"],
	function ($, moment, toastr, confirmModal, htmlTemplate, _, ko) {
    "use strict";

    //View model
    var viewModel = function (params) {

    	var self = params.data;

    	self.showTab = params.showTab;

    	//attach accordion events
        $('.collapse').on('shown.bs.collapse', function () {
        	$(this).parent().find(".glyphicon-plus").removeClass("glyphicon-plus").addClass("glyphicon-minus");
        }).on('hidden.bs.collapse', function () {
        	$(this).parent().find(".glyphicon-minus").removeClass("glyphicon-minus").addClass("glyphicon-plus");
        });

        self.SharingDateFormatted = self.SharingDate ? moment(self.SharingDate).format("Do MMMM YYYY") : '';
        self.ApprovalDateFormatted = self.ApprovalDate ? moment(self.ApprovalDate).format("Do MMMM YYYY") : '';


        self.approve = function () {
        	confirmModal.init({
        		titleText: "Agree Performance Development Plan?",
        		bodyText: "This action cannot be undone",
        		yesHandler: yesHandlerForApproval,
        		noHandler: noHandlerForUnshare,
        		showCloseButton: false
        	});

        	confirmModal.show();
        }

        var yesHandlerForApproval = function () {
        	
        	var $promise = $.ajax({
        		url: '/pdp/ApprovePdp?colleagueId=' + self.data.ColleagueId,
        		type: "get",
        		dataType: "json"
        	});

        	$promise.done(function (result) {
        		if (result.ErrorMessage) {
        			toastr.error(result.ErrorMessage);
        		}
        		else {
        			self.showTab(2);
        		}
        	});
        	$promise.error(function (request) {
        		toastr.error(request.responseText);
        	});
        };

        var noHandlerForUnshare = function () {
        	var $promise = $.ajax({
        	    url: '/pdp/DisagreePdp?colleagueId=' + self.data.ColleagueId,
        	    type: "post",
        		dataType: "json"
        	});

        	$promise.done(function (result) {
        		if (result.ErrorMessage) {
        			toastr.error(result.ErrorMessage);
        		}
        		else {
        			self.showTab(2);
        		}
        	});
        	$promise.error(function (request) {
        		toastr.error(request.responseText);
        	});
        };

        return self;
    };

    return {
        viewModel: viewModel,
        template: htmlTemplate
    };
});