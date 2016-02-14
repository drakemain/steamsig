"use strict";

var path  = require('path'),
    gm    = require('gm'),
    Promise = require('bluebird'),
    parseSteam = require("./parser");

module.exports = function (userInfo) {
  console.time("imgProcess");
  return new Promise(function(resolve, reject) {

    var userDir = userInfo.userDirectory;
    
    var filePath = path.join(userDir, 'sig.png')

    var img = gm()
    .in('-page', '+0+0')
    .in('assets/img/base-gray.png')

    .in('-page', '+8+8')
    .in(userInfo.avatarfull.replace("https", "http"))

    .font("Arial")
    .fontSize(28)
    .drawText(200, 28, userInfo.personaname);

    if (userInfo.communityvisibilitystate !== 3) {
      img
      .in('-page', '+0+0')
      .in('assets/img/confidential.png');

    } else {
      var timeInfo = parseSteam.timecreated(userInfo.timecreated);

      img
      .fontSize(16)
      .drawText(200, 77, timeInfo.age);

      if (userInfo.currentGame) {
        img.drawText(200, 45, "In-Game: " + userInfo.currentGame);
      } else {
        img.drawText(200, 45, parseSteam.personastate(userInfo.personastate));
      }
    }
    
    img
    .flatten()

    .write(filePath, function(err) {
      console.timeEnd("imgProcess");
      if (!err) {resolve(filePath);}
      else {reject(err);}
    });
  });
};