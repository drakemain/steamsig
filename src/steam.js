var Promise  = require('bluebird');
var request  = require('request');

var SteamSigError = require('./error');

var call = exports.call = function(uri) {
  return new Promise(function(resolve, reject) {
    request({uri: uri, timeout:4000}, function(err, res, body) {
      if (!err) {
        var userData = JSON.parse(body);

        resolve(userData);
      }
    })
    .on('error', function(err) {
      if (err.code === "ETIMEDOUT") {
        reject(new SteamSigError.TimeOut(uri));
      } else {
        reject(err);
      }
    });
  });
};

var buildRequest = exports.buildRequest = function(method, ID) {
  var URI = "https://api.steampowered.com/"
    + method + "/?key=" + process.env.STEAM_KEY;

  if (method === "ISteamUser/GetPlayerSummaries/v0002") {
    URI += "&steamids=";
  } else if (method === "IPlayerService/GetRecentlyPlayedGames/v0001") {
    URI += "&steamid=";
  } else if (method === "ISteamUserStats/GetSchemaForGame/v2") {
    URI += "&appid=";
  } else if (method === "ISteamUser/ResolveVanityURL/v0001") {
    URI += "&vanityurl=";
  }

  URI += ID;

  return URI;
};

exports.resolveVanityName = function(name) {
  console.time('|>Resolve vanity name');
  var apiRequest = buildRequest(
    "ISteamUser/ResolveVanityURL/v0001"
    , name
  );

  return call(apiRequest)

  .then(function(resolvedRequest) {
    console.timeEnd('|>Resolve vanity name');
    if (resolvedRequest.response.steamid) {
      console.log('Resolved', name, 'to', resolvedRequest.response.steamid + '.');
      return resolvedRequest.response.steamid;
    } else {
      console.log('Failed to resolve', name, 'to a valid Steam ID.');
      throw new SteamSigError.Validation;
    }
  });
};