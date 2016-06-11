var chai = require('chai');
var assert = chai.assert;

var validate = require('../src/validate');

describe("steamid", function() {
  it("should return a valid steam id or throw an error for invalid input", function() {
    validate.steamid("76561197960419964").then(function(id) {
      assert.equal("76561197960419964", id);
    });
  });
});