define(["text!App/KoComponents/ChillBadge.html"], function (htmlTemplate) {
    "use strict";

    var viewModel = function (params) {
        var self = {};
        self.quantity = params.quantity;
        return self;
    }

    return {
        viewModel: viewModel,
        template: htmlTemplate
    };
});