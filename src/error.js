var util = require('util');
var exports = module.exports;

//unable to validate user input as steam id
function Validation() {
  Error.captureStackTrace(this, this.constructor);
  this.message = "Could not validate vanity name.";
  this.clientMessage = "This name or ID doesn't seem to be associated with a Steam account.";
}

util.inherits(Validation, Error);

exports.Validation = Validation;

//steam api not responding
function TimeOut(uri) {
  Error.captureStackTrace(this, this.constructor);
  this.uri = uri;
  this.message = "Timed out while waiting for a Steam response.";
  this.clientMessage = "Steam is not currently responding to requests.";
}

util.inherits(TimeOut, Error);

exports.TimeOut = TimeOut;

function FileDNE(filePath) {
  Error.captureStackTrace(this, this.constructor);
  this.filePath = filePath;
  this.message = "Attempted to get file that doesn't exist.";
  this.clientMessage = "You don't seem to have a cached profile yet.";
}

util.inherits(FileDNE, Error);

exports.FileDNE = FileDNE;