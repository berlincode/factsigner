// vim: sts=2:ts=2:sw=2
/* eslint-env mocha */
var factsigner = require('../index.js');
var web3_utils = require('web3-utils');
var assert = require('assert');

describe('Test toUnitString()', function() {
  describe('toUnitString', function() {

    it('examples ndigit=2', function(done) {

      assert.equal(
        factsigner.toUnitString(web3_utils.toBN('0x1d24b2dfac520000'), 18, 2), // (10**17) *21
        '2.10'
      );

      assert.equal(
        factsigner.toUnitString(web3_utils.toBN('0x1d24b2dfac520000').neg(), 18, 2), // - (10**17) *21
        '-2.10'
      );

      assert.equal(
        factsigner.toUnitString(web3_utils.toBN('0x1236efcbcbb340000'), 18, 2), // (10**18) *21
        '21.00'
      );

      assert.equal(
        factsigner.toUnitString(web3_utils.toBN('0x1236efcbcbb340000').neg(), 18, 2), // - (10**18) *21
        '-21.00'
      );

      assert.equal(
        factsigner.toUnitString(web3_utils.toBN('0x16345785d8a0000'), 18, 2), // (10**17) *1
        '0.10'
      );

      assert.equal(
        factsigner.toUnitString(web3_utils.toBN('0x16345785d8a0000').neg(), 18, 2), // - (10**17) *1
        '-0.10'
      );

      assert.equal(
        factsigner.toUnitString(web3_utils.toBN('0x2386f26fc10000'), 18, 2), // (10**16) *1
        '0.01'
      );

      assert.equal(
        factsigner.toUnitString(web3_utils.toBN('0x2386f26fc10000').neg(), 18, 2), // - (10**16) *1
        '-0.01'
      );
      done();
    });

    it('examples ndigit=1', function(done) {

      assert.equal(
        factsigner.toUnitString(web3_utils.toBN('0x1d24b2dfac520000'), 18, 1), // (10**17) *21
        '2.1'
      );

      assert.equal(
        factsigner.toUnitString(web3_utils.toBN('0x1d24b2dfac520000').neg(), 18, 1), // - (10**17) *21
        '-2.1'
      );

      assert.equal(
        factsigner.toUnitString(web3_utils.toBN('0x1236efcbcbb340000'), 18, 1), // (10**18) *21
        '21.0'
      );

      assert.equal(
        factsigner.toUnitString(web3_utils.toBN('0x1236efcbcbb340000').neg(), 18, 1), // - (10**18) *21
        '-21.0'
      );

      assert.equal(
        factsigner.toUnitString(web3_utils.toBN('0x16345785d8a0000'), 18, 1), // (10**17) *1
        '0.1'
      );

      assert.equal(
        factsigner.toUnitString(web3_utils.toBN('0x16345785d8a0000').neg(), 18, 1), // - (10**17) *1
        '-0.1'
      );
      done();
    });

    it('examples ndigit=0', function(done) {
      assert.equal(
        factsigner.toUnitString(web3_utils.toBN('0x1236efcbcbb340000'), 18, 0), // (10**18) *21
        '21'
      );

      assert.equal(
        factsigner.toUnitString(web3_utils.toBN('0x1236efcbcbb340000').neg(), 18, 0), // - (10**18) *21
        '-21'
      );

      done();
    });

    it('examples ndigit=-1', function(done) {
      assert.equal(
        factsigner.toUnitString(web3_utils.toBN('0x1158e460913d00000'), 18, -1), // (10**18) *20
        '20'
      );

      assert.equal(
        factsigner.toUnitString(web3_utils.toBN('0x1158e460913d00000').neg(), 18, -1), // - (10**18) *20
        '-20'
      );

      done();
    });
  });
});
