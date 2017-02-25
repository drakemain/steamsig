require('dotenv').config({path: './config/.env', silent: true});

var path     = require('path');
var express  = require('express');
var hbars    = require('express-handlebars');
var bparse   = require('body-parser');

var profile        = require('./src/profile');
var SteamSigError = require('./src/error');
var init = require('./src/initialize');
var validate = require('./src/validate');

var app = express();
app.use(bparse.json());
app.use(bparse.urlencoded({ extended: true }));
app.engine('handlebars', hbars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

var parsedElements = require('./assets/JSON/elements');

init();
process.env.PORT = process.env.PORT || 3000;
app.listen(process.env.PORT);
console.log("--App started listening on port", process.env.PORT + '.');

app.get('/', function(req, res) {
  if (process.env.STEAM_KEY) {
    res.redirect('/profile');
  } else {
    res.send("No steam key has been set! A steam API Key" +
      " must be set before API calls can be made.");
  }
});

app.get('/profile', function(req, res) {
  res.render('form', {
    title: "Enter Steam ID",
    steamIDInputValue: req.query.steamid,
    elements: parsedElements
  });
});

app.post('/profile', function(req, res) {
  validate.checkForValidID(req.body.steamid)

  .then(profile.update)

  .then(function(steamid) {
    res.redirect('profile/' + steamid);
  })

  .catch(function(err) {
    console.error(err);
  });
});

app.get('/profile/:user', function(req, res) {
  if (validate.steamid(req.params.user)) {
    var steamid = req.params.user;
    var userDir = path.join('assets', 'profiles', steamid);

    validate.checkFileExists(path.join(userDir, 'userData.JSON'))

    .then(function() {
      return profile.update(steamid);
    })

    .then(function() {
      var sigPath = path.join(userDir, 'sig.png');

      var absoluteSigPath = path.resolve(sigPath);

      console.time('|>Send file');
      res.status(200).type('png').sendFile(absoluteSigPath);
      console.timeEnd('|>Send file');
    })

    .catch(SteamSigError.FileDNE, function(err) {
      console.error(err.message);
      console.log('Redirecting to new profile form..');
      res.redirect('/profile?steamid=' + steamid);
    })

    .catch(function(err) {
      console.error(err);
      res.render('error', {
        title: 'Error',
        message: 'Something went wrong. :('
      });
    });
  } else {
    validate.checkForValidID(req.params.user)

    .then(function(steamid) {
      res.redirect('/profile/' + steamid);
    })

    .catch(SteamSigError.Validation, function(err) {
      console.error(err.message);
      res.status(400).render('error', {
        title: 'Validation Error',
        message: err.clientMessage
      });
    });
  }
});

// 404 handler
app.use(function(req, res) {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you requested doesn\'t exist!'
  });
});