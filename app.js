var promise = require('bluebird');
var fs      = require('fs');
var request = require('request');
var express = require('express');
var hbars   = require('express-handlebars');
var bparse  = require('body-parser');

app = express();
app.use(bparse.json()); 
app.use(bparse.urlencoded({ extended: true })); 
app.engine('handlebars', hbars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

var key;

app.get('/', function(req, res) {
  res.redirect('/steamIDForm');
});

app.get('/steamIDForm', function(req, res) {
  res.render('form', {
    title: "Enter Steam ID",
  })
});

app.get('/form-handler', function(req, res) {
  console.log(req.query.SteamID);
});

app.get('/display', function(req, res) {
  console.log("A user wants data on profile " + req.query.steamid);
  getUserData(buildURI(key, req.query.steamid)).then(function(userInfo) {
    res.render('profileDisplay', {
      title: userInfo.personaname,
      avatar: userInfo.avatarfull,
    })

    console.log("Sent profile information: " + userInfo.personaname + '\n');
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
      var rl = require('readline-sync');

      console.log("...Steam API Key not found!\nIf you don't have a key, get one at https://steamcommunity.com/dev.");

      var newKey = rl.question("Enter your key: ");
      
      fs.writeFile(keyFile, newKey, function(err) {
        if (!err) {
          console.log("Key has been set. Fetching...");

          fs.readFile(keyFile, function(err, data) {
            key = data.toString();

            console.log("Key fetched!");
          })
        }
      })
    }
  })
}

steamKeyCheck();
app.listen(3000);
console.log("App started listening on port 3000.");