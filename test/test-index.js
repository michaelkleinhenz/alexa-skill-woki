var assert = require('assert');
var fs = require('fs')

var skill = require("../skill.js");

var sampleAlexaRequestProgramm = require('./alexa-request-programm.json');
var sampleAlexaRequestRandom = require('./alexa-request-random.json');
var sampleAlexaRequestRecommend = require('./alexa-request-recommend.json');
var xmlResponse;

before(function(done) {
  fs.readFile("./test/sample-response.xml", "utf8", function(err, data) {
    if (err) throw err;
      xmlResponse = data;
    done();
  });
});

describe("Program Query", function() {
  it("should work for unspecified dates.", function(done) {
    skill.setMockResponse(xmlResponse);
    skill.handler(sampleAlexaRequestProgramm, null, function(err, result) {
      assert(result)
      assert(result.response.outputSpeech.ssml.length>0);
      done();
    });
  });
  it("should work for specified day only.", function(done) {
    skill.setMockResponse(xmlResponse);
    sampleAlexaRequestProgramm.request.intent.slots.Date.value = "2016-11-18";
    skill.handler(sampleAlexaRequestProgramm, null, function(err, result) {
      assert(result)
      assert(result.response.outputSpeech.ssml.length>0);
      done();
    });
  });
  it("should work for specified day and time.", function(done) {
    skill.setMockResponse(xmlResponse);
    sampleAlexaRequestProgramm.request.intent.slots.Date.value = "2016-11-18";
    sampleAlexaRequestProgramm.request.intent.slots.Daytime.value = "mittag";
    skill.handler(sampleAlexaRequestProgramm, null, function(err, result) {
      assert(result);
      assert(result.response.outputSpeech.ssml.length>0);
      done();
    });
  });
});

describe("Random Movie", function() {
  it("should work for unspecified dates.", function(done) {
    skill.setMockResponse(xmlResponse);
    skill.handler(sampleAlexaRequestRandom, null, function(err, result) {
      assert(result)
      assert(result.response.outputSpeech.ssml.length>0);
      done();
    });
  });
  it("should work for specified day only.", function(done) {
    skill.setMockResponse(xmlResponse);
    sampleAlexaRequestRandom.request.intent.slots.Date.value = "2016-11-18";
    skill.handler(sampleAlexaRequestRandom, null, function(err, result) {
      assert(result)
      assert(result.response.outputSpeech.ssml.length>0);
      done();
    });
  });
  it("should work for specified day and time.", function(done) {
    skill.setMockResponse(xmlResponse);
    sampleAlexaRequestRandom.request.intent.slots.Date.value = "2016-11-18";
    sampleAlexaRequestRandom.request.intent.slots.Daytime.value = "mittag";
    skill.handler(sampleAlexaRequestRandom, null, function(err, result) {
      assert(result);
      assert(result.response.outputSpeech.ssml.length>0);
      done();
    });
  });
});
describe("Recommend Movie", function() {
  it("should work for unspecified dates.", function(done) {
    skill.setMockResponse(xmlResponse);
    skill.handler(sampleAlexaRequestRecommend, null, function(err, result) {
      assert(result)
      assert(result.response.outputSpeech.ssml.length>0);
      done();
    });
  });
  it("should work for specified day only.", function(done) {
    skill.setMockResponse(xmlResponse);
    sampleAlexaRequestRecommend.request.intent.slots.Date.value = "2016-11-18";
    skill.handler(sampleAlexaRequestRecommend, null, function(err, result) {
      assert(result)
      assert(result.response.outputSpeech.ssml.length>0);
      done();
    });
  });
  it("should work for specified day and time.", function(done) {
    skill.setMockResponse(xmlResponse);
    sampleAlexaRequestRecommend.request.intent.slots.Date.value = "2016-11-18";
    sampleAlexaRequestRecommend.request.intent.slots.Daytime.value = "mittag";
    skill.handler(sampleAlexaRequestRecommend, null, function(err, result) {
      assert(result);
      assert(result.response.outputSpeech.ssml.length>0);
      done();
    });
  });
});
