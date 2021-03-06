var Promise = require('bluebird');

var steam = require('./steam');

exports.personastate = function(state) {
  var states = [
    "Offline", 
    "Online", 
    "Busy", 
    "Away",
    "Snooze",
    "Looking to trade"
  ];
  
  return states[state];
};

exports.timecreated = function(time) {
  var dateCreated = new Date(time * 1000);

  var year = dateCreated.getFullYear()
  , month = dateCreated.getMonth();

  var age = getAge(dateCreated);

  var dateString = getMonthName(month) + " " + year;
  return {dateCreated: dateString, age: age};
};

//returns information about a game given a game id
exports.game = function(gameID, dataToReturn) {
  var URI = steam.buildRequest("ISteamUserStats/GetSchemaForGame/v2", gameID);

  if (gameID) {
    return steam.call(URI)
    .then(function(gameSchema) {
      if (dataToReturn) {
        return gameSchema.game[dataToReturn];
      } else {
        return gameSchema;
      }
    });
  
  } else {
    return false;
  }
};

//gets urls for imgs from recently played games list
exports.recentGameLogos = function(steamid, count, type) {
  count = count || 2;
  type = type || "logo"; //get logo or smaller icon
  var URI = steam.buildRequest("IPlayerService/GetRecentlyPlayedGames/v0001", steamid);
  URI += "&count=" + count;

  if (type === "logo") {
    type = "img_logo_url";
  } else {
    type = "img_icon_url";
  }
  
  return steam.call(URI)
  .then(function(recentGames) {
    recentGames = recentGames.response;

    if (!recentGames.total_count || recentGames.total_count === 0) {
      return false;
    } else {
      recentGames = recentGames.games;
    }

    var gameLogos = [];

    for (var i = 0; i < recentGames.length; i++) {
      if (recentGames[i][type]) {
        gameLogos[i] = "http://media.steampowered.com/steamcommunity/public" +
        "/images/apps/" + recentGames[i].appid + '/' + recentGames[i][type] +
        ".jpg";
      }
    }

    return Promise.resolve(gameLogos);
  });
};

function getMonthName(month) {
  var months = [
    "January", 
    "February", 
    "March", 
    "April", 
    "May", 
    "June", 
    "July", 
    "August",
    "September", 
    "October", 
    "November",
    "December"
  ];

  return months[month];
}

function getAge(dateCreated) {
  var today = new Date();
  var years = today.getFullYear() - dateCreated.getFullYear();
  var months = today.getMonth() - dateCreated.getMonth();
  var age = '';

  if (months < 0 || (months === 0 && today.getDate() < dateCreated.getDate())) {
    years--;
    months += 11;
  }

  age = years.toString();

  if (months !== 0) {
    age += '.' + (months / 12).toString().substr(2, 2);
  }

  age += " years";

  return age;
}