// vim: sts=2:ts=2:sw=2
/* eslint-env mocha */

const factsigner = require('../js/index.js');
const Web3 = require('web3');
const assert = require('assert');

const web3 = new Web3();

describe('Test parseFloatToBn()', function() {
  describe('parseFloatToBn', function() {

    it('simple tests', function(done) {

      assert.ok(
        factsigner.parseFloatToBn('2.1', 18).eq(
          web3.utils.toBN('0x1d24b2dfac520000') // (10**17) *21
        )
      );

      done();
    });

  });
});
