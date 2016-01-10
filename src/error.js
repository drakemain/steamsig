var util = require('util');
var exports = module.exports;

function SteamIDValidationError() {
  Error.captureStackTrace(this, this.constructor);
  this.message = "Could not validate vanity name.";
}

util.inherits(SteamIDValidationError, Error);

exports.SteamIDValidationError = SteamIDValidationError;

function SteamTimeoutError() {
  Error.captureStackTrace(this, this.constructor);
  this.message = "Timed out while waiting for a Steam response."
}

util.inherits(SteamTimeoutError, Error);

exports.SteamTimeoutError = SteamTimeoutError;