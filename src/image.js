var fs    = require('fs'),
    path  = require('path'),
    gm    = require('gm'),
    Promise = require('bluebird'),
    parseSteam = require("./parser.js");

module.exports = function (userInfo, sendFile) {
  getUserDirectory(userInfo.steamid)
  .then(function(userDir) {
    console.log('Processing image...');
    gm()
    .in('-page', '+0+0')
    .in('assets/img/base-gray.png')

    .in('-page', '+8+8')
    .in(userInfo.avatarfull.replace("https", "http"))

    .font("Arial")
    .fontSize(28)
    .drawText(200, 28, userInfo.personaname)

    .fontSize(16)
    .drawText(200, 45, parseSteam.personastate(userInfo.personastate))

    .drawText(200, 62, parseSteam.timecreated(userInfo.timecreated))

    .flatten()

    .write(path.join(userDir, 'profile.png'), function(err) {
      if (!err) {sendFile(path.join(userDir, 'profile.png'));}
      else {console.log(err);}
    });
  });
};

function getUserDirectory(steamid) {
  var userDir = path.join('assets/profiles', steamid);

  return new Promise(function (resolve, reject) {
    fs.stat(userDir, function(err, stats) {

      if (!stats) {
        console.log("A new user has requested a profile.");
        fs.mkdir(userDir, function() {
          console.log(steamid + " now has a directory!\n" + userDir);
          resolve(userDir);
        });

      } else {resolve(userDir);}   
    });
  });
}