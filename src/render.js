var Promise = require('bluebird');
var path  = require('path');
var fs = Promise.promisifyAll(require('fs'));
var request = require('request-promise');
var Canvas = require('canvas');

var Image = Canvas.Image;
var canvas = new Canvas();
var sig = canvas.getContext('2d');

module.exports = function(userInfo) {
  var r = 100, g = 100, b = 100;

  canvas.height = 200; canvas.width = 500;

  fillCanvas('rgb(' +r +',' +g +',' +b +')'); //background
  sig.strokeRect(200, 8, 291, 183);
  drawText(userInfo.personaname, "Helvetica", "20px", 208, 32);

  return placeImageByURL(userInfo.avatarfull, 8, 8, 1)

  .then(placeImageByURL(userInfo.recentGameLogos[0], 209, 133, .5))

  .then(function() {
    return new Promise(function(resolve) {
      var out = fs.createWriteStream(userInfo.sigPath);
      var stream = canvas.pngStream();

      stream.on('data', function(chunk) {
        out.write(chunk);
      });

      stream.on('end', function() {
        console.log('done.');
        resolve(path.resolve(userInfo.sigPath));
      });
    });
  });
};


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
      sig.save()
      var height = img.height * scale;
      var width = img.width * scale;

      sig.drawImage(img, x, y, width, height);

      sig.restore();
    };

    img.src = new Buffer(body, 'binary');
  });
}

function drawText(text, font, size, x, y) {
  var thisFont = size + " " + font;
  console.log(thisFont);
  sig.save();
  sig.font = thisFont;
  sig.fillText(text, x, y);
  sig.restore();
}

// return new Promise(function(resolve, reject) {
//   var out = fs.createWriteStream(userInfo.sigPath);
//   var stream = canvas.pngStream();

//   stream.on('data', function(chunk) {
//     out.write(chunk);
//   });

//   stream.on('end', function() {
//     console.log('done.');
//     resolve(path.resolve(userInfo.sigPath));
//   });
// });