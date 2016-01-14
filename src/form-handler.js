var Promise = require('bluebird');
var express = require('express');
var request = require('request');

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
    var URI = buildURI(key, steamid);
    return getUserData(URI);
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

var buildURI = function(APIkey, SteamID) {
  return "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key="
    + APIkey + "&steamids=" + SteamID;
}