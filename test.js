var request = require('request');
var express = require('express');
var hbars = require('express-handlebars');
var key = require('./config/key.js')

app = express();
app.engine('handlebars', hbars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

var user = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=" + key + "&steamids=76561197964880220";

app.get('/', function(req, res) {
  res.send(getUserData());
})

app.get('/disp', function(req, res) {
  request(user, function(err, resp, body) {
    if (!err && res.statusCode === 200) {
      body = JSON.parse(body);
      console.log("Hit!");
      res.send(body.response.players);
    } else {
      console.log(err);
    }
  });
})

var getUserData = function() {
  console.log("Requesting some data");

  var data;

  request(user, function(err, res, body) {
    if (!err && res.statusCode === 200) {
      data = body;
    } else {
      console.log(err);
    }

    console.log(data);
  });
}

app.listen(8080);