var request = require('request');
var promise = require('bluebird');
var fs      = require('fs');

var exports = module.exports = {};

exports.steamid = function(key, input) {
  return new promise(function(resolve, reject) {

    validateSteamID(key, input)
    .then(function(steamid) {
      resolve(steamid);

    })

    .catch(function(err) {reject(err);});

  });
}

exports.profileExists = function(profileID) {
  var profileDir = path.join('assets/profiles', profileID);

  fs.stat(profileDir, function(err, stats) {
    
    if (stats) {
      return(true);
    } else {
      return(false);
    }

  });
}

function validateSteamID(key, input) {
  var trimmedInput = input
    .replace(/\\/g, '')
    .replace(/\//g, '')
    .trim();

  return new promise(function(resolve, reject) {
    if (trimmedInput.substr(0,7) !== "7656119"
      || trimmedInput.length !== 17
      || isNaN(trimmedInput.substr(8,16))) {

      resolveVanityName(key, trimmedInput)
      .then(function(steamid) {
        resolve(steamid);
      })

      .catch(function(err) {reject(err);});

    } else {
      resolve(trimmedInput);
    }  
  });
}

function resolveVanityName(key, name) {

  var apiRequest = "http://api.steampowered.com/ISteamUser"
    + "/ResolveVanityURL/v0001/?key=" + key + "&vanityurl="
    + name;

  return new promise(function(resolve, reject) {

    request({uri:apiRequest, timeout:3000}, function(err, res, body) {
      if (!err) {
        var response = JSON.parse(body).response;

        if (response.steamid) {
          resolve(response.steamid);
        } else {
          reject("Could not resolve vanity name.");
        }
      }
    })

    .on('error', function(err) {

      if (err.code === "ETIMEDOUT") {
        console.log("Failed to communicate with Steam.");
        reject("Steam failed to return response while resolving vanity name.");
      } else {
        reject(err);
      }
    });
  });
}

function checkProfileExists(profileID) {

}