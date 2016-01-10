var util = require('util');

function SteamIDValidationError(msg, log) {
  Error.captureStackTrace(this, this.constructor);
  this.log = log;
  this.message = msg;
}

util.inherits(SteamIDValidationError, Error);

module.exports = SteamIDValidationError;
