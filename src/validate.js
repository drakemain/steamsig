var Promise = require('bluebird');
var fs      = require('fs');

var steam         = require('./steam');
var SteamSigError = require('./error');

exports.checkForValidID = function(idToCheck) {
  var trimmedID = trimUserInput(idToCheck);

  if (steamid(trimmedID)) {
    return Promise.resolve(trimmedID);
  } else {
    return steam.resolveVanityName(trimmedID);
  }
};

//checks if input is valid Steam ID, otherwise attempts to check for custom name
var steamid = exports.steamid = function(input) {
  if (input.substr(0,7) !== "7656119"
    || input.length !== 17
    || isNaN(input.substr(8,16))) {

    return false;

  } else {
    return true;
  }
};

//removes slashes and spaces from input
var trimUserInput = exports.trimUserInput = function(input) {
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