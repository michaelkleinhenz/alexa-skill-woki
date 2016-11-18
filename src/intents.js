var cineprog = require('./cineprog');
var cinespeak = require('./cinespeak');

exports.buildSpeechletResponse = function(title, output, repromptText, shouldEndSession) {
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
              type: 'SSML',
              text: repromptText
          }
      },
      shouldEndSession: shouldEndSession
  };
}

exports.calculateTimeSlot = function(dateSlot, daytimeSlot) {
  // TODO: add support for empty dateslot and week dateslots
  var dateEpoch = new Date(dateSlot.value).getTime();
  var date;
  var interval;
  switch (daytimeSlot.value) {
    case "morgen":
    case "morgens":
      date = new Date(dateEpoch);
      interval = 12*60*60*1000;
      break;  
    case "mittag":
    case "mittags":
      date = new Date((dateEpoch + (11*60*60*1000)));
      interval = 6*60*60*1000;
      break;  
    case "abend":
    case "abends":
      date = new Date((dateEpoch + (17*60*60*1000)));
      interval = 12*60*60*1000;
      break;  
    default:
      date = new Date(dateEpoch);
      interval = 24*60*60*1000;
  }
  console.log("Calculated search range, input " + dateSlot.value + " " + daytimeSlot.value + " resolved to: " + date + " interval " + interval + " (" + (interval/1000/60/60) + "h)");
  return { date: date, interval: interval };
}

exports.getWelcomeResponse = function(callback) {
  // If we wanted to initialize the session to have some attributes we could add those here.
  const sessionAttributes = {};
  const cardTitle = "Wilkommen";
  const speechOutput = "<speak>Willkommen zum Kinoprogramm des Woki Kinos in Bonn. Du kannst mich nach dem Kinoprogramm an einem bestimmten Tag fragen.</speak>";
  // If the user either does not reply to the welcome message or says something that is not
  // understood, they will be prompted again with this text.
  const repromptText = "<speak>Frage mich nach dem Programm an einem bestimmten Tag, in dem du Was läuft morgen im Woki sagst</speak>";
  const shouldEndSession = false;

  callback(sessionAttributes,
      exports.buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

exports.handleSessionEndRequest = function(callback) {
  const cardTitle = "Session Ended";
  const speechOutput = "<speak>Vielen Dank, einen schönen Tag noch!</speak>";
  // Setting this to true ends the session and exits the skill.
  const shouldEndSession = true;

  callback({}, exports.buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

exports.queryProgramOn = function(movies, intent, session, callback) {
  const cardTitle = intent.name;
  const shouldEndSession = true;
  const timeSlot = exports.calculateTimeSlot(intent.slots.Date, intent.slots.Daytime);
  
  var sessionAttributes = {};
  var speechOutput = "";
  
  var showtimes = cineprog.searchByDay(movies, timeSlot.date);
  if (showtimes.length==0) {
      speechOutput = "<speak>Für dieses Datum habe ich keine Informationen gefunden.</speak>";
  } else
      speechOutput = cinespeak.speakMovieScreenings("Morgen läuft:", showtimes);
  var repromptText = "<speak>Du kannst mich nach dem Programm fragen, in dem du 'was läuft morgen abend' sagst.</speak>";
 
  callback(sessionAttributes,
      exports.buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

exports.queryRandomMovie = function(movies, intent, session, callback) {};
exports.queryRecommendMovie = function(movies, intent, session, callback) {};
exports.queryNewMovies = function(movies, intent, session, callback) {};
exports.queryAboutCinema = function(movies, intent, session, callback) {};
exports.queryReservationCinema = function(movies, intent, session, callback) {};

