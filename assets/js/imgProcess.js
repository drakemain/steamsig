var fs    = require('fs'),
    path  = require('path'),
    gm    = require('gm');

module.exports = function (assets, resCallback) {
  console.log(assets.filePath);

  fs.stat(assets.filePath, function(err, stats) {
    console.log(stats);
    if (!stats) {
      fs.mkdir(assets.filePath);
      console.log('Profile path created');
    } 

    gm()
    .in('-page', '+0+0')
    .in(assets.background)
    .in('-page', '+8+8')
    .in(assets.avatar)
    .font("Arial")
    .fontSize(28)
    .drawText(200, 28, assets.name)
    .flatten()
    .write(path.join(assets.filePath, assets.fileName), function(err) {
      if (!err) {
        console.log('Merged images');
        resCallback();
      }
      else {console.log(err);}
    });
  })
}
