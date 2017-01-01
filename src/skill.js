'use strict';

var cineprog = require('./cineprog');
var intents = require('./intents');

var mockResponse;

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}

function buildErrorResponse() {
  return {
      outputSpeech: {
          type: 'SSML',
          ssml: "<speak>Ich kann aktuell keine Filminformationen abrufen, versuche es später noch einmal.</speak>"
      },
      reprompt: {
          outputSpeech: {
              type: 'PlainText',
              text: "<speak>Ich kann aktuell keine Filminformationen abrufen, versuche es später noch einmal.</speak>"
          }
      },
      shouldEndSession: true
  };
}

// Called when the session starts.
function onSessionStarted(sessionStartedRequest, session) {
    console.log("Session started for session " + session.sessionId);
}

// Called when the user launches the skill without specifying what they want.
function onLaunch(launchRequest, session, callback) {
    console.log("Skill launched without intent for session " + session.sessionId);
    intents.getWelcomeResponse(callback);
}

//Called when the user specifies an intent for this skill.
function onIntent(intentRequest, session, callback) {
    console.log("Intent received for session " + session.sessionId + " - Intent: " + intentRequest.intent.name);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    var queryParam = "1f41d48dc28f65c9bde889753b000f51";
    if (mockResponse)
        queryParam = mockResponse;
        
    cineprog.retrieve(queryParam, mockResponse?true:false, function(err, movies) {
        if (!movies || movies.length==0)
            callback({}, buildErrorResponse());

        // Dispatch to your skill's intent handlers
        if (intentName === 'ProgramOn') {
            intents.queryProgramOn(movies, intent, session, callback);
        } else if (intentName === 'RandomMovie') {
            intents.queryRandomMovie(movies, intent, session, callback);
        } else if (intentName === 'RecommendMovie') {
            intents.queryRecommendMovie(movies, intent, session, callback);
        } else if (intentName === 'NewMovies') {
            intents.queryNewMovies(movies, intent, session, callback);
        } else if (intentName === 'AboutCinema') {
            intents.queryAboutCinema(movies, intent, session, callback);
        } else if (intentName === 'ReservationCinema') {
            intents.queryReservationCinema(movies, intent, session, callback);
        } else if (intentName === 'AMAZON.YesIntent') {
            intents.queryYes(movies, intent, session, callback);
        } else if (intentName === 'AMAZON.NoIntent') {
            intents.queryNo(movies, intent, session, callback);
        } else if (intentName === 'AMAZON.HelpIntent') {
            intents.getHelpResponse(callback);
        } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
            intents.handleSessionEndRequest(callback);
        } else {
            intents.getWelcomeResponse(callback);
        }
    });
}

// Called when the user ends the session.
// Is not called when the skill returns shouldEndSession=true.
function onSessionEnded(sessionEndedRequest, session) {
    console.log("Session closed for session " + session.sessionId);
    // Add cleanup logic here
}

// exported functions

exports.setMockResponse = function(responseXml) {
    mockResponse = responseXml;
}

exports.isUnderTest = function() {
    return (typeof mockResponse!="undefined" && mockResponse!=null);
}

exports.handler = function(event, context, callback) {
    try {
        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                function(sessionAttributes, speechletResponse) {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                }
            );
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                function (sessionAttributes, speechletResponse) {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                }
            );
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};
