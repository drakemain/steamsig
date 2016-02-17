"use strict";

var path  = require('path'),
    gm    = require('gm'),
    Promise = require('bluebird'),
    parseSteam = require('./parser')

module.exports = function (userInfo) {
  console.time("imgProcess");
  var filePath = path.join(userInfo.userDirectory, 'sig.png');

  return composite(path.join('assets', 'img', 'base-gray.png'), 
    userInfo.avatarfull.replace('https', 'http'))

  .then(function(buffer) {
    return new Promise(function(resolve, reject) {
      var img = gm(buffer)
      .drawLine(200, 8, 491, 8)
      .drawLine(200, 8, 200, 191)
      .drawLine(491, 191, 200, 191)
      .drawLine(491, 191, 491, 8)

      .font("Arial").fontSize(20).drawText(208, 32, userInfo.personaname);

      if (userInfo.communityvisibilitystate !== 3) {
        img
        .in('-page', '+0+0')
        .in('assets/img/confidential.png');

      } else {
        img.fontSize(14)

        if (userInfo.gameid) {
          var gameStatus = "In-Game";
          if (userInfo.currentGame) {gameStatus += ": " + userInfo.currentGame;}
          img.drawText(216, 53, gameStatus);
        } else {
          img.drawText(216, 53, parseSteam.personastate(userInfo.personastate));
        }

        /*img.drawLine(447, 17, 482, 17)
        .drawLine(447, 17, 447, 52)
        .drawLine(482, 52, 447, 52)
        .drawLine(482, 52, 482, 17)*/

        img.drawText(410, 32, parseSteam.timecreated(userInfo.timecreated).age);
      }
      img
      .write(filePath, function(err) {
        console.timeEnd("imgProcess");
        if (!err) {resolve(filePath);}
        else {reject(err);}
      });
    });
  });
};

function composite(bottomLayer, topLayer) {
  return new Promise(function(resolve, reject) {
    gm().command("composite")
    .in("-geometry", "+8+8")
    .in(topLayer)
    .in(bottomLayer)
    .toBuffer('PNG', function(err, buffer) {
      if (!err) {resolve(buffer);}
      else {reject(err);}
    })
  });
}