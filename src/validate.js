"use strict";

var request = require('request');
var Promise = require('bluebird');
var fs      = require('fs');

var SteamSigError = require('./error');

exports.steamid = function(input) {
  var trimmedInput = input
    .replace(/\\/g, '')
    .replace(/\//g, '')
    .trim();
 
  if (trimmedInput.substr(0,7) !== "7656119"
    || trimmedInput.length !== 17
    || isNaN(trimmedInput.substr(8,16))) {

    return resolveVanityName(process.env.STEAM_KEY, trimmedInput)

  } else {
    return Promise.resolve(trimmedInput);
  }
}

exports.checkFileExists = function(filePath) {
  console.log(filePath);

  return new Promise(function(resolve, reject) {
    fs.stat(filePath, function(err, stats) {
      if (!stats) {
        console.log('dne');
        reject(SteamSigError.FileDNE);
      } else {
        console.log('exists');
        resolve(filePath);
      }
    });
  
  })
}

function resolveVanityName(key, name) {
  
  var apiRequest = "http://api.steampowered.com/ISteamUser"
    + "/ResolveVanityURL/v0001/?key=" + key + "&vanityurl="
    + name;

  return new Promise(function(resolve, reject) {

    request({uri:apiRequest, timeout:6000}, function(err, res, body) {
      if (!err) {
        var response = JSON.parse(body).response;

        if (response.steamid) {
          resolve(response.steamid);
        } else {
          reject(new SteamSigError.Validation());
        }
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