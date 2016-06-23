//This module manages the "ObjectiveSet/Index" view.
define(["jquery", "knockout", "common", "toastr", "dataService", "featureContainerService", "RegisterKoComponents"], function ($, ko, common, toastr, dataService, ftc) {
    "use strict";

    //View model
    var PageViewModel = function () {
        var vm = {};
        vm.noActiveSet = ko.observable(false);

        vm.newObjectiveSet = function (data, event) {
            $("#objUsrView").trigger("newObjectiveSet");
        };

        return vm;
    };

    var showInitialView = function () {
        var colleague = common.getUserInfo().colleague;
        var vm = PageViewModel();

        ko.applyBindings(vm, document.getElementById("ObjectivesListView"));
    };

    var init = function () {
        ftc.startPageUi(showInitialView);
    };

    return {
        init: init
    };

});