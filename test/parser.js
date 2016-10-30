var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var assert = chai.assert;

var parse = require('../src/parser');

chai.use(chaiAsPromised);

describe("personastate", function() {
  it("should return 'Offline' when passed 0", function() {
    assert.equal(parse.personastate(0), "Offline");
  });

  it("should return 'Online' when passed 1", function() {
    assert.equal(parse.personastate(1), "Online");
  });

  it("should return 'Busy' when passed 2", function() {
    assert.equal(parse.personastate(2), "Busy");
  });

  it("should return 'Away' when passed 3", function() {
    assert.equal(parse.personastate(3), "Away");
  });

  it("should return 'Snooze' when passed 4", function() {
    assert.equal(parse.personastate(4), "Snooze");
  });

  it("should return 'Looking to trade' when passed 5", function() {
    assert.equal(parse.personastate(5), "Looking to trade");
  });
});