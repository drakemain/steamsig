var Promise  = require('bluebird');
var path     = require('path');
var fs       = Promise.promisifyAll(require("fs"));

var validate = require('./validate');
var draw = require('./render');
var parseGame = require('./parser').game;
var recentGameLogos = require('./parser').recentGameLogos;
var steam = require('./steam');
var SteamSigError = require('./error');

exports.update = function(steamid) {
  return shouldUpdate(steamid)

  .then(function(shouldUpdateProfile) {
    if (shouldUpdateProfile) {
      return buildCache(steamid)

      .then(function(userData) {
        return Promise.join(saveCache(userData), draw(userData));
      });
    }
  })

  .then(function() {
    return steamid;
  });
};

function buildCache(steamid) {
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
    // this 'canvas' data will eventually be retrieved from a web form
    userData.canvas = getCanvasData();
    userData.steam = responseData;

    return Promise.join(
      // resolve game ID into name, if available
      parseGame(userData.steam.gameid, 'gameName'),
      // get array of URLs for logos of recently played games
      recentGameLogos(userData.steam.steamid),
      getUserDirectory(userData.steam.steamid),

      function(game, recentGameLogos, userDir) {
        // processed Steam data
          // TODO: parse timecreated
          // TODO: parse personastate
        userData.steam.currentGame = game;
        userData.steam.recentGameLogos = recentGameLogos;

        // additional user information
        userData.lastUpdated = new Date();
        userData.directory = userDir;
        userData.sigPath = path.join(userDir, "sig.png");

        return userData;
      }
    );
  });
}

function shouldUpdate(steamid) {
  return getCache(steamid)

  .then(function(cache) {
    var lastUpdated = new Date(cache.lastUpdated);
    var currentDate = new Date();
    var secondsSinceProfileUpdate = Math.ceil((currentDate - lastUpdated) / 1000);

    if (secondsSinceProfileUpdate > 30) {
      return true;
    }

    console.log('Skipping profile update.. (' 
      + secondsSinceProfileUpdate + 's since last update)');

    return false;
  })

  .catch(SteamSigError.FileDNE, function() {
    console.log('Profile does not yet exist. Creating..');
    return true;
  });
}

function saveCache(userData) {
  console.time('|>Cache user data');
  var filePath = path.join(userData.directory, 'userData.JSON');
  var userDataString = JSON.stringify(userData);

  return fs.writeFileAsync(filePath, userDataString).then(function() {
    console.timeEnd('|>Cache user data');
  });
}

function getCache(steamid) {
  var pathToCache = path.join('assets', 'profiles', steamid, 'userData.JSON');

  return validate.checkFileExists(pathToCache)
  
  .then(fs.readFileAsync)

  .then(JSON.parse);
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

// temporary until web form is implemented
function getCanvasData() {
  var thisCanvas = {};

  thisCanvas.elements = {
    "avatar" : {"active" : true, "posX" : 8, "posY" : 8, "size" : "full"},
    "recentGameLogos" : {"active" : true, 
      "logos" : [
        {"posX" : 208, "posY" : 133, "scale" : .72},
        {"posX" : 350, "posY" : 133, "scale" : .72}
      ]
    },

    "steamid" : {"active" : false},
    "personaname" : {"active" : true, "posX" : 208, "posY" : 32,
                      "font" : "Helvetica", "size" : "20px"},
    "age" : {"active" : true, "posX" : 415, "posY" : 32,
              "font" : "Helvetica", "size" : "14px"}
  };


  // properties
  thisCanvas.bgcolor = {"r" : 100, "g" : 100, "b" : 100};
  thisCanvas.size = {"height" : 200, "width" : 500};


  return thisCanvas;
}