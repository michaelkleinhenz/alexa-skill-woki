'use strict';

var http = require('http');
var rePattern = new RegExp(/<.*>.*<\/.*>/g);
var re2Pattern = new RegExp(/<(.*)>(.*)<\/(.*)>.*/);

var lib = require('./lib');

var movies = [];

function filterShowings(date, rangeInMs) {
    var result = [];
    var startDate = date.getTime();
    var endDate = startDate + (rangeInMs||0);
    for (var i=0; i<movies.length; i++) {
        var thisMovie = movies[i];
        var movieResult = {
            title:thisMovie.title,
            fsk:thisMovie.fsk,
            info:thisMovie.info,
            ticketingLink:thisMovie.ticketingLink,
            runtime:thisMovie.runtime,
            showings:[]
        };
        for (var j=0; j<thisMovie.showings.length; j++) {
            var thisShowing = thisMovie.showings[j];
            if (thisShowing.getDay()==date.getDay() && thisShowing.getMonth()==date.getMonth() && thisShowing.getYear()==date.getYear())
                if (!rangeInMs || (rangeInMs && thisShowing.getTime()>=startDate && thisShowing.getTime()<endDate))
                    movieResult.showings.push(thisShowing);
        }
        if (movieResult.showings.length>0)
            result.push(movieResult);
    }
    return result;
}

function searchByDay(date) {
    return filterShowings(date);
}

function searchByDateRange(startDate, rangeInMs) {
    return filterShowings(startDate, rangeInMs);
}

function getShowtimesFromService(callback) {
    http.get("http://www.cineprog.de/export/?kino=1f41d48dc28f65c9bde889753b000f51").on('response', function (response) {
        var body = "";
        response.on('data', function (chunk) {
            body += chunk;
        });
        response.on('end', function () {
            body = body.replace(new RegExp("><", "g"), ">\n<");
            var movies3D = [];
            var arrMatches = body.match(rePattern);
            var currentMovie = {"showings":[]};
            var currentDate = "";
            for (var i=0; i<arrMatches.length; i++) {
                var arrMatches2 = arrMatches[i].match(re2Pattern);
                var tagNameStart = arrMatches2[1].trim().toLowerCase();
                var tagNameEnd = arrMatches2[1].trim().toLowerCase();
                var content = arrMatches2[2];
                if (tagNameStart==tagNameEnd)
                    switch (tagNameStart) {
                        case "filmtitel":
                            if (currentMovie.showings.length>0) {
                                if (currentMovie.title.indexOf("(3D)")!=-1)
                                    movies3D.push(currentMovie);
                                else
                                    movies.push(currentMovie);
                            }
                            currentMovie={"title":content,"showings":[]};
                            break;
                        case "datum": currentDate=content; break;
                        case "zeit": currentMovie.showings.push(new Date(currentDate + " " + content)); break;
                        case "fsk": currentMovie.fsk=content; break;
                        case "zusatzinfo": currentMovie.info=content; break;
                        case "ticketinglink": currentMovie.ticketingLink=content; break;
                        case "minuten": currentMovie.runtime=parseInt(content||0); break;
                    }
            }
            var k = movies3D.length;
            while (k--) {
                var thisMovie = movies3D[k];
                var thisMovieTitle = movies3D[k].title.replace(" (3D)", "");
                for (var l=0; l<movies.length; l++) {
                    if (movies[l].title==thisMovieTitle) {
                        movies[l].showings3d = thisMovie.showings;
                        movies3D.splice(k, 1);
                    }
                }
            }
            movies = movies.concat(movies3D);

            callback();
        });
    });
}

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

function queryShowtimes(intent, session, callback) {
    const cardTitle = intent.name;
    var repromptText = '';
    var sessionAttributes = {};
    const shouldEndSession = true;
    var speechOutput = '';

    const dateSlot = intent.slots.Date;
    if (dateSlot) {
        const date = new Date(dateSlot.value);
        var showtimes = searchByDay(date);

        speechOutput = "<speak>Morgen läuft ";
        for (var i=0; i<showtimes.length; i++) {
            speechOutput += "" + showtimes[i].title + " um";
            for (var j=0; j<showtimes[i].showings.length; j++) {
                speechOutput += " " + showtimes[i].showings[j].getHours() + " Uhr " + (showtimes[i].showings[j].getMinutes()===0?"":showtimes[i].showings[j].getMinutes() + ", ");
            }
            speechOutput += "<break time='1s'/>";
        }
        speechOutput += "</speak>";
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

    getShowtimesFromService(function() {
        // Dispatch to your skill's intent handlers
        if (intentName === 'ProgrammFuer') {
            //setColorInSession(intent, session, callback);
            queryShowtimes(intent, session, callback);
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
