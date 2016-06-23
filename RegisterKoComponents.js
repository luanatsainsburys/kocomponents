define(['jquery', 'knockout', 'text'], function ($, ko) {
    "use strict";

    ko.bindingHandlers.stopBinding = {
        init: function () {
            return {controlsDescendantBindings: true};
        }
    };

    // accepts jQuery node and remove boolean
    ko.unapplyBindings = function ($node, remove) {
        // unbind events
        $node.find("*").each(function () {
            $(this).unbind();
        });

        // Remove KO subscriptions and references
        if (remove) {
            ko.removeNode($node[0]);
        } else {
            ko.cleanNode($node[0]);
        }
    };

    ko.oneTimeDirtyFlag = function (root) {
        var _initialized;

        //one-time dirty flag that gives up its dependencies on first change
        var result = ko.computed(function () {
            if (!_initialized) {
                //just for subscriptions
                ko.toJS(root);

                //next time return true and avoid ko.toJS
                _initialized = true;

                //on initialization this flag is not dirty
                return false;
            }

            //on subsequent changes, flag is now dirty
            return true;
        });

        return result;
    };

    ko.extenders.noSpecials = function (target, option) {
        target.subscribe(function (newValue) {
            target(newValue.replace(/[</]+/g, ''));
        });
        return target;
    };

    ko.components.register("profile-tabs", { require: "App/kocomponents/profileTabs" });
    ko.components.register("objectives-list", { require: "App/kocomponents/objectivesList" });
    ko.components.register("pdp-accordion", { require: "App/kocomponents/pdpAccordion" });
    ko.components.register("meeting-history", { require: "App/kocomponents/meeting-history" });
    ko.components.register("colleague-meetings", { require: "App/kocomponents/colleagueMeetings" });
    ko.components.register("past-meetings", { require: "App/kocomponents/pastMeetings" });
    ko.components.register("current-meeting", { require: "App/kocomponents/currentMeeting" });
    ko.components.register("tab-pdp", { require: "App/kocomponents/tabPdp" });
    ko.components.register("one-objective", { require: "App/kocomponents/oneObjective" });
    ko.components.register("breadcrumbs", { require: "App/kocomponents/breadcrumbs" });
    ko.components.register("pdp", { require: "App/kocomponents/pdp" });
    ko.components.register("objective-set", { require: "App/kocomponents/objectiveSet" });
    ko.components.register("objective-set-list", { require: "App/kocomponents/objectiveSetList" });
    ko.components.register("objectives-manager-view", { require: "App/kocomponents/objectivesManagerView" });

});//Module end