var Promise         = require('bluebird');
var path            = require('path');
var fs              = Promise.promisifyAll(require("fs"));

var validate        = require('./validate');
var draw            = require('./render');
var parseGame       = require('./parser').game;
var recentGameLogos = require('./parser').recentGameLogos;
var steam           = require('./steam');
var SteamSigError   = require('./error');
var _               = require('lodash');

var steamid = '';

exports.cache = getCache;

exports.refresh = function(_steamid) {
  steamid = _steamid;

  return getCache()
  
  .then(function(localCache) {
    if (isExpired(localCache.lastUpdated)) {
      return buildSteamCache()

      .then(function(refreshedSteamCache) {
        if (_.isEqual(refreshedSteamCache.steam, localCache.steam)) {
          console.log('Found changes. Rendering profile.');
          return updateSteamProfile(refreshedSteamCache);
        } else {
          console.log('No changes. Skipping profile render.');
        }
      });
    }
  })

  .catch(SteamSigError.FileDNE, function(err) {
    var canvasPath = path.join('assets', 'profiles', steamid, 'canvas.JSON');
    var steamPath = path.join('assets', 'profiles', steamid, 'steam.JSON');
    
    if (err.filePath === canvasPath) {
      console.log('Caught canvas data DNE');

      // canvas data must be set before sig can be drawn.
      throw err;
    } else if (err.filePath === steamPath) {
      console.log('Caught steam data DNE');

      return buildSteamCache()

      .then(updateSteamProfile);
    }
  });
};

exports.setCanvas = function(canvasData) {
  console.log('[SET CANVAS]');

  steamid = canvasData.steamid;

  var compiledCanvasData = compileCanvasData(canvasData);

  return Promise.join(buildSteamCache(), saveCache('canvas.JSON', compiledCanvasData),
    function(newSteamCache) {
      return updateSteamProfile(newSteamCache);
    }
  )

  .then(function() {
    console.log('[/SET CANVAS]');
  });
};

exports.getDir = function(_steamid) {
  return path.join('assets', 'profiles', _steamid);
}; 

function compileCanvasData(data) {
  var dataTemplate = getCanvasData();
  delete data.steamid;
  if (data.recentGameLogos) {
    // Will be able to build an array
    // Won't be limited to 2
    data.recentGameLogo1 = {'active' : true};
    data.recentGameLogo2 = {'active' : true};
  }
  delete data.recentGameLogos;

  for (var element in data) {
    dataTemplate.elements[element].active = true;
  }

  return dataTemplate;
}

function updateSteamProfile(steamData) {
  console.log('[UPDATE PROFILE]');

  return getCacheFile('canvas.JSON')

  .then(function(canvasData) {
    var compiledProfileData = steamData;
    compiledProfileData.canvas = canvasData;

    return Promise.join(
      saveCache('steam.JSON', steamData),
      draw(compiledProfileData)
    );
  });
}

function isExpired(lastUpdateTimestamp) {
  var expireThreshhold = 10;
  var lastUpdated = new Date(lastUpdateTimestamp);
  var currentDate = new Date();
  var secondsSinceProfileUpdate = Math.ceil((currentDate - lastUpdated) / 1000);

  if (secondsSinceProfileUpdate > expireThreshhold) {
    console.log('Local Steam cache expired. (' 
      + secondsSinceProfileUpdate + 's/' + expireThreshhold
      + 's since update.)');

    return true;
  } else {
    console.log('Local Steam Cache has not expired. (' 
      + secondsSinceProfileUpdate + 's/' + expireThreshhold
      + 's since update.)');

    return false;
  }
}

function buildSteamCache() {
  console.log('[BUILD STEAM DATA]');

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
          // TODO: parse timecreated
          // TODO: parse personastate
        userData.steam.currentGame = game;
        userData.steam.recentGameLogo1 = recentGameLogos[0];
        userData.steam.recentGameLogo2 = recentGameLogos[1];

        // additional user information
        userData.lastUpdated = new Date();
        userData.directory = userDir;
        userData.sigPath = path.join(userDir, "sig.png");

        console.log('[/BUILD STEAM DATA]');
        return userData;
      }
    );
  });
}

function saveCache(cacheLabel, data) {
  console.time('|>Cache user data');
  var dataString = JSON.stringify(data);

  return getUserDirectory()

  .then(function(userDir) {
    var saveLocation = path.join(userDir, cacheLabel);

    return fs.writeFileAsync(saveLocation, dataString)

    .then(function() {
      console.log('SAVE:', saveLocation);
      console.timeEnd('|>Cache user data');
    });
  });  
}

function getCacheFile(fileName) {
  console.log('GET:', steamid, fileName);

  var pathToCache = path.join('assets', 'profiles', steamid, fileName);

  return validate.checkFileExists(pathToCache)
  
  .then(fs.readFileAsync)

  .then(JSON.parse);
}

function getCache() {
  console.log('[GET CACHE]');

  return Promise.join(getCacheFile('canvas.JSON')
    , getCacheFile('steam.JSON')
    , function(canvasData, steamData) {
      var cache = {};

      cache = steamData;
      cache.canvas = canvasData;

      return Promise.resolve(cache);
    }
  );
}

function getUserDirectory() {
  var userDir = path.join('assets', 'profiles', steamid);

  return new Promise(function (resolve) {

    fs.stat(userDir, function(err, stats) {
      if (!stats) {
        console.log('Creating new user directory');

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
    "avatar" : {"active" : false, "posX" : 8, "posY" : 8, "size" : "full"},


    "recentGameLogo1" : {"active" : false, "posX" : 208, "posY" : 133, "scale" : .72},
    "recentGameLogo2" : {"active" : false, "posX" : 350, "posY" : 133, "scale" : .72},

    "steamid" : {"active" : false},
    "personaname" : {"active" : false, "posX" : 208, "posY" : 32,
                      "font" : "Helvetica", "size" : "20px"},
    "age" : {"active" : false, "posX" : 415, "posY" : 32,
              "font" : "Helvetica", "size" : "14px"}
  };


  // properties
  thisCanvas.bgcolor = {"r" : 100, "g" : 100, "b" : 100};
  thisCanvas.size = {"height" : 200, "width" : 500};


  return thisCanvas;
}