require('dotenv').config({path: './config/.env', silent: true});

var path     = require('path');
var express  = require('express');
var hbars    = require('express-handlebars');
var bparse   = require('body-parser');

var profile        = require('./src/profile');
var SteamSigError = require('./src/error');
var init = require('./src/initialize');
var checkFileExists = require('./src/validate').checkFileExists;
var validate = require('./src/validate');

var app = express();
app.use(bparse.json());
app.use(bparse.urlencoded({ extended: true }));
app.engine('handlebars', hbars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

init();
process.env.PORT = process.env.PORT || 3000;
app.listen(process.env.PORT);
console.log("--App started listening on port", process.env.PORT + '.');

app.get('/', function(req, res) {
  if (process.env.STEAM_KEY) {
    res.redirect('/steam-id-form');
  } else {
    res.send("No steam key has been set! A steam API Key" +
      " must be set before API calls can be made.");
  }
});

app.get('/steam-id-form', function(req, res) {
  res.render('form', {
    title: "Enter Steam ID"
  });
});

//will be more uselfull later...
app.get('/form-handler', function(req, res) {
  var trimmedInput = validate.trimUserInput(req.query.steamid);
  res.redirect('/profile/' + trimmedInput);
});

app.get('/profile/:user', function(req, res) {
  console.time("|>Total");
  console.log('\n', new Date() + ': ' + req.params.user);

  validate.checkForValidID(req.params.user)

  .then(profile.render)
  
  .then(function(profileImg) {
    res.status(200).type('png').sendFile(profileImg);
    console.timeEnd("|>Total");
  })

  .catch(SteamSigError.Validation, function(err) {
    console.error(err.message);
    res.status(400).send("The name or ID doesn't seem to be associated with a Steam account.");
  })
  .catch(SteamSigError.TimeOut, function(err) {
    console.error(err.message);
    res.status(504);

    var idPos = err.uri.search('&steamids=') + 10;
    var steamid = err.uri.substr(idPos, 17);

    return checkFileExists(path.join('assets', 'profiles', steamid, 'sig.png'))
    .then(function(filePath) {
      console.log('Cached profile sent');
      res.sendFile(path.resolve(filePath));
    });
  })
  .catch(SteamSigError.FileDNE, function(err) {
    console.error(err.message);
    res.send("Your profile is not cached and Steam is not responding to requests!");
  })
  .catch(function(err) {
    console.error("An unhandled error occured.");
    console.trace(err.stack);
    
    res.status(500).send("ARG! You've destroyed everything!");
  });
});