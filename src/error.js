"use strict";

var util = require('util');
var exports = module.exports;

function Validation() {
  Error.captureStackTrace(this, this.constructor);
  this.message = "Could not validate vanity name.";
}

util.inherits(Validation, Error);

exports.Validation = Validation;

function TimeOut(uri) {
  Error.captureStackTrace(this, this.constructor);
  this.uri = uri;
  this.message = "Timed out while waiting for a Steam response."
}

util.inherits(TimeOut, Error);

exports.TimeOut = TimeOut;

function FileDNE(filePath) {
  Error.captureStackTrace(this, this.constructor);
  this.filePath = filePath;
  this.message = "Attempted to get file that doesn't exist."
}

util.inherits(FileDNE, Error);

exports.FileDNE = FileDNE;