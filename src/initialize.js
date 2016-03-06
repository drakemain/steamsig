"use strict";

var Promise  = require('bluebird');
var fs       = Promise.promisifyAll(require('fs'));
var readline = require('readline');
var path     = require('path');

module.exports = function(){
  return checkDirExists(path.join('assets', 'profiles'))
  .then(checkDirExists('config'))
  .then(steamKeyCheck)
  .then(function() {
    console.log("Ready.\n")
  });
}

//ensures STEAM_KEY has been set, otherwise prompts for STEAM_KEY
var steamKeyCheck = function() {
  if (!process.env.STEAM_KEY) {
    return makeSteamKey()
    .then(function(key) {
      process.env.STEAM_KEY = key;
      console.log("Your key has been set for this session.");
    });
  }
}

//Prompts user for STEAM_KEY to use for this session
var makeSteamKey = function() {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("...Steam API Key not found!\n" +
    "\n!!You can paste your steam key into the prompt and it will be used for this session only." +
    " To save a key, add 'STEAM_KEY=[KEY]' to /config/.env.\n" + 
    "If you don't have a key, get one at https://steamcommunity.com/dev.");
  rl.setPrompt("Enter your Steam API key:");
  rl.prompt();

  return new Promise(function(resolve) {
    rl.on("line", function(data) {
      data = data.toString();
      data = data.trim();

      resolve(data);
    });
  });
}

var checkDirExists = function(dir) {
  return fs.statAsync(dir).catch(function() {
    fs.mkdir(dir);
  });
}