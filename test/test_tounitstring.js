// vim: sts=2:ts=2:sw=2
/* eslint-env mocha */

const factsigner = require('../js/index.js');
const Web3 = require('web3');
const assert = require('assert');
const web3 = new Web3();

describe('Test toUnitString()', function() {
  describe('toUnitString', function() {

    it('examples ndigit=2', function(done) {

      assert.equal(
        factsigner.toUnitString(web3.utils.toBN('0x1d24b2dfac520000'), 18, 2), // (10**17) *21
        '2.10'
      );

      assert.equal(
        factsigner.toUnitString(web3.utils.toBN('0x1d24b2dfac520000').neg(), 18, 2), // - (10**17) *21
        '-2.10'
      );

      assert.equal(
        factsigner.toUnitString(web3.utils.toBN('0x1236efcbcbb340000'), 18, 2), // (10**18) *21
        '21.00'
      );

      assert.equal(
        factsigner.toUnitString(web3.utils.toBN('0x1236efcbcbb340000').neg(), 18, 2), // - (10**18) *21
        '-21.00'
      );

      assert.equal(
        factsigner.toUnitString(web3.utils.toBN('0x16345785d8a0000'), 18, 2), // (10**17) *1
        '0.10'
      );

      assert.equal(
        factsigner.toUnitString(web3.utils.toBN('0x16345785d8a0000').neg(), 18, 2), // - (10**17) *1
        '-0.10'
      );

      assert.equal(
        factsigner.toUnitString(web3.utils.toBN('0x2386f26fc10000'), 18, 2), // (10**16) *1
        '0.01'
      );

      assert.equal(
        factsigner.toUnitString(web3.utils.toBN('0x2386f26fc10000').neg(), 18, 2), // - (10**16) *1
        '-0.01'
      );

      assert.equal( // no flooring/rounding/ceiling - just stripping digits: 0.018 -> 0.01
        factsigner.toUnitString(web3.utils.toBN('0x3ff2e795f50000'), 18, 2), // (10**15) *18
        '0.01'
      );

      assert.equal( // no flooring/rounding/ceiling - just stripping digits: -0.018 -> -0.01
        factsigner.toUnitString(web3.utils.toBN('0x3ff2e795f50000').neg(), 18, 2), // - (10**15) *18
        '-0.01'
      );
      //console.log(factsigner.toUnitString(web3.utils.toBN('0x0').neg(), 18, 2)); // - (10**15) *18
      done();
    });

    it('examples ndigit=1', function(done) {

      assert.equal(
        factsigner.toUnitString(web3.utils.toBN('0x1d24b2dfac520000'), 18, 1), // (10**17) *21
        '2.1'
      );

      assert.equal(
        factsigner.toUnitString(web3.utils.toBN('0x1d24b2dfac520000').neg(), 18, 1), // - (10**17) *21
        '-2.1'
      );

      assert.equal(
        factsigner.toUnitString(web3.utils.toBN('0x1236efcbcbb340000'), 18, 1), // (10**18) *21
        '21.0'
      );

      assert.equal(
        factsigner.toUnitString(web3.utils.toBN('0x1236efcbcbb340000').neg(), 18, 1), // - (10**18) *21
        '-21.0'
      );

      assert.equal(
        factsigner.toUnitString(web3.utils.toBN('0x16345785d8a0000'), 18, 1), // (10**17) *1
        '0.1'
      );

      assert.equal(
        factsigner.toUnitString(web3.utils.toBN('0x16345785d8a0000').neg(), 18, 1), // - (10**17) *1
        '-0.1'
      );

      assert.equal( // no flooring/rounding/ceiling - just stripping digits: 0.18 -> 0.1
        factsigner.toUnitString(web3.utils.toBN('0x27f7d0bdb920000'), 18, 1), // (10**16) *18
        '0.1'
      );

      assert.equal( // no flooring/rounding/ceiling - just stripping digits: -0.18 -> -0.1
        factsigner.toUnitString(web3.utils.toBN('0x27f7d0bdb920000').neg(), 18, 1), // - (10**16) *18
        '-0.1'
      );
      done();
    });

    it('examples ndigit=0', function(done) {
      assert.equal(
        factsigner.toUnitString(web3.utils.toBN('0x1236efcbcbb340000'), 18, 0), // (10**18) *21
        '21'
      );

      assert.equal(
        factsigner.toUnitString(web3.utils.toBN('0x1236efcbcbb340000').neg(), 18, 0), // - (10**18) *21
        '-21'
      );

      assert.equal( // no flooring/rounding/ceiling - just stripping digits: 21.8 -> 21
        factsigner.toUnitString(web3.utils.toBN('0x12e89287fa7840000'), 18, 0), // (10**17) *218
        '21'
      );

      assert.equal( // no flooring/rounding/ceiling - just stripping digits -21.8 -> -21
        factsigner.toUnitString(web3.utils.toBN('0x12e89287fa7840000').neg(), 18, 0), // - (10**17) *218
        '-21'
      );

      done();
    });

    it('examples ndigit=-1', function(done) {
      assert.equal(
        factsigner.toUnitString(web3.utils.toBN('0x1158e460913d00000'), 18, -1), // (10**18) *20
        '20'
      );

      assert.equal(
        factsigner.toUnitString(web3.utils.toBN('0x1158e460913d00000').neg(), 18, -1), // - (10**18) *20
        '-20'
      );

      // no flooring/rounding/ceiling - just stripping digits 28 -> 20
      assert.equal(
        factsigner.toUnitString(web3.utils.toBN('0x18493fba64ef00000'), 18, -1), // (10**18) *28
        '20'
      );

      // no flooring/rounding/ceiling - just stripping digits -28 -> -20
      assert.equal(
        factsigner.toUnitString(web3.utils.toBN('0x18493fba64ef00000').neg(), 18, -1), // - (10**18) *28
        '-20'
      );


      done();
    });
  });
});
