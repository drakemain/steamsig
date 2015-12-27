var request = require('request');
var promise = require('bluebird');

module.exports = function(key, input) {
  console.log("START VALIDATING USER INPUT.")
  return new promise(function(resolve, reject) {

    validateSteamID(key, input)
    .then(function(steamid) {

      console.log("END VALIDATING USER INPUT.")
      resolve(steamid);

    })

    .catch(function(err) {reject(err);});

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

        console.log("Resolved: " + steamid);
        resolve(steamid);

      })

      .catch(function(err) {reject(err);});

    } else {
      console.log("Input was a valid Steam ID.")
      resolve(trimmedInput);
    }  
  });
}

function resolveVanityName(key, name) {
  console.log("Input was not a valid Steam ID.");

  var apiRequest = "http://api.steampowered.com/ISteamUser"
    + "/ResolveVanityURL/v0001/?key=" + key + "&vanityurl="
    + name;

  return new promise(function(resolve, reject) {
    console.log("Testing for vanity name...");

    request({uri:apiRequest, timeout:3000}, function(err, res, body) {
      if (!err) {
        var response = JSON.parse(body).response;

        if (response.steamid) {
          console.log("...resolved.");
          resolve(response.steamid);
        } else {
          console.log("...could not resolve.")
          reject("Could not resolve vanity name.");
        }
      }
    })

    .on('error', function(err) {

      if (err.code === "ETIMEDOUT") {
        console.log("...Steam timed out.");
        reject("Steam failed to return response while resolving vanity name.");
      } else {
        reject(err);
      }
    });
  });
}

