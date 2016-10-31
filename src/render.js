var Promise = require('bluebird');
var path  = require('path');
var fs = Promise.promisifyAll(require('fs'));
var request = require('request-promise');
var Canvas = require('canvas');

var Image = Canvas.Image;
var canvas = new Canvas(500, 200);
var ctx = canvas.getContext('2d');

module.exports = function(userInfo) {
  var r = 100, g = 100, b = 100;

  fillCanvas('rgb(' +r +',' +g +',' +b +')'); //background
  ctx.strokeRect(200.5, 8.5, 291, 183);
  drawText(userInfo.personaname, "Helvetica", "20px", 208, 32);

  return placeImageByURL(userInfo.avatarfull, 8, 8).then(function() {
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
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function placeImageByURL(imgURL, x, y) {
  return request.get({url: imgURL, encoding: null}, function(err, res, body) {
    if (err) {console.error(err);}

    var img = new Image();

    img.onerror = function(error) {
      console.error(error);
    };

    img.onload = function() {
      ctx.drawImage(img, x, y);
    };

    img.src = new Buffer(body, 'binary');
  });
}

function drawText(text, font, size, x, y) {
  var thisFont = size + " " + font;
  console.log(thisFont);
  ctx.save();
  ctx.font = thisFont;
  ctx.fillText(text, x, y);
  ctx.restore();
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