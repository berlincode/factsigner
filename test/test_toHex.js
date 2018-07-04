// vim: sts=2:ts=2:sw=2
/* eslint-env mocha */
var factsigner = require('../index.js');
var web3_utils = require('web3-utils');
var assert = require('assert');

describe('Test toHex()', function() {
  describe('toHex', function() {

    it('examples', function(done) {

      assert.equal(
        factsigner.toHex(web3_utils.toBN('0xff'), 4),
        '0x000000ff'
      );
      assert.throws(function(){factsigner.toHex(web3_utils.toBN('0xffff'), 1);}, Error, 'number too large');

      done();
    });
  });
});
