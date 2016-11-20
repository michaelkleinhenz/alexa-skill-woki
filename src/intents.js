var cineprog = require('./cineprog');
var cinespeak = require('./cinespeak');

exports.buildSpeechletResponse = function(title, output, repromptText, shouldEndSession, cardText, cardImageUrl) {
  var response = {
      outputSpeech: {
        type: 'SSML',
        ssml: output
      },
      reprompt: {
        outputSpeech: {
          type: 'SSML',
          text: repromptText
        }
      },
      shouldEndSession: shouldEndSession
  };
  if (cardText) 
    response.card = {
        "type": "Simple",
        "title": title,
        "content": cardText,
    };
  return response;
}

exports.calculateTimeSlot = function(dateSlot, daytimeSlot) {
  if (!dateSlot.value)
    return { date: new Date(), interval: 24*60*60*1000, dayTime: "" };
  // TODO: add support for week dateslots  
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
  var today = new Date();
  var phrase = "";  
  if (timeSlot.date.getMonth()==today.getMonth() && timeSlot.date.getYear()==today.getYear()) {
    if (timeSlot.date.getDate()==today.getDate())
      phrase += "Heute " + exports.getTimeSpeech(timeSlot.dayTime, false);
    else if (timeSlot.date.getDate()==today.getDate()+1)
      phrase += "Morgen " + exports.getTimeSpeech(timeSlot.dayTime, false);
    else if (timeSlot.date.getDate()==today.getDate()+2)
      phrase += "Übermorgen " + exports.getTimeSpeech(timeSlot.dayTime, false);
    else 
      phrase += "Am " + timeSlot.date.getDate() + ". " + timeSlot.date.getMonth() + ". " + exports.getTimeSpeech(timeSlot.dayTime, true);
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
          "Ende", 
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
