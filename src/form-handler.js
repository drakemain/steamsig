var promise = require('bluebird');
var express = require('express');
var request = require('request');

var validate = require('./validate.js');
var imgProcess = require('./image.js');

var exports = module.exports = {};

exports.renderProfile = function(key, steamid) {
  return new promise(function(resolve, reject) {
  
    validate.steamid(key, steamid)
  
    .then(function(steamid) {
      var URI = buildURI(key, steamid);
      return getUserData(URI);
    })
  
    .then(function(userInfo) {
      resolve(imgProcess(userInfo));
    })
  
    .catch(function(err) {
      reject(err);
    });
  });
};

var getUserData = function(uri) {

  return new promise(function(resolve, reject) {
    request({uri: uri, timeout:6000}, function(err, res, body) {
      if (!err) {
        console.log('Recieved user data from Steam.')
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