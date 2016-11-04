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
  var r = 100, g = 100, b = 100;

  canvas.height = 200; canvas.width = 500;

  fillCanvas('rgb(' +r +',' +g +',' +b +')'); //background
  sig.lineWidth = 1;
  sig.strokeRect(200.5, 8.5, 291, 183);

  drawText(userInfo.personaname, "Helvetica", "20px", 208, 32);
  drawText("User for\n" + parse.timecreated(userInfo.timecreated).age
    , "Helvetica", "14px", 415, 32);
  drawText("steamsig.drakemain.com V0.8.0a", "Arial", "8px", 8, 198);

  writeStatus(userInfo);

  return placeImageByURL(userInfo.avatarfull, 8, 8)

  .then(placeImageByURL(userInfo.recentGameLogos[0], 208, 133, .72))

  .then(placeImageByURL(userInfo.recentGameLogos[1], 350, 133, .72))

  .then(function() {
    return new Promise(function(resolve) {
      var out = fs.createWriteStream(userInfo.sigPath);
      var stream = canvas.pngStream();

      stream.on('data', function(chunk) {
        out.write(chunk);
      });

      stream.on('end', function() {
        console.timeEnd('|>Render');
        resolve(path.resolve(userInfo.sigPath));
      });
    });
  });
};


function writeStatus(userInfo) {
  var status = "";

  if (userInfo.gameid) {
    status = "In-Game";

    if (userInfo.currentGame) {
      status += ": " + userInfo.currentGame;
    }

  } else {
    status = parse.personastate(userInfo.personastate);
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

  return request.get({url: imgURL, encoding: null}, function(err, res, body) {
    if (err) {console.error(err);}

    scale = scale || 1;
    var img = new Image();

    img.onerror = function(error) {
      console.error(error);
    };

    img.onload = function() {
      sig.save();
      sig.imageSmoothingEnabled = true;

      var height = Math.floor(img.height * scale);
      var width = Math.floor(img.width * scale);

      sig.drawImage(img, x, y, width, height);

      sig.restore();
    };

    img.src = new Buffer(body, 'binary');
  });
}

function drawText(text, font, size, x, y) {
  var thisFont = size + " " + font;
  sig.save();
  sig.font = thisFont;
  sig.fillText(text, x, y);
  sig.restore();
}