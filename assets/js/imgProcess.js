var fs = require('fs'),
    gm = require('gm');

module.exports = function (assets, callback) {
  checkPathExists('assets/img/test');

  gm()
    .in('-page', '+0+0')
    .in(assets.background)
    .in('-page', '+8+8')
    .in(assets.avatar)
    .font("Arial")
    .fontSize(28)
    .drawText(200, 28, assets.name)
    .flatten()
    .write('assets/img/test/test.png', function(err) {
      if (!err) {
        console.log('Merged images');
        callback();
      }
      else {console.log(err);}
  });
}

function checkPathExists(path) {
  fs.access(path, function(err) {
    if (err && err.errno === -4058) {
      fs.mkdir(path)
    }
  })
}