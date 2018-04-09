// vim: sts=2:ts=2:sw=2
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([
      'web3-utils'
    ], factory);
    define(
      [
        'web3-utils'
      ], function (
        web3_utils
      ) {
        return factory(
          web3_utils
        );
      });
  } else if (typeof module !== 'undefined' && module.exports) {
    // CommonJS (node and other environments that support module.exports)
    module.exports = factory(
      require('web3-utils')
    );
  }else {
    // Global (browser)
    root.factsigner = factory(
      root.Web3.utils // we expect that the whole Web3 was loaded an use only the utils from it
    );
  }
}(this, function (web3_utils) {

  function toUnitString(bn, base_unit_exp, ndigit) {
    // no flooring/rounding/ceiling - just stripping digits
    var unitDivisor =  web3_utils.toBN('10').pow(web3_utils.toBN(base_unit_exp-ndigit));
    if (ndigit > 0)
    {
      var str = bn.div(unitDivisor).toString();
      var sign = '';
      if (str[0] === '-'){
        str = str.substring(1);
        sign = '-';
      }
      // add preceeding '0's - we need at least a total of (ndigit + 1) digits
      // e.g. '01' for ndigit == 2 so that after inserting a '0' we finally have '0.1'
      str = Array(+((ndigit + 2 > str.length) && (ndigit + 2 - str.length))).join('0') + str;
      return sign + str.substring(0, str.length-ndigit) + '.' + str.substring(str.length-ndigit);
    }
    var unitMultiplier =  web3_utils.toBN('10').pow(web3_utils.toBN(-ndigit));
    return bn.div(unitDivisor).mul(unitMultiplier).toString();
  }

  // TODO use from web3.utils?
  var toHex = function toHex(dec, bytes) {
    var length = bytes * 8;
    var digits = bytes * 2;
    var hex_string;
    if (dec < 0) {
      hex_string = (web3_utils.toBN(2)).pow(length).add(web3_utils.toBN(dec)).toString(16);
    } else {
      hex_string = web3_utils.toBN(dec).toString(16);
    }
    var zero = digits - hex_string.length + 1;
    return '0x' + Array(+(zero > 0 && zero)).join('0') + hex_string;
  };

  var stringToHex = function(str, bytes){
    return web3_utils.padRight(web3_utils.utf8ToHex(str), bytes*2);
  };

  var addHexPrefix = function(hexStr){
    return '0x' + hexStr.replace(/^0x/, '');
  };

  var sign = function(web3, address, value, callback) {
    web3.eth.sign(addHexPrefix(value), address, function(err, sig) {
      if (!err) {
        var r = sig.slice(0, 66);
        var s = '0x' + sig.slice(66, 130);
        var v = parseInt(sig.slice(130, 132), 16);
        if ((v !== 27) && (v !== 28)) v+=27;
        callback(undefined, {r: r, s: s, v: v});
      } else {
        callback(err, undefined);
      }
    });
  };

  var sigToBytes32 = function(sig) {
    return [
      toHex(sig.v, 32), // convert to byte32
      sig.r,
      sig.s
    ];
  };

  function factHash(marketDict){
    return web3_utils.soliditySha3(
      {t: 'uint8', v: marketDict.baseUnitExp},
      {t: 'bytes32', v: stringToHex(marketDict.name, 32)},
      {t: 'int8', v: marketDict.ndigit},
      {t: 'uint32', v: marketDict.objectionPeriod},
      {t: 'uint64', v: marketDict.settlement}
    );
  }

  function getFactsignerUrl(signerAddr, factHash){
    return (
      'https://www.factsigner.com/facts/id/{signerAddr}/{factHash}?accept_terms_of_service=current'
        .replace('{signerAddr}', addHexPrefix(signerAddr.toLowerCase()))
        .replace('{factHash}', addHexPrefix(factHash.toLowerCase()))
    );
  }

  function getFactsignerUrlApi(signerAddr, factHash){
    return (
      'https://www.factsigner.com/api_v1/facts/id/{signerAddr}/{factHash}?accept_terms_of_service=current'
        .replace('{signerAddr}', addHexPrefix(signerAddr.toLowerCase()))
        .replace('{factHash}', addHexPrefix(factHash.toLowerCase()))
    );
  }

  return {
    toUnitString: toUnitString,
    toHex: toHex,
    stringToHex: stringToHex,
    sign: sign,
    sigToBytes32: sigToBytes32,
    factHash: factHash,
    getFactsignerUrl: getFactsignerUrl,
    getFactsignerUrlApi: getFactsignerUrlApi
  };
}));
