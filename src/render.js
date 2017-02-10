var Promise = require('bluebird');
var path  = require('path');
var fs = Promise.promisifyAll(require('fs'));
var request = require('request-promise');
var Canvas = require('canvas');

var parse = require('./parser');

var Image = Canvas.Image;
var canvas = new Canvas();
var sig = canvas.getContext('2d');

module.exports = function(userInfo) {
  console.time('|>Render');

  canvas.height = userInfo.canvas.size.height; 
  canvas.width = userInfo.canvas.size.width;

  var canvasColor = userInfo.canvas.bgcolor;
  fillCanvas('rgb(' + canvasColor.r + ',' + canvasColor.g + ',' + canvasColor.b + ')');
  sig.lineWidth = 1;
  sig.strokeRect(200.5, 8.5, 291, 183);

  drawTextElement(userInfo.steam.personaname, userInfo.canvas.elements.personaname);
  drawTextElement("User for\n" + parse.timecreated(userInfo.steam.timecreated).age
    , userInfo.canvas.elements.age);
  drawText("steamsig.drakemain.com V0.8.1a", "Arial", "8px", 8, 198);

  writeStatus(userInfo.steam);

  return Promise.join(
    placeImageByURL(userInfo.steam.avatarfull
      , userInfo.canvas.elements.avatar.posX
      , userInfo.canvas.elements.avatar.posY),
    placeImageByURL(userInfo.steam.recentGameLogos[0]
      , userInfo.canvas.elements.recentGameLogos.logos[0].posX
      , userInfo.canvas.elements.recentGameLogos.logos[0].posY
      , userInfo.canvas.elements.recentGameLogos.logos[0].scale),
    placeImageByURL(userInfo.steam.recentGameLogos[1]
      , userInfo.canvas.elements.recentGameLogos.logos[1].posX
      , userInfo.canvas.elements.recentGameLogos.logos[1].posY
      , userInfo.canvas.elements.recentGameLogos.logos[1].scale),

    function() {
      return new Promise(function(resolve) {
      var out = fs.createWriteStream(userInfo.directory + '/sig.png');
      var imgStream = canvas.pngStream();
      // var buffer = canvas.toBuffer();
      // resolve(buffer);

      imgStream.on('data', function(chunk) {
        out.write(chunk);
      });

      imgStream.on('error', function(err) {
        throw err;
      });

      imgStream.on('end', function() {
        out.end(null, null, function() {
          console.timeEnd('|>Render');
          resolve(userInfo.steam.steamid);
        });
      });
    });
  });
};

function drawTextElement(text, properties) {
  var thisFont = properties.size + " " + properties.font;
  
  sig.save();
  sig.font = thisFont;
  sig.fillText(text, properties.posX, properties.posY);
  sig.restore();
}


function writeStatus(userSteamData) {
  var status = "";

  if (userSteamData.gameid) {
    status = "In-Game";

    if (userSteamData.currentGame) {
      status += ": " + userSteamData.currentGame;
    }

  } else {
    status = parse.personastate(userSteamData.personastate);
  }

  drawText(status, "Helvetica", "14px", 216, 53);
}

function fillCanvas(color) {
  sig.save();
  sig.fillStyle = color;
  sig.fillRect(0, 0, canvas.width, canvas.height);
  sig.restore();
}

function placeImageByURL(imgURL, x, y, scale) {
  if (!imgURL) {return;}

  scale = scale || 1;

  return request.get({url: imgURL, encoding: null})
    .then(function(body) {

    var img = new Image();

    img.onerror = function(error) {
      throw error;
    };

    img.onload = function() {
      sig.save();
      sig.imageSmoothingEnabled = true;

      var height = Math.floor(img.height * scale);
      var width = Math.floor(img.width * scale);

      sig.drawImage(img, x, y, width, height);

      sig.restore();
    };

    img.src = body;
  });
}

function drawText(text, font, size, x, y) {
  var thisFont = size + " " + font;
  
  sig.save();
  sig.font = thisFont;
  sig.fillText(text, x, y);
  sig.restore();
}

// function placeImageByURL(imgURL, x, y, scale) {
//   return request.get({url: imgURL, encoding: null})

//   .then(loadImage)

//   .then(function(image) {
//     sig.save();
//     sig.imageSmoothingEnabled = true;

//     var height = Math.floor(image.height * scale);
//     var width = Math.floor(image.width * scale);

//     console.log('drawing', image);

//     drawText("TEST", "Arial", "8px", x, y);

//     sig.drawImage(image, x, y, width, height);

//     sig.restore();
//   });
// }

// function loadImage(image) {
//   return new Promise(function(resolve, reject) {
//     var img = new Image();

//     img.onerror = reject;

//     img.onload = function() {
//       resolve(img);
//     };

//     img.src = image;
//   });
// }

