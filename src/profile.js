"use strict";

var Promise  = require('bluebird');
var request  = require('request');
var path     = require('path');
var fs       = Promise.promisifyAll(require("fs"));

var validate = require('./validate');
var SteamSigError = require('./error');
var imgProcess = require('./image');
var parseGame = require('./parser').game;
var recentGameLogos = require('./parser').recentGameLogos;

exports.cacheUserData = cacheUserData;
exports.getCachedData = getCachedData;
exports.getUserDirectory = getUserDirectory;
exports.callSteamAPI = callSteamAPI;
exports.buildURI = buildURI;

exports.render = function(uInput) {
  return validate.steamid(uInput)

  .tap(function() {console.time("|>API");})
  //get JSON data from Steam API with Steam ID
  .then(function(steamid) {
    var URI = buildURI(process.env.STEAM_KEY, "ISteamUser/GetPlayerSummaries/v0002", steamid);
    return callSteamAPI(URI)

    .then(function(responseData) {
      return responseData.response.players[0];
    });
  })
  .tap(function() {console.timeEnd("|>API");})

  .then(function(userData) {
    return Promise.join(
      //gather some additional information to append to JSON object
      parseGame(userData.gameid, 'gameName'),
      recentGameLogos(userData.steamid),
      getUserDirectory(userData.steamid),

      //append additional information to JSON object
      function(game, recentGameLogos, userDir) {
        userData.lastAPICall = new Date();
        userData.currentGame = game;
        userData.recentGameLogos = recentGameLogos;
        userData.userDirectory = userDir;
        userData.sigPath = path.join(userDir, "sig.png");
      }
    )

    //cache data and render profile image
    .then(function() {
      cacheUserData(userData);
      return imgProcess(userData);
    });
  });
}

function callSteamAPI(uri) {
  return new Promise(function(resolve, reject) {
    request({uri: uri, timeout:1000}, function(err, res, body) {
      if (!err) {
        var userData = JSON.parse(body);

        resolve(userData);
      }
    })
    .on('error', function(err) {
      if (err.code === "ETIMEDOUT") {
        reject(new SteamSigError.TimeOut(uri));
      } else {
        reject(err);
      }
    });
  });
}

function buildURI(APIkey, method, ID) {
  var URI = "https://api.steampowered.com/"
    + method + "/?key=" + APIkey;

    if (method === "ISteamUser/GetPlayerSummaries/v0002") {
      URI += "&steamids=";
    } else if (method === "IPlayerService/GetRecentlyPlayedGames/v0001") {
      URI += "&steamid=";
    } else if (method === "ISteamUserStats/GetSchemaForGame/v2") {
      URI += "&appid=";
    } 

  URI += ID;

  return URI;
}

function cacheUserData(userData) {
  return new Promise(function(resolve, reject) {
    var filePath = path.join(userData.userDirectory, 'userData.JSON');
    var userDataString = JSON.stringify(userData);

    fs.writeFile(filePath, userDataString, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(userData);
      }
    })
  });
}

function getCachedData(steamid) {
  return getUserDirectory(steamid)

  .then(function(dir) {
    var dataPath = path.join(dir, "userData.JSON");

    return validate.checkFileExists(dataPath);
  })

  .then(function(dataPath) {
    console.log(dataPath);
    return fs.readFileAsync(dataPath, "utf8");
  });
}

function getUserDirectory(steamid) {
  var userDir = path.join('assets', 'profiles', steamid);

  return new Promise(function (resolve) {
    fs.stat(userDir, function(err, stats) {
      if (!stats) {

        fs.mkdir(userDir, function() {
          resolve(userDir);
        });

      } else {resolve(userDir);}   
    });
  });
}