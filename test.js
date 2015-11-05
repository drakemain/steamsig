var fs      = require('fs');
var request = require('request');
var express = require('express');
var hbars   = require('express-handlebars');

app = express();
app.engine('handlebars', hbars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

var key;
var userData;
var steam = "https://api.steampowered.com"

app.get('/', function(req, res) {
  res.send(getUserData(steam + "/ISteamUser/GetPlayerSummaries/v0002/?key=" + key + "&steamids=76561197964880220"));
})

app.get('/steamIDForm', function(req, res) {

})

app.get('/disp', function(req, res) {
  request(user, function(err, resp, body) {
    if (!err && res.statusCode === 200) {
      body = JSON.parse(body);
      console.log("Hit!");
      res.send(body.response.players);
    } else {
      console.log(err);
    }
  });
})

var getUserData = function(uri) {
  console.log("Requesting some data");

  request(uri, function(err, res, body) {
    if (!err && res.statusCode === 200) {
      userData = JSON.parse(body);
    } else {
      console.log(err);
    }
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
app.listen(8080);