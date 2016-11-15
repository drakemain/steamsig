var Promise  = require('bluebird');
var path     = require('path');
var fs       = Promise.promisifyAll(require("fs"));

var validate = require('./validate');
var draw = require('./render');
var parseGame = require('./parser').game;
var recentGameLogos = require('./parser').recentGameLogos;
var steam = require('./steam');
var SteamSigError = require('./error');

exports.cacheUserData = cacheUserData;
exports.getCachedData = getCachedData;
exports.getUserDirectory = getUserDirectory;

exports.render = function(steamid) {
  var steamAPIRequest = steam.buildRequest(
    "ISteamUser/GetPlayerSummaries/v0002"
    , steamid
  );

  console.time("|>Get User Data");

  return steam.call(steamAPIRequest)
  .then(function(responseData) {
    console.timeEnd("|>Get User Data");
    
    if (responseData.response.players.length > 0) {
      return responseData.response.players[0];
    } else {
      return Promise.reject(new SteamSigError.Validation());
    }
    
  })

  .then(function(responseData) {
    var userData = {};
    userData.steam = responseData;

    return Promise.join(
      // resolve game ID into name, if available
      parseGame(userData.steam.gameid, 'gameName'),
      // get array of URLs for logos of recently played games
      recentGameLogos(userData.steam.steamid),
      getUserDirectory(userData.steam.steamid),

      function(game, recentGameLogos, userDir) {
        // processed Steam data
        userData.steam.currentGame = game;
        userData.steam.recentGameLogos = recentGameLogos;

        // additional user information
        userData.lastAPICall = new Date();
        userData.directory = userDir;
        userData.sigPath = path.join(userDir, "sig.png");
      }
    )

    //cache data and render profile image
    .then(function() {
      cacheUserData(userData);
      return draw(userData);
    });
  });
};

function cacheUserData(userData) {
  return new Promise(function(resolve, reject) {
    console.time('|>Cache user data');
    var filePath = path.join(userData.directory, 'userData.JSON');
    var userDataString = JSON.stringify(userData);

    fs.writeFile(filePath, userDataString, function(err) {
      if (err) {
        reject(err);
      } else {
        console.timeEnd('|>Cache user data');
        resolve(userData);
      }
    });
  });
}

function getCachedData(steamid) {
  return getUserDirectory(steamid)

  .then(function(dir) {
    var dataPath = path.join(dir, "userData.JSON");

    return validate.checkFileExists(dataPath);
  })

  .then(function(dataPath) {
    console.log(dataPath);
    return fs.readFileAsync(dataPath, "utf8");
  });
}

function getUserDirectory(steamid) {
  var userDir = path.join('assets', 'profiles', steamid);

  return new Promise(function (resolve) {
    fs.stat(userDir, function(err, stats) {
      if (!stats) {

        fs.mkdir(userDir, function() {
          resolve(userDir);
        });

      } else {resolve(userDir);}   
    });
  });
}