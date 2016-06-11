var Promise  = require('bluebird');
var request  = require('request');

var SteamSigError = require('./error');

exports.call = function(uri) {
  return new Promise(function(resolve, reject) {
    request({uri: uri, timeout:1000}, function(err, res, body) {
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

exports.buildRequest = function(APIkey, method, ID) {
  var URI = "https://api.steampowered.com/"
    + method + "/?key=" + APIkey;

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