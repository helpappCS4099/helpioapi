const { connectDB } = require('../database')
const { makeServerApp } = require('../server')
// https://stackoverflow.com/questions/24153261/joining-tests-from-multiple-files-with-mocha-js

function importTest(name, path) {
    describe(name, function () {
        require(path);
    });
}

describe("HELPAPP_API_UNITTESTS", function () {
    beforeEach(function(done) {
        done()
    });
    importTest("mockDBOperations.js", './health.tests.js');
    importTest("auth.tests.js", './auth.tests.js');
    after(function(done) {
        done()
    });
});