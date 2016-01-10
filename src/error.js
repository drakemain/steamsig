var util = require('util');

function SteamIDValidationError(name, msg, log) {
  Error.captureStackTrace(this, this.constructor);
  this.name = name;
  this.log = log;
  this.message = msg;
}

util.inherits(SteamIDValidationError, Error);

module.exports = SteamIDValidationError;
