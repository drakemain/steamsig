var Promise  = require('bluebird');
var path     = require('path');
var fs       = Promise.promisifyAll(require("fs"));

var validate = require('./validate');
var imgProcess = require('./image');
var parseGame = require('./parser').game;
var recentGameLogos = require('./parser').recentGameLogos;
var steam = require('./steam');

exports.cacheUserData = cacheUserData;
exports.getCachedData = getCachedData;
exports.getUserDirectory = getUserDirectory;

exports.render = function(steamid) {
  var steamAPIRequest = steam.buildRequest(process.env.STEAM_KEY
    , "ISteamUser/GetPlayerSummaries/v0002"
    , steamid);

  console.time("|>Get User Data");

  return steam.call(steamAPIRequest)
  .then(function(responseData) {
    console.timeEnd("|>Get User Data");
    return responseData.response.players[0];
  })

  .then(function(userData) {
    return Promise.join(
      //gather some additional information to append to JSON object
      parseGame(userData.gameid, 'gameName'),
      recentGameLogos(userData.steamid),
      getUserDirectory(userData.steamid),

      //append additional information to JSON object
      function(game, recentGameLogos, userDir) {
        userData.lastAPICall = new Date();
        userData.currentGame = game;
        userData.recentGameLogos = recentGameLogos;
        userData.userDirectory = userDir;
        userData.sigPath = path.join(userDir, "sig.png");
      }
    )

    //cache data and render profile image
    .then(function() {
      cacheUserData(userData);
      return imgProcess(userData);
    });
  });
};

function cacheUserData(userData) {
  return new Promise(function(resolve, reject) {
    var filePath = path.join(userData.userDirectory, 'userData.JSON');
    var userDataString = JSON.stringify(userData);

    fs.writeFile(filePath, userDataString, function(err) {
      if (err) {
        reject(err);
      } else {
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