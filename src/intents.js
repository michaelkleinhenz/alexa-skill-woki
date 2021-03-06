var cineprog = require('./cineprog');
var cinespeak = require('./cinespeak');
var skill = require('./skill');

exports.buildSpeechletResponse = function(title, output, repromptText, shouldEndSession, cardText, cardImageUrl) {
  var response = {
      outputSpeech: {
        type: "SSML",
        ssml: output
      },
      shouldEndSession: shouldEndSession
  };
  if (typeof repromptText!="undefined" && repromptText!=null)
    response.reprompt = {
        outputSpeech: {
          type: "SSML",
          ssml: repromptText
        }
    };
  if (typeof cardText!="undefined" && cardText!=null) 
    response.card = {
        "type": "Simple",
        "title": title,
        "content": cardText,
    };
  return response;
}

exports.calculateTimeSlot = function(dateSlot, daytimeSlot) {
  var today = skill.isUnderTest()?new Date("2016-11-18"):new Date();
  if (!dateSlot.value)
    return { date: today, interval: 24*60*60*1000, dayTime: "" };
  // TODO: add support for week dateslots "2016-W48"  
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
  if (dayTime)
    switch (dayTime.toLowerCase()) {
      case "morgen":
      case "morgens":
        return "Morgen" + (addS?"s":"");
      case "mittag":
      case "mittags":
        return "Mittag" + (addS?"s":"");
      case "abend":
      case "abends":
        return "Abend" + (addS?"s":"");
    }
  return "";
}

exports.getDateSpeech = function(timeSlot) {
  if (!timeSlot)
    return "";
  var today = skill.isUnderTest()?new Date("2016-11-18"):new Date();
  var phrase = "";  
  if (timeSlot.date.getMonth()==today.getMonth() && timeSlot.date.getYear()==today.getYear()) {
    if (timeSlot.date.getDate()==today.getDate())
      phrase += "Heute " + exports.getTimeSpeech(timeSlot.dayTime, false);
    else if (timeSlot.date.getDate()==today.getDate()+1)
      phrase += "Morgen " + exports.getTimeSpeech(timeSlot.dayTime, false);
    else if (timeSlot.date.getDate()==today.getDate()+2)
      phrase += "Übermorgen " + exports.getTimeSpeech(timeSlot.dayTime, false);
    else {
      var month = "";
      switch (timeSlot.date.getMonth()) {
        case 1: month = "Januar"; break;
        case 2: month = "Februar"; break;
        case 3: month = "März"; break;
        case 4: month = "April"; break;
        case 5: month = "Mai"; break;
        case 6: month = "Juni"; break;
        case 7: month = "Juli"; break;
        case 8: month = "August"; break;
        case 9: month = "September"; break;
        case 10: month = "Oktober"; break;
        case 11: month = "November"; break;
        case 12: month = "Dezember"; break;
      }
      phrase += "Am " + timeSlot.date.getDate() + ". " + month + " " + exports.getTimeSpeech(timeSlot.dayTime, true);
    }
  }
  return phrase;
}

exports.getHelpResponse = function(callback) {
  console.log("Returning help message.");
  // If we wanted to initialize the session to have some attributes we could add those here.
  const sessionAttributes = {};
  const speechOutput = "<speak>Du kannst mich nach dem Kinoprogramm für einen bestimmten Tag fragen, in dem du zum Beispiel 'morgen abend' sagst.</speak>";
  // If the user either does not reply to the welcome message or says something that is not
  // understood, they will be prompted again with this text.
  const repromptText = "<speak>Du kannst mich nach dem Kinoprogramm für einen bestimmten Tag fragen, in dem du zum Beispiel 'morgen abend' sagst.</speak>";
  const shouldEndSession = false;

  callback(sessionAttributes,
      exports.buildSpeechletResponse(null, speechOutput, repromptText, shouldEndSession));
}

