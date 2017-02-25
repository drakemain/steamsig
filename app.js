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

app.use(function(req, res, next) {
  console.log('-');
  next();
});

app.get('/', function(req, res) {
  if (process.env.STEAM_KEY) {
    res.redirect('/profile');
  } else {
    res.send("No steam key has been set! A steam API Key" +
      " must be set before API calls can be made.");
  }
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

    .then(profile.update)

    .then(function(steamid) {
      res.redirect('profile/' + steamid);
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
    });
  }

  
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
      console.log('Sending new profile form..');
      
      var formData = {
        steamid: req.query.steamid,
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
    elements: parsedElements,
    messages: formDataObj.messages
  });
}