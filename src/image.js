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
    .flatten()

    .fontSize(16)
    .drawText(200, 44, parseSteam.personastate(userInfo.personastate))

    .write(path.join(userDir, 'profile.png'), function(err) {
      if (!err) {sendFile(path.join(userDir, 'profile.png'));}
      else {console.log(err);}
    });
  });
};

function getUserDirectory(steamid) {
  var userDir = path.join('assets/img/profile/', steamid);

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