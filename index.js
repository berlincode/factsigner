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
      require('bignumber.js') // use web3.utils.BN on web3. 1.0
    );
  }else {
    // Global (browser)
    root.digioptionsTools = factory(
      // TODO BigNumber
    );
  }
}(this, function (BigNumber) {

  var toHex = function toHex(dec, bytes) {
    var length = bytes * 8;
    var digits = bytes * 2;
    var hex_string;
    if (dec < 0) {
      hex_string = (new BigNumber(2)).pow(length).add(new BigNumber(dec)).toString(16);
    } else {
      hex_string = new BigNumber(dec).toString(16);
    }
    var zero = digits - hex_string.length + 1;
    return Array(+(zero > 0 && zero)).join('0') + hex_string;
  };

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

  var sign = function sign(web3, address, value, callback) {
    web3.eth.sign(address, '0x' + value, function(err, sig) {
      if (!err) {
        var r = sig.slice(0, 66);
        var s = '0x' + sig.slice(66, 130);
        var v = web3.toDecimal('0x' + sig.slice(130, 132));
        if ((v !== 27) && (v !== 28)) v+=27;
        callback(undefined, {r: r, s: s, v: v});
      } else {
        callback(err, undefined);
      }
    });
  };

  function factHash(web3, marketDict){
    return web3.sha3(
      // sorted alphabetically by key name interface name
      toHex(marketDict.baseUnitExp, 1) +
      stringToHex(marketDict.name, 32) +
      toHex(marketDict.ndigit, 1) +
      toHex(marketDict.objectionPeriod, 4) +
      toHex(marketDict.settlement, 8), // settlement
      {encoding: 'hex'}
    );
  }

  return {
    toHex: toHex,
    stringToHex: stringToHex,
    sign: sign,
    factHash: factHash
  };
}));
