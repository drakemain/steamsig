"use strict";

var Promise  = require('bluebird');
var request  = require('request');
var path     = require('path');
var fs       = require('fs');

var validate = require('./validate');
var SteamSigError = require('./error');
var imgProcess = require('./image');

exports.renderProfile = function(key, uInput) {
  return validate.steamid(key, uInput)

  .then(function(steamid) {
    var URI = buildURI(key, "ISteamUser/GetPlayerSummaries/v0002", steamid);

    console.time("API");
    var userData = getUserData(URI);
    

    userData.tap(console.time("imgProcess")).then(imgProcess).tap(console.timeEnd("imgProcess"));

    return userData;
  })

  .then(function(userData) {
    return getUserDirectory(userData.steamid)

    .then(function(userDir) {
      userData.lastAPICall = new Date();
      userData.userDirecotry = userDir;
      userData.sigPath = path.join(userDir, "sig.png");
      return cacheUserData(userData);
    })

    .then(function() {
      return Promise.resolve(userData.sigPath)
    });
  })
}

exports.cacheUserData = cacheUserData;

exports.getUserDirectory = getUserDirectory;

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
    var filePath = path.join(userData.userDirecotry, 'userData.JSON');
    console.log(filePath);
    var userDataString = JSON.stringify(userData);

    fs.writeFile(filePath, userDataString, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(userData);
      }
    })
  })
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