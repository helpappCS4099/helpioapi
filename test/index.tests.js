const { connectDB } = require('../database')
const { makeServerApp } = require('../server')
// https://stackoverflow.com/questions/24153261/joining-tests-from-multiple-files-with-mocha-js

function importTest(name, path) {
    describe(name, function () {
        require(path);
    });
}

describe("HELPAPP_API_UNITTESTS", function () {
    // importTest("mockDBOperations.js", './health.tests.js');
    // importTest("auth.tests.js", './auth.tests.js');
    // importTest("user.tests.js", './user.tests.js');
    importTest("help.tests.js", './help.tests.js');
});