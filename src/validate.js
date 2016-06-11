var Promise = require('bluebird');
var fs      = require('fs');

var steam         = require('./steam');
var SteamSigError = require('./error');

//checks if input is valid Steam ID, otherwise attempts to check for custom name
exports.steamid = function(input) { 
  if (input.substr(0,7) !== "7656119"
    || input.length !== 17
    || isNaN(input.substr(8,16))) {

    return resolveVanityName(input);

  } else {
    return Promise.resolve(input);
  }
};

//removes slashes and spaces from input
exports.trimUserInput = function(input) {
  if (input) {
    return input
    .replace(/\\/g, '')
    .replace(/\//g, '')
    .trim();
  } else {
    return '';
  }
};

exports.checkFileExists = function(filePath) {
  return new Promise(function(resolve, reject) {
    fs.stat(filePath, function(err, stats) {
      if (!stats) {
        reject(new SteamSigError.FileDNE(filePath));
      } else {
        resolve(filePath);
      }
    });
  });
};

//attemps to get valid Steam ID from a custom name
function resolveVanityName(name) {
  var apiRequest = steam.buildRequest(process.env.STEAM_KEY
    , "ISteamUser/ResolveVanityURL/v0001"
    , name);

  return steam.call(apiRequest)

  .then(function(resolvedRequest) {

    console.log(resolvedRequest);
    if (resolvedRequest.response.steamid) {
      return Promise.resolve(resolvedRequest.response.steamid);
    } else {
      console.log(resolvedRequest.response.message);
      return Promise.reject(new SteamSigError.Validation);
    }
  });
}