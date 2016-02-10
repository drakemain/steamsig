var Promise = require('bluebird');
var fs      = Promise.promisifyAll(require('fs'));
var readline = require('readline');
var path = require('path');

var SteamSigErrors = require('./error');

var steamKeyCheck = function() {
  console.log("Checking for a Steam API Key...");

  var keyFile = path.join('config', 'key.txt');

  fs.stat(keyFile, function(err, stats) {
    if (stats) {
      console.log("..Key found. Fetching..");
      
    }
  })


  fs.exists(keyFile, function(exists) {
    if (exists) {
      console.log("...Key found. Fetching...");

      fs.readFile(keyFile, function(err, data) {
        if (!err) {
          key = data.toString();

          console.log("...Key fetched!\n");
        }
      });

    } else {

      var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      console.log("\n...Steam API Key not found!\nIf you don't have a key, get one at https://steamcommunity.com/dev.");
      rl.setPrompt("Enter your steam API key: ");
      rl.prompt()
      rl.on("line", function(data) {
          data = data.trim();
          fs.mkdir('./config')
          fs.writeFile(keyFile, data, function(err) {
            if (err) {console.log(err);}
            else {console.log("Key has been saved.\n");}
            key = data;
          })
          rl.close();
        })

    }
  })
}

var checkDirectories = function() {
  var dirList = [
    'config',
    path.join('assets, profiles')
  ];

  return new Promise(function(resolve, reject) {
    for (var i in dirList) {
    fs.statAsync(dirList[i])

    .then(function(err, stats) {
      if(!stats) {
        fs.mkdirAsync(dirList[i])
        .then(function() {console.log("Created directory:", dirList[i])});
      }
    });
  }})
}

module.exports = function() {
  checkDirectories()

  /*validate.checkFileExists('config')

  .catch(SteamSigErrors.FileDNE, function() {
    fs.mkdir('config', function(err) {
      if (!err) {
        console.log("Created 'config' directory.");
      }
    });
  });

  validate.CheckFileExists(path.join('assets', 'profiles'))

  .catch(SteamSigErrors.FileDNE, function() {
    fs.mkdir()
  })

  fs.stat('assets/profiles', function(err, stats) {
    if (!stats) {
      fs.mkdir('assets/profiles', function() {
        console.log("Created profiles directory.");
      });
    }
  });*/

  .then(steamKeyCheck);
}
