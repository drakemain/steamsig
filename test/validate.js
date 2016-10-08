require('dotenv').config({path: './config/.env'});

// var Promise = require('bluebird');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var assert = chai.assert;

var validate = require('../src/validate');

chai.use(chaiAsPromised);

describe("Steam ID Format", function() {
  it("should return true if valid Steam ID format", function() {
    assert(validate.steamid("76561197960419964"));
  });

  it("should return true if format is valid but is not an actual Steam ID", function() {
    assert(validate.steamid("76561191234567890"));
  });

  it("should return false if does not match ID prefix", function() {
    assert(!validate.steamid("12345671234567890"));
  });

  it("should return false if length is less than 17", function() {
    assert(!validate.steamid("7656119123456789"));
  });

  it("should return false if length is greater than 17", function () {
    assert(!validate.steamid("765611912345678900"));
  });
});

describe("trim user input", function() {
  it("should remove trailing spaces from user input", function() {
    var userInput = "Hello World   ";
    var trimmedInput = validate.trimUserInput(userInput);

    return assert.equal(trimmedInput, "Hello World");
  });

  it("should remove leading spaces from user input", function() {
    var userInput = "    Hello World";
    var trimmedInput = validate.trimUserInput(userInput);

    return assert.equal(trimmedInput, "Hello World");
  });

  it("should remove slashes", function() {
    var userInput = "/Hello/World\\";
    var trimmedInput = validate.trimUserInput(userInput);

    return assert.equal(trimmedInput, "HelloWorld");
  });
});