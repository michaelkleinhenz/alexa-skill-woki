
exports.speakShowing = function(date) {
    if (date)
        return date.getHours() + " Uhr" + (date.getMinutes()===0?"":" "+date.getMinutes());
    else
        return "";
}

exports.speakMovie = function(movie) {
    var speechOutput = "" + movie.title + " ";
    if (movie.showings3D.length==0 && movie.showings.length>0) {
        // only 2d
        speechOutput += "um ";
        for (var j=0; j<movie.showings.length; j++) {
            if (movie.showings.length>1 && j==movie.showings.length-1)
                speechOutput += "und um " + exports.speakShowing(movie.showings[j]);
            else if (movie.showings.length>1 && j==movie.showings.length-2)
                speechOutput += exports.speakShowing(movie.showings[j]) + " ";
            else if (movie.showings.length>1)
                speechOutput += exports.speakShowing(movie.showings[j]) + ", ";
            else
                speechOutput += exports.speakShowing(movie.showings[j]) + " ";
        }
    } else if (movie.showings3D.length>0 && movie.showings.length==0) {
        // only 3d
        speechOutput += "in 3D um ";
        for (var j=0; j<movie.showings3D.length; j++) {
            if (movie.showings3D.length>1 && j==movie.showings3D.length-1)
                speechOutput += "und um " + exports.speakShowing(movie.showings3D[j]);
            else if (movie.showings3D.length>1 && j==movie.showings3D.length-2)
                speechOutput += exports.speakShowing(movie.showings3D[j]) + " ";
            else if (movie.showings3D.length>1)
                speechOutput += exports.speakShowing(movie.showings3D[j]) + ", ";
            else                
                speechOutput += exports.speakShowing(movie.showings3D[j]) + " ";
        }
    } else {
        // both 2d and 3d
        speechOutput += "in 2D um ";
        for (var j=0; j<movie.showings.length; j++) {
            if (movie.showings.length>1 && j==movie.showings.length-1)
                speechOutput += "und um " + exports.speakShowing(movie.showings[j]);
            else if (movie.showings.length>1 && j==movie.showings.length-2)
                speechOutput += exports.speakShowing(movie.showings[j]) + " ";
            else if (movie.showings.length>1)
                speechOutput += exports.speakShowing(movie.showings[j]) + ", ";
            else
                speechOutput += exports.speakShowing(movie.showings[j]) + " ";
        }
        speechOutput += "und in 3D um ";
        for (var j=0; j<movie.showings3D.length; j++) {
            if (movie.showings3D.length>1 && j==movie.showings3D.length-1)
                speechOutput += "und um " + exports.speakShowing(movie.showings3D[j]);
            else if (movie.showings3D.length>1 && j==movie.showings3D.length-2)
                speechOutput += exports.speakShowing(movie.showings3D[j]) + " ";
            else if (movie.showings3D.length>1)
                speechOutput += exports.speakShowing(movie.showings3D[j]) + ", ";
            else                
                speechOutput += exports.speakShowing(movie.showings3D[j]) + " ";
        }
    }
    speechOutput += "<break time='1s'/>";
    return speechOutput;
};

exports.speakMovieScreenings = function(movies) {
    var speechOutput = "<speak>Morgen läuft ";
    for (var i=0; i<movies.length; i++) {
        speechOutput += exports.speakMovie(movies[i]);
    }
    speechOutput += "</speak>";
    console.log(speechOutput);
    return speechOutput;
};
