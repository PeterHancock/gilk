(function(jasmine) {
    var passed = true;
    var reporter = {

        specDone: function(result) {
            if (result.failedExpectations.length) {
                passed = false;
            }
        },

        jasmineDone: function() {
            var innerHTML;
            if (passed) {
                innerHTML = '(<strong style="color:green"> ALL PASSED </strong>)';
            } else {
                innerHTML = '(<strong style="color:red"> WITH FAILURES </strong>)';
            }
            document.getElementById('jasmine-results-status').innerHTML = innerHTML;
        }
    }
    jasmine.getEnv().addReporter(reporter);
}(jasmine));
