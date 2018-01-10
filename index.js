// vim: sts=2:ts=2:sw=2
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([
      // TODO BigNumber
    ], factory);
  } else if (typeof module !== 'undefined' && module.exports) {
    // CommonJS (node and other environments that support module.exports)
    module.exports = factory(
      require('web3-utils')
    );
  }else {
    // Global (browser)
    root.digioptionsTools = factory(
      // TODO BigNumber
    );
  }
}(this, function (web3_utils) {

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
    return Array(+(zero > 0 && zero)).join('0') + hex_string;
  };

  // use web3.utils.utf8ToHex?
  var stringToHex = function(str, bytes){
    var digits = bytes * 2;
    var hex_string = '';
    var hex, i;

    for (i=0; i<str.length; i++) {
      hex = str.charCodeAt(i).toString(16);
      hex_string += ('0'+hex).slice(-2);
    }

    var zero = digits - hex_string.length + 1;
    return hex_string + Array(+(zero > 0 && zero)).join('0');
  };

  var sign = function(web3, address, value, callback) {
    web3.eth.sign('0x' + value, address, function(err, sig) {
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

  function factHash(web3_utils, marketDict){
    return web3_utils.soliditySha3(
      {t: 'uint8', v: marketDict.baseUnitExp},
      {t: 'bytes32', v: stringToHex(marketDict.name, 32)},
      {t: 'int8', v: marketDict.ndigit},
      {t: 'uint32', v: marketDict.objectionPeriod},
      {t: 'uint64', v: marketDict.settlement}
    );
  }

  return {
    toHex: toHex,
    stringToHex: stringToHex,
    sign: sign,
    factHash: factHash
  };
}));
