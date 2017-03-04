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

exports.cache = getCache;

exports.refresh = function(steamid) {
  return getCache(steamid)

  .then(function(localCache) {
    if (isExpired(localCache.lastUpdated)) {
      return updateProfile(steamid);
    } else {
      console.log('skip refresh');
    }
  })

  .catch(SteamSigError.FileDNE, function(err) {
    var userDir = this.getDir(steamid);
    var steamCache = path.join(userDir, 'steam.JSON');

    console.log('Caught File DNE', err.filePath);

    if (err.filePath === steamCache) {
      console.log('Creating new local steam cache');
      return newSteamCache(steamid);
    } else {
      throw err;
    }
  });
};

exports.setCanvas = function(canvasData) {
  console.log('[SET CANVAS]');
  // temporary until web form can generate all canvas data
  var dataTemplate = getCanvasData();
  var steamid = canvasData.steamid;
  delete canvasData.steamid;
  if (canvasData.recentGameLogos) {
    // Will be able to build an array
    // Won't be limited to 2
    canvasData.recentGameLogo1 = {'active' : true};
    canvasData.recentGameLogo2 = {'active' : true};
  }
  delete canvasData.recentGameLogos;

  for (var element in canvasData) {
    dataTemplate.elements[element].active = true;
  }

  return getCacheFile(steamid, 'canvas.JSON')

  .then(function(cache) {
    cache = dataTemplate;

    return saveCache(steamid, 'canvas.JSON', cache)

    .then(function() {
      console.log('[/SET CANVAS]');
    });
  })

  .catch(SteamSigError.FileDNE, function() {
    console.log('Creating new Canvas.');
    var newCache = {};
    newCache = dataTemplate;
    return saveCache(steamid, 'canvas.JSON', newCache)  

    .then(function() {
      console.log('[/SET CANVAS]');
    });
  });
};

exports.getDir = getDir = function(steamid) {
  return path.join('assets', 'profiles', steamid);
};

function newSteamCache(steamid) {
  console.log('[NEW STEAM CACHE]');
  return Promise.join(buildSteamCache(steamid), getCacheFile(steamid, 'canvas.JSON'),
    function(newSteamCache, canvasData) {
      var userData = {};
      userData = newSteamCache;
      userData.canvas = canvasData;

      return Promise.join(saveCache(steamid, 'steam.JSON', newSteamCache), draw(userData), 
        function() {console.log('[/NEW STEAM CACHE]');}
      );
    }
  );
}

function updateProfile(steamid) {
  console.log('[UPDATE PROFILE]');

  return Promise.join(getCache(steamid), buildSteamCache(steamid),
    function(localCache, refreshedSteamCache) {
      if (_.isEqual(localCache.steam, refreshedSteamCache.steam)) {
        console.log('No changes to update. Skipping render.');
        return saveCache(steamid, 'steam.JSON', refreshedSteamCache)

        .then(function(){console.log('[/UPDATE PROFILE]');});

      } else {
        console.log('Found changes. Re-rendering profile');

        var newCache = {};
        newCache = refreshedSteamCache;
        newCache.canvas = localCache.canvas;

        return Promise.join(saveCache(steamid, 'steam.JSON', refreshedSteamCache), draw(newCache)
          , function() {

            console.log('[/UPDATE PROFILE]');
            // return saveCache(steamid, 'old.JSON', localCache.steam)

            // .then(saveCache(steamid, 'new.JSON', refreshedSteamCache.steam));
          }
        );
      }
    }
  );
}

function isExpired(lastUpdateDate) {
  var expireThreshhold = 10;
  var lastUpdated = new Date(lastUpdateDate);
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

function buildSteamCache(steamid) {
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

function saveCache(steamid, cacheLabel, data) {
  console.time('|>Cache user data');
  var dataString = JSON.stringify(data);

  return getUserDirectory(steamid)

  .then(function(userDir) {
    var saveLocation = path.join(userDir, cacheLabel);

    return fs.writeFileAsync(saveLocation, dataString)

    .then(function() {
      console.log('SAVE:', saveLocation);
      console.timeEnd('|>Cache user data');
    });
  });  
}

function getCacheFile(steamid, fileName) {
  console.log('GET:', steamid, fileName);

  var pathToCache = path.join('assets', 'profiles', steamid, fileName);

  return validate.checkFileExists(pathToCache)
  
  .then(fs.readFileAsync)

  .then(JSON.parse);
}

function getCache(steamid) {
  return Promise.join(getCacheFile(steamid, 'canvas.JSON')
    , getCacheFile(steamid, 'steam.JSON')
    , function(canvasData, steamData) {
      var cache = {};

      cache.canvas = canvasData;
      cache = steamData;

      return Promise.resolve(cache);
    }
  );
}

function getUserDirectory(steamid) {
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