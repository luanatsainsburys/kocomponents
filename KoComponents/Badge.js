define(["text!App/KoComponents/Badge.html"], function (htmlTemplate) {
    "use strict";

    var viewModel = function (params) {
        var self = {};
        self.class = params.class;
        self.label = params.label;
        self.quantity = params.quantity;
        return self;
    }

    return {
        viewModel: viewModel,
        template: htmlTemplate
    };
});