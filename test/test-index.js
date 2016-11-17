var assert = require('assert');

var skill = require("../dist/skill.js");

var sampleRequest = {
  "session": {
    "sessionId": "SessionId.0123456789",
        "application": {
        "applicationId": "amzn1.ask.skill.0123456789"
    },
    "attributes": {},
    "user": {
        "userId": "amzn1.ask.account.0123456789"
    },
    "new": true
  },
  "request": {
    "type": "IntentRequest",
    "requestId": "EdwRequestId.0123456789",
    "locale": "de-DE",
    "timestamp": "2016-11-16T15:00:00Z",
    "intent": {
      "name": "ProgrammFuer",
      "slots": {
        "Date": {
          "name": "Date",
          "value": "2016-11-17"
        }
      }
    }
  },
  "version": "1.0"
};

describe("Alexa Skill", function() {
  it("should work", function() {
    skill.handler(sampleRequest, null, function(err, result) {
      assert.notNull(result);
    });
  });
});
