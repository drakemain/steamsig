var Promise  = require('bluebird');
var fs       = Promise.promisifyAll(require('fs'));
var readline = require('readline');
var path     = require('path');

module.exports = function(){
  return checkDirExists(path.join('assets', 'profiles'))
  .then(checkDirExists('config'))
  .then(steamKeyCheck)
  .then(setSteamWaitTime)
  .then(setSteamCacheExpireTime)
  .then(function() {
    console.log("Ready.\n");
  });
};

//ensures STEAM_API_KEY has been set, otherwise prompts for STEAM_API_KEY
function steamKeyCheck() {
  if (!process.env.STEAM_API_KEY) {
    return makeSteamKey()
    .then(function(key) {
      process.env.STEAM_API_KEY = key;
      console.log("Your key has been set for this session.");
    });
  }
}

function setSteamWaitTime() {
  if (!process.env.STEAM_WAIT) {
    process.env.STEAM_WAIT = 6000;
  }

  console.log('Steam API timeout time is', process.env.STEAM_WAIT + 'ms.');
}

function setSteamCacheExpireTime() {
  if (!process.env.STEAM_CACHE_EXPIRE_SECONDS) {
    process.env.STEAM_CACHE_EXPIRE_SECONDS = 30;
  }

  console.log('Steam cache expire time is', process.env.STEAM_CACHE_EXPIRE_SECONDS + 's.');
}

//Prompts user for STEAM_API_KEY to use for this session
function makeSteamKey() {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("...Steam API Key not found!\n" +
    "\n!!You can paste your steam key into the prompt and it will be used for this session only." +
    " To save a key, add 'STEAM_API_KEY=[KEY]' to /config/.env.\n" + 
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

function checkDirExists(dir) {
  return fs.statAsync(dir).catch(function() {
    fs.mkdir(dir);
  });
}