require('dotenv').config({path: './config/.env'});

var Promise = require('bluebird');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var assert = chai.assert;

var steam = require('../src/steam');

chai.use(chaiAsPromised);

describe("resolveVanityName", function() {
  it("should return a steamid from valid vanity names", function() {
    return Promise.all([
      steam.resolveVanityName("l0mbax").then(function(result) {
        assert.equal("76561197964880220", result);}),
      steam.resolveVanityName("blaenk").then(function(result) {
        assert.equal("76561197974257161", result);})
    ]);
  });

  it("should return a validation error from invalid vanity names", function() {
    return assert.isRejected(steam.resolveVanityName("thisisnotavalidsteamid"));
  });
});