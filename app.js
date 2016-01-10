var path    = require('path');
var fs      = require('fs');
var express = require('express');
var hbars   = require('express-handlebars');
var bparse  = require('body-parser');
var path    = require('path');

var form    = require('./src/form-handler');
var SteamIDValidationError = require('./src/error')

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

//will be more uselfull later...
app.get('/form-handler', function(req, res) {
  res.redirect('/profile/' + req.query.steamid);
});

app.get('/profile/:user', function(req, res) {
  console.log(new Date() + ': /profile/' + req.params.user);

  form.renderProfile(key, req.params.user)

  .then(function(profileImg) {
    res.sendFile(path.resolve(profileImg));
  })

  .catch(SteamIDValidationError, function(err) {
    console.error(err.log);
    res.send(err.message);
  })
  .catch(function(err) {
    console.log("An unhandled error occured.");
    console.error(err);
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
