var http = require('http');
var rePattern = new RegExp(/<.*>.*<\/.*>/g);
var re2Pattern = new RegExp(/<(.*)>(.*)<\/(.*)>.*/);

exports.parse = function(xmlResponse, callback) {
  xmlResponse = xmlResponse.replace(new RegExp("><", "g"), ">\n<");
  var movies = [];
  var movies3D = [];
  var arrMatches = xmlResponse.match(rePattern);
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
                    if (currentMovie.title.indexOf("(3D)")!=-1) {
                        currentMovie.title = currentMovie.title.replace(" (3D)", "");
                        currentMovie.showings3D = currentMovie.showings;
                        currentMovie.showings = [];
                        movies3D.push(currentMovie);
                    } else
                        movies.push(currentMovie);
                }
                currentMovie={title:content.replace(" - ", ", "),showings:[]};
                break;
            case "datum": currentDate=content; break;
            case "zeit": currentMovie.showings.push(new Date(currentDate + " " + content)); break;
            case "fsk": currentMovie.fsk=content; break;
            case "zusatzinfo":
                if (content) {
                    currentMovie.info=content
                        .replace(",-", "")
                        .replace("(2D)", "in 2D")
                        .replace("(3D)", "in 3D")
                        .replace(/([1-9]+)[,]?([0-9]*)[-]?([^a-zA-Z]+)/g, '$1 Euro $2 ');
                }
                break;
            case "ticketinglink": currentMovie.ticketingLink=content; break;
            case "poster": currentMovie.imageUrl=content; break;
            case "minuten": currentMovie.runtime=parseInt(content||0); break;
            case "programm_ab": currentMovie.programstart=new Date(content);
        }
  }
  var k = movies3D.length;
  while (k--) {
    var thisMovie = movies3D[movies3D.length-1];
    for (var l=0; l<movies.length; l++) {
        if (movies3D.length>0 && movies[l].title==movies3D[movies3D.length-1].title) {
            movies[l].showings3D = thisMovie.showings3D;
            movies3D.splice(movies3D.length-1, 1);
        }
    }
  }
  movies = movies.concat(movies3D);
  callback(null, movies);
}

exports.retrieve = function(cinemaId, isMockXml, callback) {
  if (isMockXml) {
    console.log("Using mock XML response..");
    exports.parse(cinemaId, callback);
  } else
    http.get("http://www.cineprog.de/export/?kino=" + cinemaId).on('response', function (response) {
        var body = "";
        response.on('data', function (chunk) {
            body += chunk;
        });
        response.on('end', function () {
            exports.parse(body, callback);
        });
    });
};

exports.filterShowings = function(movies, date, rangeInMs) {
  if (!rangeInMs)
    rangeInMs = 24*60*60*1000;
  if (!date)
    date = new Date();
  var startDate = date.getTime();
  var endDate = startDate + rangeInMs;
  var result = [];
  //console.log("Filtering start: " + new Date(startDate) + " end: " + new Date(endDate));
  for (var i=0; i<movies.length; i++) {
      var thisMovie = movies[i];
      var movieResult = {
          title:thisMovie.title,
          fsk:thisMovie.fsk,
          info:thisMovie.info,
          ticketingLink:thisMovie.ticketingLink,
          imageUrl:thisMovie.imageUrl,
          runtime:thisMovie.runtime,
          showings:[],
          showings3D:[]
      };
      for (var j=0; j<thisMovie.showings.length; j++) {
          var thisShowing = thisMovie.showings[j];
          if (thisShowing.getDate()==date.getDate() && thisShowing.getMonth()==date.getMonth() && thisShowing.getFullYear()==date.getFullYear())
              if (rangeInMs && thisShowing.getTime()>=startDate && thisShowing.getTime()<endDate) {
                  //console.log("Found 2D showing matching filter: " + thisMovie.title + " at " + thisShowing);
                  //console.log("Data: " + rangeInMs + " - " + thisShowing.getTime() + " - " + startDate);
                  movieResult.showings.push(thisShowing);
              }
      }
      if (thisMovie.showings3D)
        for (j=0; j<thisMovie.showings3D.length; j++) {
            var thisShowing = thisMovie.showings3D[j];
            if (thisShowing.getDate()==date.getDate() && thisShowing.getMonth()==date.getMonth() && thisShowing.getFullYear()==date.getFullYear())
                if (rangeInMs && thisShowing.getTime()>=startDate && thisShowing.getTime()<endDate) {
                    //console.log("Found 3D showing matching filter: " + thisMovie.title + " at " + thisShowing);
                    movieResult.showings3D.push(thisShowing);
                }
        }
      if (movieResult.showings.length>0 || movieResult.showings3D.length>0)
          result.push(movieResult);
  }
  return result;
}

exports.searchByDay = function(movies, date) {
    console.log("Filtering by day: " + date);
    return exports.filterShowings(movies, date);
}

exports.searchByDateRange = function(movies, startDate, rangeInMs) {
    return exports.filterShowings(movies, startDate, rangeInMs);
}

exports.getRandomMovie = function(movies, startDate, rangeInMs) {
    var movies = exports.filterShowings(movies, startDate, rangeInMs);
    return randomMovie = movies[Math.floor(Math.random()*(movies.length-1))];
}
