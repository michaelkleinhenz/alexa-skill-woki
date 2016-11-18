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
  return { date: date, interval: interval, dayTime: daytimeSlot.value };
}

exports.getTimeSpeech = function(dayTime, addS) {
  switch (dayTime) {
    case "morgen":
    case "morgens":
      return "Morgen" + (addS?"s":"");
    case "mittag":
    case "mittags":
      return "Mittag" + (addS?"s":"");
    case "abend":
    case "abends":
      console.log("fofof");
      return "Abend" + (addS?"s":"");
  }
}

exports.getDateSpeech = function(timeSlot) {
  var today = new Date();
  var phrase = "";  
  if (timeSlot.date.getMonth()==today.getMonth() && timeSlot.date.getYear()==today.getYear()) {
    if (timeSlot.date.getDay()==today.getDay())
      phrase += "Heute " + exports.getTimeSpeech(timeSlot.dayTime, false);
    else if (timeSlot.date.getDay()==today.getDay()+1)
      phrase += "Morgen " + exports.getTimeSpeech(timeSlot.dayTime, false);
    else if (timeSlot.date.getDay()==today.getDay()+2)
      phrase += "Übermorgen " + exports.getTimeSpeech(timeSlot.dayTime, false);
    else 
      phrase += "Am " + timeSlot.date.getDay() + ". " + timeSlot.date.getMonth() + " " + exports.getTimeSpeech(timeSlot.dayTime, true);
  }
  return phrase;
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

  var showtimes = cineprog.searchByDateRange(movies, timeSlot.date, timeSlot.interval);
  if (showtimes.length==0) {
      speechOutput = "<speak>Für dieses Datum habe ich keine Informationen gefunden.</speak>";
  } else
      speechOutput = cinespeak.speakMovieScreenings(exports.getDateSpeech(timeSlot) + " läuft:", showtimes);
  var repromptText = "<speak>Du kannst mich nach dem Programm fragen, in dem du 'was läuft morgen abend' sagst.</speak>";
 
  callback(sessionAttributes,
      exports.buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

exports.queryRandomMovie = function(movies, intent, session, callback) {
  const cardTitle = intent.name;
  const shouldEndSession = true;
  const timeSlot = exports.calculateTimeSlot(intent.slots.Date, intent.slots.Daytime);

  var sessionAttributes = {};
  var speechOutput = "";

  var showtimes = [];
  showtimes.push(cineprog.getRandomMovie(movies, timeSlot.date, timeSlot.interval));

  if (showtimes.length==0) {
      speechOutput = "<speak>Für dieses Datum habe ich keine Informationen gefunden.</speak>";
  } else {
      speechOutput = cinespeak.speakMovieScreenings(
        "Wie wäre es " + exports.getDateSpeech(timeSlot) + " mit", showtimes, ("? " + (showtimes[0].info||"")), false, true
      );
  }
  var repromptText = "<speak>Du kannst mich nach dem Programm fragen, in dem du 'was läuft morgen abend' sagst.</speak>";
 
  callback(sessionAttributes,
      exports.buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
};

exports.queryRecommendMovie = function(movies, intent, session, callback) {
  const cardTitle = intent.name;
  const shouldEndSession = true;
  const timeSlot = exports.calculateTimeSlot(intent.slots.Date, intent.slots.Daytime);

  var sessionAttributes = {};
  var speechOutput = "";

  var showtimes = [];
  showtimes.push(cineprog.getRandomMovie(movies, timeSlot.date, timeSlot.interval));

  if (showtimes.length==0) {
      speechOutput = "<speak>Für dieses Datum habe ich keine Informationen gefunden.</speak>";
  } else {
      speechOutput = cinespeak.speakMovieScreenings(
        "Das Woki empfiehlt: " + exports.getDateSpeech(timeSlot) + " in", showtimes, ("? " + (showtimes[0].info||"")), false, true
      );
  }
  var repromptText = "<speak>Du kannst mich nach dem Programm fragen, in dem du 'was läuft morgen abend' sagst.</speak>";
 
  callback(sessionAttributes,
      exports.buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
};

exports.queryAboutCinema = function(movies, intent, session, callback) {
    callback({}, exports.buildSpeechletResponse("Über das Woki", 
    "<speak>Das Woki ist das beste Kino in Bonn.</speak>", 
    "<speak>Du kannst mich nach dem Programm fragen, in dem du 'was läuft morgen abend' sagst.</speak>", 
    true));
};

exports.queryReservationCinema = function(movies, intent, session, callback) {
  callback({}, exports.buildSpeechletResponse("Reservierung", 
    "<speak>Für eine Reservierung, besuche einfach die Webseite unter www.woki.de!</speak>", 
    "<speak>Du kannst mich nach dem Programm fragen, in dem du 'was läuft morgen abend' sagst.</speak>", 
    true));  
};

exports.queryNewMovies = function(movies, intent, session, callback) {};
