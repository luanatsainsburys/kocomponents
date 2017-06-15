//<location-case-fill> component
//Use the same html template as <case-fill> component
(function ($, ko) {

    ko.components.register("location-case-fill", {
        viewModel: function (params) {
            var self = {};

            //Internal properties
            self.depotId = ko.observable(0);
            self.locationId = ko.observable(0);

            //Template bound properties (external)
            self.noData = ko.observable(true);
            self.message = ko.observable('');

            self.columnHeaders = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            self.categories = ko.observableArray([]);
            self.byCategory = ko.observable();

            //Input parameters
            self.location = params.location || null;

            if (!self.location || !ko.isObservable(self.location)) {
                throw "location parameter of component <location-case-fill> must be a valid observable.";
            }

            if (!self.location().mainServingDepotId() > 0 || !self.location().id() > 0) {
                self.noData(true);
                self.message('Invalid depot id and/or location id');
            }

            self.saveCaseFillFactors = ko.asyncCommand({
                execute: function (complete) {

                    if (!self.isValid()) {
                        self.message("We have not saved the data as there are errors.")
                        complete();
                        return;
                    }

                    var $promise = $.ajax({
                        type: "POST",
                        url: "/api/depot/SaveCaseFillFactors",
                        data: ko.toJSON(ko.mapping.toJS(self.data)),
                        dataType: "json"
                    });

                    $promise.done(function (result) {
                        var result = result;
                        complete();
                    });

                    $promise.fail(function (error) {
                        var error = error;
                        complete();
                    });
                },

                canExecute: function (isExecuting) {
                    return !isExecuting;
                }
            });

            self.getCaseFillFactors = ko.asyncCommand({
                execute: function (complete) {

                    var $promise = $.ajax({
                        type: "GET",
                        url: "/api/depot/GetCaseFillFactors/" + self.depotId() + "/" + self.locationId()
                    });

                    $promise.done(function (result) {
                        if (result) {
                            self.noData(false);

                            var result = result; //Array
                            self.data = ko.mapping.fromJS(result);

                            ko.utils.arrayForEach(self.data(), function (item) {
                                item.factor.extend({ required: true })
                                .extend({ min: 1.00 })
                                .extend({ max: 9999.99 })
                                .extend({ pattern: {message: 'Please enter number in format nnnn.nn', params: /^\d{1,4}(\.\d{1,2})?$/}});
                            });

                            self.byCategory(_.groupBy(self.data(), function (item) {
                                return item.caseFillCategory.name();
                            }));

                            self.categories(Object.keys(self.byCategory()).sort());

                        } else {
                            self.noData(true);
                        }
                        complete();
                    });

                    $promise.fail(function (error) {
                        var error = error;
                        complete();
                    });
                },

                canExecute: function (isExecuting) {
                    return !isExecuting;
                }
            });

            self.location.subscribe(function (newValue) {
                //Ensure we have both valid depot id and location id
                if (newValue && newValue.mainServingDepotId() > 0 && newValue.id() > 0) {
                    self.message('');
                    self.depotId(newValue.mainServingDepotId());
                    self.locationId(newValue.id());
                    self.getCaseFillFactors();
                } else {
                    self.message("Invalid depot id and/or location id.");
                }
            });

            self.isValid = function () {
                var errors = ko.validation.group(self, { deep: true });
                return errors().length === 0;
            };

            return self;
        },
        template: { element: 'caseFill' }
    });

}(jQuery, ko));