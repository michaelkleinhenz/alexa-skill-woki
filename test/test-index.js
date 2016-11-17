var assert = require('assert');
var fs = require('fs')

var skill = require("../skill.js");

var sampleAlexaRequest = require('./sample-alexa-request.json');
var xmlResponse;

before(function(done) {
  fs.readFile("./test/sample-response.xml", "utf8", function(err, data) {
    if (err) throw err;
      xmlResponse = data;
    done();
  });
});

describe("Alexa Skill", function() {
  it("should work", function(done) {
    skill.setMockResponse(xmlResponse);
    skill.handler(sampleAlexaRequest, null, function(err, result) {
      assert(result)
      done();
    });
  });
});