exports.getWelcomeResponse = function(callback) {
  console.log("Returning welcome message.");
  // If we wanted to initialize the session to have some attributes we could add those here.
  const sessionAttributes = {};
  const cardTitle = "Wilkommen";
  const speechOutput = "<speak>Willkommen zum Kinoprogramm des Woki Kinos in Bonn. Für wann möchtest du das Kinoprogramm wissen?</speak>";
  // If the user either does not reply to the welcome message or says something that is not
  // understood, they will be prompted again with this text.
  const repromptText = "<speak>Du kannst mich nach dem Kinoprogramm für einen bestimmten Tag fragen, in dem du zum Beispiel 'morgen abend' sagst.</speak>";
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
  const shouldEndSession = false;
  const timeSlot = exports.calculateTimeSlot(intent.slots.Date, intent.slots.Daytime);

  var speechOutput = "";

  var showtimes = [];

  showtimes.push(cineprog.getRandomMovie(movies, timeSlot.date, timeSlot.interval));
  var sessionAttributes = { movie: showtimes[0], context: intent.name};

  if (showtimes.length==0) {
      speechOutput = "<speak>Im Moment habe ich leider keine Vorschläge. Bitte versuche es später noch einmal.</speak>";
  } else {
      speechOutput = cinespeak.speakMovieScreenings(
        "Wie wäre es " + exports.getDateSpeech(timeSlot) + " mit", 
        showtimes, 
        ("? " + (showtimes[0].info?showtimes[0].info:"") + " Möchtest du eine Erinnerung auf dein Smartphone erhalten?"), 
        false, true
      );
  }
  var repromptText = "<speak>Wenn du eine Erinnerung auf dein Smartphone erhalten möchtest, sag 'Ja', ansonsten 'Nein' oder 'Abbrechen'.</speak>";
 
  callback(sessionAttributes,
      exports.buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
};

exports.queryRecommendMovie = function(movies, intent, session, callback) {
  const cardTitle = intent.name;
  const shouldEndSession = false;
  const timeSlot = exports.calculateTimeSlot(intent.slots.Date, intent.slots.Daytime);

  var speechOutput = "";

  var showtimes = [];
  showtimes.push(cineprog.getRandomMovie(movies, timeSlot.date, timeSlot.interval));
  var sessionAttributes = { movie: showtimes[0], context: intent.name};

  if (showtimes.length==0) {
      speechOutput = "<speak>Für dieses Datum habe ich keine Empfehlungen gefunden.</speak>";
  } else {
      speechOutput = cinespeak.speakMovieScreenings(
        "Das Woki empfiehlt: " + exports.getDateSpeech(timeSlot) + (timeSlot.date?" in":""), 
        showtimes, ("? " + (showtimes[0].info||"") + " Möchtest du eine Erinnerung auf dein Smartphone erhalten?"), 
        false, true
      );
  }
  var repromptText = "<speak>Wenn du eine Erinnerung auf dein Smartphone erhalten möchtest, sag 'Ja', ansonsten 'Nein' oder 'Abbrechen'.</speak>";
 
  callback(sessionAttributes,
      exports.buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
};

exports.queryYes = function(movies, intent, session, callback) {
    var priorIntent = session.attributes.context;
    var priorMovie = session.attributes.movie;
    if (priorIntent==="RecommendMovie") {
        callback({}, exports.buildSpeechletResponse(
          "\"" + priorMovie.title + "\" im Woki", 
          "<speak>Ok, du kannst die Erinnerung an den Film in der Alexa App ansehen.</speak>", 
          "<speak>Du kannst mich nach dem Programm fragen, in dem du 'was läuft morgen abend' sagst.</speak>", 
          true,
          cinespeak.createCardText(priorMovie),
          priorMovie.imageUrl));
    } else if (priorIntent==="RandomMovie") {
        callback({}, exports.buildSpeechletResponse(
          "\"" + priorMovie.title + "\" im Woki", 
          "<speak>Ok, du kannst die Erinnerung an den Film in der Alexa App ansehen.</speak>", 
          "<speak>Du kannst mich nach dem Programm fragen, in dem du 'was läuft morgen abend' sagst.</speak>", 
          true,
          cinespeak.createCardText(priorMovie),
          priorMovie.imageUrl));
    } else
        callback({}, exports.buildSpeechletResponse(
          "Fehler", 
          "<speak>Ich weiss nicht, was ich tun soll.</speak>", 
          "<speak>Du kannst mich nach dem Programm fragen, in dem du 'was läuft morgen abend' sagst.</speak>", 
          true));  
}

exports.queryNo = function(movies, intent, session, callback) {
    callback({}, exports.buildSpeechletResponse("Ende", 
      "<speak>Ok.</speak>", 
      "<speak>Du kannst mich nach dem Programm fragen, in dem du 'was läuft morgen abend' sagst.</speak>", 
     true));
}

exports.queryAboutCinema = function(movies, intent, session, callback) {
    callback({}, exports.buildSpeechletResponse("Über das Woki", 
    "<speak>Das Woki befindet sich in Bonn am Bertha-von-Suttner-Platz Eins. Mit der Stadtbahn einfach an der Station 'Bertha-von-Suttner-Platz' aussteigen. Das Kino befindet sich direkt gegenüber.</speak>", 
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
