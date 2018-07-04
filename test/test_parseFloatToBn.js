// vim: sts=2:ts=2:sw=2
/* eslint-env mocha */
var factsigner = require('../index.js');
var web3_utils = require('web3-utils');
var assert = require('assert');

describe('Test parseFloatToBn()', function() {
  describe('parseFloatToBn', function() {

    it('simple tests', function(done) {

      assert.ok(
        factsigner.parseFloatToBn('2.1', 18).eq(
          web3_utils.toBN('0x1d24b2dfac520000') // (10**17) *21
        )
      );

      done();
    });

  });
});
