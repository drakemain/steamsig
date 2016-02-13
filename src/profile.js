"use strict";

var Promise  = require('bluebird');
var request  = require('request');
var path     = require('path');
var fs       = Promise.promisifyAll(require("fs"));

var validate = require('./validate');
var SteamSigError = require('./error');
var imgProcess = require('./image');

exports.cacheUserData = cacheUserData;
exports.getCachedData = getCachedData;
exports.getUserDirectory = getUserDirectory;
exports.getUserData = getUserData;
exports.buildURI = buildURI;

exports.render = function(uInput) {
  return validate.steamid(uInput)

  .tap(function() {console.time("API");})

  .then(function(steamid) {
    var URI = buildURI(process.env.STEAM_KEY, "ISteamUser/GetPlayerSummaries/v0002", steamid);
    return getUserData(URI);
  })

  .tap(function() {console.timeEnd("API");})

  .then(function(userData) {

    return getUserDirectory(userData.steamid)

    .then(function(userDir) {

      userData.lastAPICall = new Date();
      userData.userDirectory = userDir;
      userData.sigPath = path.join(userDir, "sig.png");

      return cacheUserData(userData);
    });
  })
  
  .tap(function() {console.time("imgProcess")})

  .then(imgProcess)

  .tap(function() {console.timeEnd("imgProcess")});
}

var getUserData = function(uri) {

  return new Promise(function(resolve, reject) {
    request({uri: uri, timeout:6000}, function(err, res, body) {
      if (!err) {
        var userData = JSON.parse(body);

        resolve(userData.response.players[0]);
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

var buildURI = function(APIkey, method, SteamID) {
  return "https://api.steampowered.com/"
    + method
    + "/?key=" + APIkey
    + "&steamids=" + SteamID;
}

var cacheUserData = function(userData) {

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

var getCachedData = function(steamid) {
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

var getUserDirectory = function(steamid) {
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