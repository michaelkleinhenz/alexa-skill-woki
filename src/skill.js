'use strict';

var cineprog = require('./cineprog');
var cinespeak = require('./cinespeak');
var mockResponse;

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'SSML',
            ssml: output
        },
        card: {
            type: 'Simple',
            title: 'SessionSpeechlet - ' + title,
            content: 'SessionSpeechlet - ' + output
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Wilkommen';
    const speechOutput = '<speak>Willkommen zum Kinoprogramm des Woki Kinos in Bonn. ' +
        'Du kannst mich nach dem Kinoprogramm an einem bestimmten Tag fragen.</speak>';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Frage mich nach dem Programm an einem bestimmten Tag, in dem du, ' +
        'Was läuft morgen im Woki sagst';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Vielen Dank, einen schönen Tag noch!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function queryShowtimes(movies, intent, session, callback) {
    const cardTitle = intent.name;
    var repromptText = '';
    var sessionAttributes = {};
    const shouldEndSession = true;
    var speechOutput = '';

    var currentDate = new Date();
    if (movies.length==0)
        speechOutput = "<speak>Ich kann aktuell keine Filminformationen abrufen, versuche es später noch einmal.</speak>";

    const dateSlot = intent.slots.Date;
    if (dateSlot) {
        const date = new Date(dateSlot.value);
        var showtimes = cineprog.searchByDay(movies, date);
        if (showtimes.length==0) {
            speechOutput = "<speak>Für dieses Datum habe ich keine Informationen gefunden.</speak>";
        } else
            speechOutput = cinespeak.speakMovieScreenings("Morgen läuft:", showtimes);
        repromptText = "Du kannst mich nach dem Programm fragen, in dem du 'was läuft morgen abend' sagst.";
    }

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    //console.log('onSessionStarted requestId=' + sessionStartedRequest.requestId + ', sessionId=' + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    //console.log('onLaunch requestId=' + launchRequest.requestId + ', sessionId=' + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    //console.log('onIntent requestId=' + intentRequest.requestId + ', sessionId=' + session.sessionId);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    var queryParam = "1f41d48dc28f65c9bde889753b000f51";
    if (mockResponse)
        queryParam = mockResponse;
    cineprog.retrieve(queryParam, mockResponse?true:false, function(err, movies) {
        // Dispatch to your skill's intent handlers
        if (intentName === 'ProgrammFuer') {
            queryShowtimes(movies, intent, session, callback);
        } else if (intentName === 'AMAZON.HelpIntent') {
            getWelcomeResponse(callback);
        } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
            handleSessionEndRequest(callback);
        } else {
            throw new Error('Invalid intent');
        }
    });
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    //console.log('onSessionEnded requestId=' + sessionEndedRequest.requestId + ', sessionId=' + session.sessionId);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

exports.setMockResponse = function(responseXml) {
    mockResponse = responseXml;
}

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function(event, context, callback) {
    try {
        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
         if (event.session.application.applicationId !== 'amzn1.echo-sdk-ams.app.[unique-value-here]') {
         callback('Invalid Application ID');
         }
         */

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
