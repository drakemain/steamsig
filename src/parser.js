"use strict";

var profile = require('./profile');
var Promise = require('bluebird');

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

//returns information about a game given a game id
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

//gets urls for imgs from recently played games list
exports.recentGameLogos = function(steamid, count, type) {
  count = count || 2;
  type = type || "logo"; //get logo or smaller icon
  var URI = profile.buildURI(process.env.STEAM_KEY, "IPlayerService/GetRecentlyPlayedGames/v0001", steamid);
  URI += "&count=" + count;

  if (type === "logo") {
    type = "img_logo_url";
  } else {
    type = "img_icon_url";
  }
  
  return profile.callSteamAPI(URI)
  .then(function(recentGames) {
    recentGames = recentGames.response.games;

    if (recentGames.length === 0) {
      return false;
    }

    var gameLogos = [];

    for (var i = 0; i < recentGames.length; i++) {
      gameLogos[i] = "http://media.steampowered.com/steamcommunity/public" +
        "/images/apps/" + recentGames[i].appid + '/' + recentGames[i][type] +
        ".jpg";
    }

    return Promise.resolve(gameLogos);
  });
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

  var age = years.toString();
  if (months !== 0) {
    age += '.' + 
    Math.floor((months - today.getMonth()) * 10000 / 12).toString().substr(0, 1);
  }
  age += " years";

  return age;
}