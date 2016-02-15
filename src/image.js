"use strict";

var path  = require('path'),
    gm    = require('gm'),
    Promise = require('bluebird'),
    parseSteam = require("./parser");

module.exports = function (userInfo) {
  console.time("imgProcess");
  var filePath = path.join(userInfo.userDirectory, 'sig.png')

  return new Promise(function(resolve, reject) {      
    var img = gm()
    .in('-page', '+0+0')
    .in(path.join('assets', 'img', 'base-gray.png'))

    .in('-page', '+8+8')
    .in(userInfo.avatarfull.replace("https", "http"))

    .flatten()

    .drawLine(200, 8, 491, 8)
    .drawLine(200, 8, 200, 191)
    .drawLine(491, 191, 200, 191)
    .drawLine(491, 191, 491, 8)

    .font("Arial").fontSize(28).drawText(208, 34, userInfo.personaname);

    if (userInfo.communityvisibilitystate !== 3) {
      img
      .in('-page', '+0+0')
      .in('assets/img/confidential.png');

    } else {
      img.fontSize(16)

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

      img.drawText(410, 29, parseSteam.timecreated(userInfo.timecreated).age);
    }

    img.write(filePath, function(err) {
      console.timeEnd("imgProcess");
      if (!err) {resolve(filePath);}
      else {reject(err);}
    });
  });
};