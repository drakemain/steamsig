"use strict";

var path     = require('path');
var express  = require('express');
var hbars    = require('express-handlebars');
var bparse   = require('body-parser');
var path     = require('path');

var profile        = require('./src/profile');
var SteamSigErrors = require('./src/error');
var init = require('./src/initialize');

var app = express();
app.use(bparse.json());
app.use(bparse.urlencoded({ extended: true }));
app.engine('handlebars', hbars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.get('/', function(req, res) {
  if (process.env.STEAM_KEY) {
    console.log(process.env.STEAM_KEY);
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

  profile.render(req.params.user)

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

init()

app.listen(3000);
console.log("--App started listening on port 3000.");