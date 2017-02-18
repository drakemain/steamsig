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

var parsedElements = require('./assets/JSON/elements');

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

app.get('/steam-id-form/', function(req, res) {
  res.render('form', {
    title: "Enter Steam ID",
    steamIDInputValue: req.query.steamid,
    elements: parsedElements
  });
});

//will be more uselfull later...
app.get('/form-handler', function(req, res) {
  validate.checkForValidID(req.query.steamid)

  .then(profile.render)

  .then(function(steamid) {
    res.redirect('/profile/' + steamid);
  })

  .catch(SteamSigError.Validation, function(err) {
    console.error(err.message);
    res.status(400).render('error', {
      title: 'Validation Error',
      message: err.clientMessage
    });

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
    })
    .catch(SteamSigError.FileDNE, function(err) {
      console.error(err.message);
      
      res.render('error', {
        title: 'Timeout Error',
        message: "Steam isn't responding. " + err.clientMessage
      });
    });
  })
  .catch(function(err) {
    console.error("An unhandled error occured.");
    console.trace(err.stack);

    res.render('error', {
      title: 'Error',
      message: 'You\'ve destroyed everything!'
    });
  });
});

app.get('/profile/:user', function(req, res) {
  if (validate.steamid(req.params.user)) {
    profile.update(req.params.user)

    .then(validate.checkFileExists)

    .then(function(verifiedSigPath) {
      var absoluteSigPath = path.resolve(verifiedSigPath);

      console.time('|>Send file');
      res.status(200).type('png').sendFile(absoluteSigPath);
      console.timeEnd('|>Send file');
    })

    .catch(SteamSigError.FileDNE, function(err) {
      console.error(err.message);
      res.redirect('/steam-id-form/?steamid=' + req.params.user);
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
      console.log('/profile/' + steamid);
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

  console.log('-');
});

app.use(function(req, res) {
  res.status(404).send("Can't find requested page.");
});