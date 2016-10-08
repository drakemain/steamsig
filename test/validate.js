require('dotenv').config({path: './config/.env'});

var Promise = require('bluebird');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var assert = chai.assert;

var validate = require('../src/validate');

chai.use(chaiAsPromised);

describe("steamid", function() {
  it("should return input steamid if it is valid", function() {
    return validate.steamid("76561197960419964").then(function(id) {
      assert.equal("76561197960419964", id);
    });
  });

  it("should return a validation error for invalid steamids", function() {
    return assert.isRejected(validate.steamid("76561191234567890"));
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

describe("Resolve Vanity Name", function() {
  it("should return a steamid from valid vanity names", function() {
    return Promise.all([
      validate.resolveVanityName("l0mbax").then(function(result) {
        assert.equal("76561197964880220", result);}),
      validate.resolveVanityName("blaenk").then(function(result) {
        assert.equal("76561197974257161", result);})
    ]);
  });

  it("should return a validation error from invalid vanity names", function() {
    return assert.isRejected(validate.resolveVanityName("thisisnotavalidsteamid"));
  });
});