var promise = require('bluebird');
var path    = require('path');
var fs      = require('fs');
var request = require('request');
var express = require('express');
var hbars   = require('express-handlebars');
var bparse  = require('body-parser');
var path    = require('path');

var imgProcess = require('./assets/js/imgProcess.js');

app = express();
app.use(bparse.json());
app.use(bparse.urlencoded({ extended: true }));
app.engine('handlebars', hbars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

var key;

app.get('/', function(req, res) {
  if (key) {
    res.redirect('/steamIDForm');
  } else {
    res.send("No steam key has been set! A steam API Key" +
      " must be set before API calls can be made.");
  }
});

app.get('/steamIDForm', function(req, res) {
  console.log();

  res.render('form', {
    title: "Enter Steam ID",
  })
});

app.get('/form-handler', function(req, res) {
  console.log(req.query.SteamID);
});

app.get('/display', function(req, res) {
  console.log('Hit on route: /display. ' + req.query.steamid);

  getUserData(buildURI(key, req.query.steamid)).then(function(userInfo) {
    var profileVisibility = false;

    if (userInfo.communityvisibilitystate === 3) {
      profileVisibility = true;
    }

    var assets = {
      fileName: req.query.steamid + '.png',
      filePath: 'assets/img/profile/',
      background: 'assets/img/base-gray.png',
      avatar: userInfo.avatarfull.replace("https", "http"),
      name: userInfo.personaname
    }

    imgProcess(assets, function() {
      res.sendFile(path.resolve(path.join(assets.filePath, assets.fileName)));
      console.log("Sent profile information: " + userInfo.personaname + '\n');
    });
    
  });
  
});

var buildURI = function(APIkey, SteamID) {
  return "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key="
    + APIkey + "&steamids=" + SteamID;
}

var getUserData = function(uri) {
  console.log("Requesting some data");

  return new promise(function(resolve, reject) {
    request(uri, function(err, res, body) {
      if (!err && res.statusCode === 200) {
        console.log('Response recieved from Steam.')
        var userData = JSON.parse(body);
        resolve(userData.response.players[0]);
      } else {
        reject(err);
      }
    });
  });
}

var steamKeyCheck = function() {
  console.log("Checking for a Steam API Key...");

  var keyFile = 'config/key';

  fs.exists(keyFile, function(exists) {
    if (exists) {
      console.log("...Key found. Fetching...");

      fs.readFile(keyFile, function(err, data) {
        if (!err) {
          key = data.toString();

          console.log("...Key fetched!");
        }
      });

    } else {

      var readline = require('readline');
      var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      console.log("\n...Steam API Key not found!\nIf you don't have a key, get one at https://steamcommunity.com/dev.");

      rl.question("Enter your steam API key: ", function(newKey) {
        fs.writeFile(keyFile, newKey, function(err) {
          if (!err) {
            console.log("Key has been set. Fetching...");

            fs.readFile(keyFile, function(err, data) {
              key = data.toString();

              console.log("Key fetched!");
            })
          }
        })
        
      rl.close();
      })
    }
  })
}

steamKeyCheck();
app.listen(3000);
console.log("App started listening on port 3000.");