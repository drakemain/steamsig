require('dotenv').config({path: './config/.env', silent: true});

var path     = require('path');
var express  = require('express');
var hbars    = require('express-handlebars');
var bparse   = require('body-parser');

var profile        = require('./src/profile');
var SteamSigError = require('./src/error');
var init = require('./src/initialize');
var checkFileExists = require('./src/validate').checkFileExists;
var trimUserInput = require('./src/validate').trimUserInput;

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
    res.redirect('/steamIDForm');
  } else {
    res.send("No steam key has been set! A steam API Key" +
      " must be set before API calls can be made.");
  }
});

app.get('/steamIDForm', function(req, res) {
  res.render('form', {
    title: "Enter Steam ID"
  });
});

//will be more uselfull later...
app.get('/form-handler', function(req, res) {
  var trimmedInput = trimUserInput(req.query.steamid);
  res.redirect('/profile/' + trimmedInput);
});

app.get('/profile/:user', function(req, res) {
  console.log('--Render: ', new Date() + ': /profile/' + req.params.user);

  profile.render(req.params.user)
  .then(function(profileImg) {
    res.status(200).sendFile(profileImg);
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



