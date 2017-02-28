var Promise         = require('bluebird');
var path            = require('path');
var fs              = Promise.promisifyAll(require("fs"));

var validate        = require('./validate');
var draw            = require('./render');
var parseGame       = require('./parser').game;
var recentGameLogos = require('./parser').recentGameLogos;
var steam           = require('./steam');
var SteamSigError   = require('./error');

exports.refresh = function(steamid) {
  console.log('REFRESH');

  return shouldUpdate(steamid)

  .then(function(shouldUpdate) {
    if (shouldUpdate) {
      return update(steamid);
    }
  });
}

exports.setCanvas = function(steamid, canvasData) {
  console.log('SET CANVAS');

  var dataTemplate = getCanvasData();

  for (var element in canvasData) {
    dataTemplate.elements[element].active = true;
  }

  return getCache(steamid, 'canvas.JSON')

  .then(function(cache) {
    cache.canvas = dataTemplate;
    return saveCache(steamid, 'canvas.JSON', cache);
  })

  .catch(SteamSigError.FileDNE, function() {
    var newCache = {};
    newCache.canvas = dataTemplate;

    return saveCache(steamid, 'canvas.JSON', newCache);
  });
}

exports.getDir = getDir = function(steamid) {
  var relativePath = path.join('assets', 'profiles', steamid);

  return path.resolve(relativePath);
}



// function update(steamid) {
//   return Promise.join(getCache(steamid), buildSteamCache(steamid),
//     function(refreshedSteamData, currentCache) {
//       if (currentCache.steam = refreshedSteamData) {
//         console.log('No changes to Steam data. Skipping update');
//       } else {
//         currentCache.steam = refreshedSteamData;
//         return Promise.join(saveCache(steamid, currentCache), draw(currentCache))
//       }
//     }
//   )

//   .catch(SteamSigError.FileDNE, function() {
//     return buildSteamCache(steamid)

//     .then(function(steamData) {
//       return saveCache(steamid, steamData);
//     });
//   });;
// };

function buildSteamCache(steamid) {
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
      recentGameLogos(responseData.steamid),
      getUserDirectory(responseData.steamid),

      function(game, recentGameLogos, userDir) {
        // processed Steam data
          // TODO: parse timecreated
          // TODO: parse personastate
        responseData.steamid.currentGame = game;
        responseData.steamid.recentGameLogos = recentGameLogos;

        // additional user information
        responseData.lastUpdated = new Date();
        responseData.directory = userDir;
        responseData.sigPath = path.join(userDir, "sig.png");

        return responseData;
      }
    );
  });
}

function buildCanvasCache(canvasData) {
  return getCanvasData();
}

exports.shouldUpdate = shouldUpdate = function(steamid) {
  return getCache(steamid, 'steam.JSON')

  .then(function(cache) {
    var lastUpdated = new Date(cache.lastUpdated);
    var currentDate = new Date();
    var secondsSinceProfileUpdate = Math.ceil((currentDate - lastUpdated) / 1000);

    if (secondsSinceProfileUpdate > 30) {
      console.log('Fetching new Steam cache..');

      return buildSteamCache(steamid)

      .then(function(refreshedCache) {
        if (cache.steam && cache.steam === refreshedCache) {
          console.log('No changes. Skipping refresh.');
        } else {
          console.log('Updating local cache..');
          cache.steam = refreshedCache;
          console.log(cache);
          return Promise.join(saveCache(steamid, 'steam.JSON', cache), draw(cache));
        }
      });

    } else {

    console.log('--Skipping profile update.. (' 
      + secondsSinceProfileUpdate + 's since last update)');
    }    
  })

  .catch(SteamSigError.FileDNE, function() {
    return buildSteamCache(steamid)

    .then(function(cache) {
      saveCache(steamid, 'steam.JSON', cache);
    });
  });
}

function saveCache(steamid, fileName, userData) {
  //console.log(userData);

  console.time('|>Cache user data');
  var filePath = path.join(getDir(steamid), fileName);
  var userDataString = JSON.stringify(userData);

  return fs.writeFileAsync(filePath, userDataString).then(function() {
    console.timeEnd('|>Cache user data');
  });
}

function getCache(steamid, fileName) {
  var pathToCache = path.join('assets', 'profiles', steamid, fileName);

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
    "avatar" : {"active" : false, "posX" : 8, "posY" : 8, "size" : "full"},
    "recentGameLogos" : {"active" : false, 
      "logos" : [
        {"posX" : 208, "posY" : 133, "scale" : .72},
        {"posX" : 350, "posY" : 133, "scale" : .72}
      ]
    },

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