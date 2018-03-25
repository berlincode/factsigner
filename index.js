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
    var unitDivisor =  web3_utils.toBN('10').pow(web3_utils.toBN(base_unit_exp-ndigit));
    if (ndigit > 0)
    {
      var str = bn.div(unitDivisor).toString();
      return str.substring(0, str.length-ndigit) + '.' + str.substring(str.length-ndigit);
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

  // use web3.utils.asciiToHex()?
  var stringToHex = function(str, bytes){
    var digits = bytes * 2;
    var hex_string = '';
    var hex, i;

    for (i=0; i<str.length; i++) {
      hex = str.charCodeAt(i).toString(16);
      hex_string += ('0'+hex).slice(-2);
    }

    var zero = digits - hex_string.length + 1;
    return '0x' + hex_string + Array(+(zero > 0 && zero)).join('0');
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

  function getFactsignerUrl(factsignerAddr, marketFactHash){
    return (
      'https://www.factsigner.com/api_v1/facts/id/{factsignerAddr}-{marketFactHash}?accept_terms_of_service=current'
        .replace('{factsignerAddr}', factsignerAddr.replace(/^0x/, ''))
        .replace('{marketFactHash}', marketFactHash.replace(/^0x/, ''))
    );
  }

  return {
    toUnitString: toUnitString,
    toHex: toHex,
    stringToHex: stringToHex,
    sign: sign,
    sigToBytes32: sigToBytes32,
    factHash: factHash,
    getFactsignerUrl: getFactsignerUrl
  };
}));
