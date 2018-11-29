// vim: sts=2:ts=2:sw=2
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([
      'web3'
    ], factory);
  } else if (typeof module !== 'undefined' && module.exports) {
    // CommonJS (node and other environments that support module.exports)
    module.exports = factory(
      require('web3')
    );
  }else {
    // Global (browser)
    root.factsigner = factory(
      root.Web3 // we expect that the whole Web3 was loaded an use only the utils from it
    );
  }
}(this, function (Web3) {
  var web3_utils = Web3.utils;

  //function toFloat(bn, baseUnitExp) {
  //  // no flooring/rounding/ceiling - just stripping digits
  //  var divisor = web3_utils.toBN('10').pow(web3_utils.toBN(baseUnitExp));
  //  return bn.div(divisor).mul(unitMultiplier).toString();
  //}
  function parseFloatToBn(floatStr, baseUnitExp){
    var numberFractionalDigits = 0;
    if (floatStr.indexOf('.') >= 0)
      numberFractionalDigits = floatStr.length - floatStr.indexOf('.') - 1;
    floatStr = floatStr.replace('.', '');

    return web3_utils.toBN(floatStr).mul(web3_utils.toBN('10').pow(web3_utils.toBN(baseUnitExp-numberFractionalDigits)));
  }

  function toUnitString(bn, baseUnitExp, ndigit) {
    // no flooring/rounding/ceiling - just stripping digits
    var unitDivisor = web3_utils.toBN('10').pow(web3_utils.toBN(baseUnitExp-ndigit));
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
    var unitMultiplier = web3_utils.toBN('10').pow(web3_utils.toBN(-ndigit));
    return bn.div(unitDivisor).mul(unitMultiplier).toString();
  }
/*
function fromWei(weiInput, unit, optionsInput) {
  var wei = numberToBN(weiInput); // eslint-disable-line
  var negative = wei.lt(zero); // eslint-disable-line
  var base = getValueOfUnit(unit);
  var baseLength = unitMap[unit].length - 1 || 1;
  var options = optionsInput || {};

  if (negative) {
    wei = wei.mul(negative1);
  }

  var fraction = wei.mod(base).toString(10); // eslint-disable-line

  while (fraction.length < baseLength) {
    fraction = '0' + fraction;
  }

  if (!options.pad) {
    fraction = fraction.match(/^([0-9]*[1-9]|0)(0*)/)[1];
  }

  var whole = wei.div(base).toString(10); // eslint-disable-line

  if (options.commify) {
    whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  var value = '' + whole + (fraction == '0' ? '' : '.' + fraction); // eslint-disable-line

  if (negative) {
    value = '-' + value;
  }

  return value;
}
*/

  function toUnitStringExact(bn, baseUnitExp) {
    var string = toUnitString(bn, baseUnitExp, baseUnitExp);
    if (string.indexOf('.') > 0)
      return string.replace(/[.]?0+$/,''); // remove trailing zeroes
    return string; // nothing to remove
  }

  function toFloat(bn, baseUnitExp) {
    return bn.toNumber() / Math.pow(10, baseUnitExp)
  }

  // TODO use from web3.utils? // differentiate signed unsigned ; throw if number too large
  /*
  var toHex = function toHex(dec, bytes) {
    var length = bytes * 8;
    var digits = bytes * 2;
    var hex_string;
    if (dec < 0) {
      hex_string = (web3_utils.toBN(2)).pow(web3_utils.toBN(length)).add(web3_utils.toBN(dec)).toString(16);
    } else {
      hex_string = web3_utils.toBN(dec).toString(16);
    }
    if (hex_string.length > bytes)
      throw new Error('number too large');
    var zero = digits - hex_string.length + 1;
    return '0x' + Array(+(zero > 0 && zero)).join('0') + hex_string;
  };
  */

  var stringToHex = function(str, bytes){
    return web3_utils.padRight(web3_utils.utf8ToHex(str), bytes*2);
  };

  var hexToString = function(hexStr){
    return web3_utils.hexToUtf8(hexStr).split('\0').shift();
  };

  var addHexPrefix = function(hexStr){
    return '0x' + hexStr.replace(/^0x/, '');
  };

  var sign = function(web3, address, value) {
    var promise = web3.eth.sign(addHexPrefix(value), address)
      .then(function(sig){
        var r = sig.slice(0, 66);
        var s = '0x' + sig.slice(66, 130);
        var v = parseInt(sig.slice(130, 132), 16);
        if ((v !== 27) && (v !== 28)) v+=27;
        return {v: v, r: r, s: s};
      }
      );
    return promise;
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

  function settlementHash(factHash, valueBn, settlementType) {
    return web3_utils.soliditySha3(
      {t: 'bytes32', v: factHash},
      {t: 'bytes32', v: web3_utils.padLeft('0x' + valueBn.toString(16), 64)},
      {t: 'uint16', v: settlementType} // type: e.g. final type == 0
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
    parseFloatToBn: parseFloatToBn,
    toUnitString: toUnitString,
    toUnitStringExact: toUnitStringExact,
    toFloat: toFloat,
    //toHex: toHex,
    stringToHex: stringToHex,
    hexToString:hexToString,
    sign: sign,
    factHash: factHash,
    settlementHash: settlementHash,
    getFactsignerUrl: getFactsignerUrl,
    getFactsignerUrlApi: getFactsignerUrlApi,
    SETTLEMENT_TYPE_FINAL: '0x0',
    weiToEthExponent: 18, // useful for parseFloatToBn()
    signerAddresses: [
      "0x49B6D897575b0769d45eBa7E2De60A16de5B8C13" // this is only the temporary key
    ]
  };
}));
