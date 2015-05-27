(function($, jasmine) {
    $('.header').append('<p><a href="#jasmine-results"><strong>Jasmine Report</strong></a> <span id="jasmine-results-status"></span></p>');
    $('.sections').after('<br><span id="jasmine-results" />');
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

            $(".jasmine_html-reporter").appendTo("#jasmine-results");
        }
    }
    jasmine.getEnv().addReporter(reporter);
}($, jasmine));
