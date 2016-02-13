"use strict";

var Promise  = require('bluebird');
var fs       = Promise.promisifyAll(require('fs'));
var readline = require('readline');
var path     = require('path');

module.exports = function() {
  return checkDirExists(path.join('assets', 'profiles'))
  .then(steamKeyCheck)
  .then(function(key) {
    process.env.STEAM_KEY = key;
  })

  .catch(function(err) {
    console.error("An unhandled init error occured!");
    console.trace(err);
  });
}

var steamKeyCheck = function() {
  console.log("--Checking for a Steam API Key...")

  var keyFile = path.join('config', 'key.txt');

  var keyCheck = fs.statAsync(keyFile).catch(function(err) {
    if (err) {
      return makeSteamKey(keyFile);
    }
  });

  return Promise.join(checkDirExists('config'), keyCheck).then(function() {
    return fs.readFileAsync(keyFile).then(function(data, err) {
      if (!err) {
        console.log("...key fetched!");
        return Promise.resolve(data.toString());
      } else {
        return Promise.reject(err);
      }
    });
  });
}

var makeSteamKey = function(filePath) {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("...Steam API Key not found!\nIf you don't have a key, get one at https://steamcommunity.com/dev.");
  rl.setPrompt("Enter your Steam API key:");
  rl.prompt();

  return new Promise(function(resolve) {
    rl.on("line", function(data) {
      data = data.trim();

      fs.writeFileAsync(filePath, data)

      .then(function() {
        rl.close();
        console.log("Key has been saved.");
        resolve(data);
      }).catch(function(err) {
        rl.close();
        console.log(err);
      });

    });
  });
}

var checkDirExists = function(dir) {
  return fs.statAsync(dir).catch(function() {
    fs.mkdir(dir);
  })
}