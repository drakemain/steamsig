require('dotenv').config({path: './config/.env', silent: true});

var path          = require('path');
var express       = require('express');
var hbars         = require('express-handlebars');
var bparse        = require('body-parser');

var profile       = require('./src/profile');
var SteamSigError = require('./src/error');
var init          = require('./src/initialize');
var validate      = require('./src/validate');

var app = express();
app.use(bparse.json());
app.use(bparse.urlencoded({ extended: true }));
app.engine('handlebars', hbars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

var parsedProfileElements = require('./assets/JSON/elements');

init();
process.env.PORT = process.env.PORT || 3000;
app.listen(process.env.PORT);
console.log("--App started listening on port", process.env.PORT + '.');

// Don't execute any routes unless there is a steam key.
app.use(function(req, res, next) {
  if (!process.env.STEAM_KEY) {
    res.render('error', {
      message: 'Steamsig is currently down.'
    });
  } else {
    console.log('-');
    next();
  }  
});

app.get('/', function(req, res) {
  res.redirect('/profile');
});

app.get('/profile', function(req, res) {
  var formData = {
    steamid: req.query.steamid
  };

  renderNewProfileForm(res, formData);
});

app.post('/profile', function(req, res) {
  if (!req.body.steamid) {
    console.log('Steam ID field left empty.');

    var formData = {
      messages: [
        "Steam ID or name is required!"
      ]
    };

    renderNewProfileForm(res, formData);

  } else {

    validate.checkForValidID(req.body.steamid)

    .then(function(validSteamID) {
      profile.shouldUpdate(validSteamID)

      .then(function() {
        delete req.body.steamid;
        profile.setCanvas(validSteamID, req.body);
      })

      .then(function() {
        res.redirect('/profile/' + validSteamID);
      });
    })

    .catch(SteamSigError.Validation, function(err) {
      console.error(err.message);
      
      var formData = {
        messages: [
          "\"" + req.body.steamid + "\"" + " doesn't appear to be associated with a steam account."
        ]
      };

      renderNewProfileForm(res, formData);
    })

    .catch(function(err) {
      console.error('Unhandled POST error!');
      console.error(err);

      res.render('error', {
        title: 'Error',
        message: 'Something went wrong. :('
      });
    });
  }
});

app.get('/profile/:user', function(req, res) {
  if (validate.steamid(req.params.user)) {
    var steamid = req.params.user;
    var userDir = profile.getDir(steamid);

    validate.checkFileExists(path.join(userDir, 'userData.JSON'))

    .then(function() {
      return profile.shouldUpdate(steamid);
    })

    .then(function() {
      console.time('|>Send file');
      res.status(200).type('png').sendFile(path.join(userDir, 'sig.png'));
      console.timeEnd('|>Send file');
    })

    .catch(SteamSigError.FileDNE, function(err) {
      console.error(err.message);
      console.log('Sending new profile form..');
      
      var formData = {
        steamid: steamid,
        messages: [
          "You requested a profile which has not yet been created!",
          "Create your profile here before requesting it."
        ]
      };

      renderNewProfileForm(res, formData);
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

      var formData = {
        steamid: req.query.steamid,
        messages: [
          err.clientMessage
        ]
      };

      renderNewProfileForm(res, formData);
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

function renderNewProfileForm(res, formDataObj) {
  res.render('form', {
    title: "Enter Steam ID",
    steamIDInputValue: formDataObj.steamid,
    elements: parsedProfileElements,
    messages: formDataObj.messages
  });
}