"use strict";

var Promise  = require('bluebird');
var request  = require('request');
var path     = require('path');
var fs       = Promise.promisifyAll(require("fs"));

var validate = require('./validate');
var SteamSigError = require('./error');
var imgProcess = require('./image');
var parseGame = require('./parser').game;

exports.cacheUserData = cacheUserData;
exports.getCachedData = getCachedData;
exports.getUserDirectory = getUserDirectory;
exports.callSteamAPI = callSteamAPI;
exports.buildURI = buildURI;

exports.render = function(uInput) {
  return validate.steamid(uInput)
  .tap(function() {console.time("API");})
  .then(function(steamid) {
    var URI = buildURI(process.env.STEAM_KEY, "ISteamUser/GetPlayerSummaries/v0002", steamid);
    return callSteamAPI(URI)

    .then(function(responseData) {
      return responseData.response.players[0];
    });
  })
  .tap(function() {console.timeEnd("API");})

  .then(function(userData) {
    return Promise.join(
      parseGame(userData.gameid, 'gameName'),
      getUserDirectory(userData.steamid),

      function(game, userDir) {
        userData.lastAPICall = new Date();
        userData.userDirectory = userDir;
        userData.sigPath = path.join(userDir, "sig.png");
        userData.currentGame = game;
      }
    )

    .then(function() {
      cacheUserData(userData);
      return imgProcess(userData);
    });
  });
}

function callSteamAPI(uri) {

  return new Promise(function(resolve, reject) {
    request({uri: uri, timeout:6000}, function(err, res, body) {
      if (!err) {
        var userData = JSON.parse(body);

        resolve(userData);
      }
    })
    .on('error', function(err) {
      if (err.code === "ETIMEDOUT") {
        reject(new SteamSigError.TimeOut());
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

    return validate.checkFileExists(dataPath)
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