var promise = require('bluebird');
var path    = require('path');
var fs      = require('fs');
var request = require('request');
var express = require('express');
var hbars   = require('express-handlebars');
var bparse  = require('body-parser');
var path    = require('path');

var imgProcess = require('./assets/js/imgProcess.js');
var uInput     = require("./assets/js/userInputValidate.js");

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
  res.render('form', {
    title: "Enter Steam ID",
  })
});

app.get('/form-handler', function(req, res) {
  console.log(req.query.SteamID);
});

app.get('/display', function(req, res) {
  console.log(new Date() + '\n/display: ' + req.query.steamid);

  uInput(key, req.query.steamid)

  .then(function(steamid) {
    var URI = buildURI(key, steamid);
    return getUserData(URI);
    //return steamStub();
  })

  .then(function(userInfo) {
    imgProcess(userInfo, function(file) {
      res.sendFile(path.resolve(file));
      console.log("Sending image to client.\n");
    })
  })

  .catch(function(err) {
    if (err.code === "ETIMEDOUT") {
      res.send("Timed out while trying to communicate with Steam.");
    } else {
      res.send(err);
    }
  });
});

var buildURI = function(APIkey, SteamID) {
  return "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key="
    + APIkey + "&steamids=" + SteamID;
}

var getUserData = function(uri) {
  console.log("Sending request to Steam API. " + uri);

  return new promise(function(resolve, reject) {
    request({uri: uri, timeout:6000}, function(err, res, body) {
      if (!err) {
        console.log(res.statusCode)
        console.log('Response recieved from Steam.')

        var userData = JSON.parse(body);

        resolve(userData.response.players[0]);
      }
    })
    .on('error', function(err) {
      reject(err);
    });
  });
}

var steamKeyCheck = function() {
  console.log("Checking for a Steam API Key...");

  var keyFile = 'config/key.txt';

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

      var readline = require('readline');
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
            if (err) {console.log(err);console.log("TEST");}
            else {console.log("Key has been saved.\n");}
            key = data;
          })
          rl.close();
        })

    }
  })
}

steamKeyCheck();
app.listen(3000);
console.log("App started listening on port 3000.");