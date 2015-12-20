var request = require('request');
var promise = require('bluebird');

module.exports = function(key, input) {
  console.log("START VALIDATING USER INPUT.")

  return new promise(function(resolve, reject) {
    validateSteamID(key, input)
    .then(function(steamid) {

      console.log("END VALIDATING USER INPUT.")
      resolve(steamid);

    });
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
      .then(function(resObject) {

        if (resObject.success === 1) {
          console.log("Resolved: " + resObject.steamid);
          resolve(resObject.steamid);
        } else {
          resolve(undefined);
        }

      });

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

    request(apiRequest, function(err, res, body) {
      if (!err && res.statusCode === 200) {
        console.log("...Success.")

        resolve(JSON.parse(body).response);
      }
    });
  });
}

