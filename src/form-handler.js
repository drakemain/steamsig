"use strict";

var Promise  = require('bluebird');
var request  = require('request');
var path     = require('path');
var fs       = require('fs');

var validate = require('./validate');
var SteamSigError = require('./error');
var imgProcess = require('./image');

var exports = module.exports = {};

exports.renderProfile = function(key, uInput) {
  return validate.steamid(key, uInput)

  .tap(function() {
    console.time("API");
  })

  .then(function(steamid) {
    var URI = buildURI(key, "ISteamUser/GetPlayerSummaries/v0002", steamid);
    return getUserData(URI);
  })

  .then(function(userData) {
    userData.lastAPICall = new Date();
    writeUserData(userData);
    return Promise.resolve(userData);
  })

  .tap(function() {
    console.timeEnd("API");
    console.time("imgProcess");
  })

  .then(imgProcess)

  .tap(function() {
    console.timeEnd("imgProcess");
  })
}

exports.writeUserData = writeUserData;

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

var writeUserData = function(userData) {
  return new Promise(function(resolve, reject) {
    var filePath = path.join('assets', 'profiles', userData.steamid, 'userData.JSON');

    var userDataString = JSON.stringify(userData);

    fs.writeFile(filePath, userDataString, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve()
      }
    })
  })
}