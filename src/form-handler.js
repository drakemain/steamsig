var promise = require('bluebird');
var express = require('express');
var request = require('request');

var validate = require('./validate');
var imgProcess = require('./image');

var exports = module.exports = {};

exports.renderProfile = function(key, uInput) {
  return validate.steamid(key, uInput)

  .then(function(steamid) {
    var URI = buildURI(key, steamid);
    return getUserData(URI);
  })

  .then(imgProcess)

  .catch(function(err) {
    console.log(err, '\n');
    return Promise.reject(err);
  });
}

var getUserData = function(uri) {

  return new promise(function(resolve, reject) {
    request({uri: uri, timeout:6000}, function(err, res, body) {
      if (!err) {
        var userData = JSON.parse(body);

        resolve(userData.response.players[0]);
      }
    })
    .on('error', function(err) {
      reject(err);
    });
  });
}

var buildURI = function(APIkey, SteamID) {
  return "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key="
    + APIkey + "&steamids=" + SteamID;
}