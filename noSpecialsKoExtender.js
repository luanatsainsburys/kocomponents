//Definition. Ignore special characters in input
ko.extenders.noSpecials = function (target, option) {
    target.subscribe(function (newValue) {
        target(newValue.replace(/[</]+/g, ''));
    });
    return target;
};
    
//Use the extender to extend an observable
vm.data.Title.extend({ noSpecials: "" });