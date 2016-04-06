"use strict";

var path  = require('path'),
    gm    = require('gm'),
    Promise = require('bluebird'),
    parseSteam = require('./parser');

var img, tempFile;

//TODO: VERY MESSY!! Refactor!

module.exports = function (userInfo) {
  console.time("|>imgProcess");
  tempFile = path.join(userInfo.userDirectory, 'temp.png');

  return compositeToBuffer(path.join('assets', 'img', 'base-gray.png'), 
    userInfo.avatarfull.replace('https', 'http'), "+8+8")

  .then(function(buffer) {
    return new Promise(function(resolve, reject) {
      img = gm(buffer)
      .drawLine(200, 8, 491, 8)
      .drawLine(200, 8, 200, 191)
      .drawLine(491, 191, 200, 191)
      .drawLine(491, 191, 491, 8)

      .font("Arial").fontSize(20).drawText(208, 32, userInfo.personaname)

      .fontSize(8).drawText(8,198, "steamsig.drakemain.com V0.7.1a");

      if (userInfo.communityvisibilitystate !== 3) {
        compositeToFile(userInfo.sigPath, path.join('assets', 'img', 'confidential.png'))
        .then(resolve);

      } else {
        img.fontSize(14)

        if (userInfo.gameid) {
          var gameStatus = "In-Game";
          if (userInfo.currentGame) {gameStatus += ": " + userInfo.currentGame;}
          img.drawText(216, 53, gameStatus);
        } else {
          img.drawText(216, 53, parseSteam.personastate(userInfo.personastate));
        }

        img.drawText(415, 32, "User for \n" + parseSteam.timecreated(userInfo.timecreated).age);

        if (userInfo.recentGameLogos) {
          resize(userInfo.recentGameLogos[0], 133).then(function(resizedLogo) {
            return compositeToFile(userInfo.sigPath, resizedLogo, "+209+133");
          }).then(function(newImg) {
            img = gm(newImg);
            return Promise.resolve();
          }).then(function() {
            return resize(userInfo.recentGameLogos[1], 133)
          }).then(function(resizedLogo) {
            resolve(compositeToFile(userInfo.sigPath, resizedLogo, "+350+133"));
          });

        } else {
          img.write(userInfo.sigPath, function(err) {
            if (!err) {resolve(userInfo.sigPath);}
            else {reject(err);}
          })
        }

        
      }
    });
  });
};

function compositeToBuffer(bottomLayer, topLayer, offset) {
  offset = offset || "+0+0";

  return new Promise(function(resolve, reject) {
    gm().command("composite")
    .in("-geometry", offset)
    .in(topLayer)
    .in(bottomLayer)
    .toBuffer('PNG', function(err, buffer) {
      if (!err) {resolve(buffer);}
      else {reject(err);}
    })
  });
}

function compositeToFile(path, topLayer, offset) {
  offset = offset || "+0+0";

  return new Promise(function(resolve, reject) {
    img.write(path, function(err) {
      gm()
      .command('composite')
      .in("-geometry", offset)
      .in(topLayer)
      .in(path)
      .write(path, function(err) {
        if (!err) {resolve(path);}
        else {reject(err);}
      });
    });
  });
}

function resize(img, width) {
  return new Promise(function(resolve) {
    gm(img).resize(width).write(tempFile, function(err) {
      resolve(tempFile);
    });
  });
}
