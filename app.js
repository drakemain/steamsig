"use strict";

var path     = require('path');
var fs       = require('fs');
var readline = require('readline');
var express  = require('express');
var hbars    = require('express-handlebars');
var bparse   = require('body-parser');
var path     = require('path');

var profile           = require('./src/profile');
var SteamSigErrors = require('./src/error');

var app = express();
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

//will be more uselfull later...
app.get('/form-handler', function(req, res) {
  res.redirect('/profile/' + req.query.steamid);
});

app.get('/profile/:user', function(req, res) {
  console.log('--Render: ', new Date() + ': /profile/' + req.params.user);

  profile.render(key, req.params.user)

  .then(function(profileImg) {
    res.status(200).sendFile(path.resolve(profileImg));
  })

  .catch(SteamSigErrors.Validation, function(err) {
    console.error(err.message);
    res.status(400).send("The name or ID doesn't seem to be associated with a Steam account.");
  })
  .catch(SteamSigErrors.TimeOut, function(err) {
    console.error(err.message);
    res.status(504).send("Steam is not responding to requests!");
  })
  .catch(function(err) {
    console.error("An unhandled error occured.");
    console.trace(err.stack);
    
    res.status(500).send("ARG! You've destroyed everything!")
  });
});

var steamKeyCheck = function() {
  console.log("Checking for a Steam API Key...");

  var keyFile = path.join('config', 'key.txt');

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

var init = function() {

  fs.stat('assets/profiles', function(err, stats) {
    if (!stats) {
      fs.mkdir('assets/profiles', function() {
        console.log("Created profiles directory.");
      });
    }
  });

  steamKeyCheck();
  app.listen(3000);
  console.log("App started listening on port 3000.");
}

init();
