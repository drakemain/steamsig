"use strict";

var profile = require('./profile');

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
}

exports.timecreated = function(time) {
  var dateCreated = new Date(time * 1000);

  var year = dateCreated.getFullYear(),
      month = dateCreated.getMonth();

  var age = getAge(dateCreated);

  var dateString = getMonthName(month) + " " + year;
  return {dateCreated: dateString, age: age};
}

exports.game = function(gameID, dataToReturn) {
  var URI = profile.buildURI(process.env.STEAM_KEY, "ISteamUserStats/GetSchemaForGame/v2", gameID);

  if (gameID) {
    return profile.callSteamAPI(URI)
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
}

exports.recentGameLogos = function(steamid, count, logo) {
  count = count || 2;
  logo = logo || true;
  var URI = profile.buildURI(process.env.STEAM_KEY, "IPlayerService/GetRecentlyPlayedGames/v0001", steamid);
  URI += "&count=" + count;
  
  profile.callSteamAPI(URI)
  .then(function(recentGames) {
    recentGames = recentGames.response.games;

    if (recentGames.length === 0) {
      return false;
    }

    var gameLogos = [];

    for (var i = 0; i < recentGames.length; i++) {
      gameLogos[i] = "http://media.steampowered.com/steamcommunity/public" +
        "/images/apps/" + recentGames[i].appid + '/' + recentGames[i].img_logo_url +
        ".jpg";
    }

    return gameLogos;
  })
}

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
  
  if (months < 0 || (months === 0 && today.getDate() < dateCreated.getDate())) {
      years--;
      months += 12;
  }

  var age = years.toString() + '.' + 
    Math.floor((months - today.getMonth()) * 10000 / 12).toString().substr(0, 1) + 
    " years";

  return age;
}