var fs    = require('fs'),
    path  = require('path'),
    gm    = require('gm'),
    Promise = require('bluebird'),
    parseSteam = require("./parser");

module.exports = function (userInfo) {
  return new Promise(function(resolve, reject) {

    getUserDirectory(userInfo.steamid)
    .then(function(userDir) {
      filePath = path.join(userDir, 'sig.png')

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
        .drawText(200, 45, parseSteam.personastate(userInfo.personastate))

        //.drawText(200, 62, timeInfo.dateCreated)
        .drawText(200, 77, timeInfo.age);

      }
      
      img
      .flatten()

      .write(filePath, function(err) {
        if (!err) {resolve(filePath);}
        else {reject(err);}
      });
    });

  });
};

function getUserDirectory(steamid) {
  var userDir = path.join('assets', 'profiles', steamid);

  return new Promise(function (resolve, reject) {
    fs.stat(userDir, function(err, stats) {

      if (!stats) {
        fs.mkdir(userDir, function() {
          resolve(userDir);
        });

      } else {resolve(userDir);}   
    });
  });

}