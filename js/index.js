// vim: sts=2:ts=2:sw=2
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([
      'web3-utils',
      'eth-lib-account', // eth-lib/account
      './constants'
    ], factory);
  } else if (typeof module !== 'undefined' && module.exports) {
    // CommonJS (node and other environments that support module.exports)
    module.exports = factory(
      require('web3-utils'),
      require('eth-lib/lib/account'),
      require('./constants')
    );
  }else {
    // Global (browser)
    root.factsigner = factory(
      (new root.Web3()).utils, // we expect that the whole Web3 was loaded an use only web3.utils from it
      root.ethLibAccount, // we expect that the whole eth-lib was loaded an use only the eth-lib.accounts from it
      root.factsignerConstants
    );
  }
}(this, function (web3Utils, EthLibAccount, constants) {

  //function toFloat(bn, baseUnitExp) {
  //  // no flooring/rounding/ceiling - just stripping digits
  //  var divisor = web3Utils.toBN('10').pow(web3Utils.toBN(baseUnitExp));
  //  return bn.div(divisor).mul(unitMultiplier).toString();
  //}
  function parseFloatToBn(floatStr, baseUnitExp){
    if (! floatStr.match(/^-?[0-9]+(\.[0-9]+)?$/))
      throw new Error('unable to parse float: "' + floatStr +'"');

    var numberFractionalDigits = 0;
    if (floatStr.indexOf('.') >= 0)
      numberFractionalDigits = floatStr.length - floatStr.indexOf('.') - 1;
    floatStr = floatStr.replace('.', '');

    return web3Utils.toBN(floatStr).mul(web3Utils.toBN('10').pow(web3Utils.toBN(baseUnitExp-numberFractionalDigits)));
  }

  //function toTwosComplement(number, bytes) {
  //  // derived from web3Utils.toTwosComplement()
  //  return '0x'+ web3Utils.toBN(number).toTwos(bytes*8).toString(16, bytes*2);
  //}

  function toUnitString(bn, baseUnitExp, ndigit) {
    // no flooring/rounding/ceiling - just stripping digits
    var unitDivisor = web3Utils.toBN('10').pow(web3Utils.toBN(baseUnitExp-ndigit));
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
    var unitMultiplier = web3Utils.toBN('10').pow(web3Utils.toBN(-ndigit));
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

  function stringToHex(str, bytes){
    bytes = bytes || 32;
    var hex = web3Utils.utf8ToHex(str).replace(/^0x/, '');
    if (hex.length > bytes*2)
      throw new Error('string too long');
    return web3Utils.padRight(hex, bytes*2);
  }

  function hexToString(hexStr){
    return web3Utils.hexToUtf8(hexStr).split('\0').shift();
  }

  function addHexPrefix(hexStr){
    return '0x' + hexStr.replace(/^0x/, '');
  }

  function stringHexEncode(str){
    var hex, i;

    var result = '';
    for (i=0; i<str.length; i++) {
      hex = str.charCodeAt(i).toString(16);
      result += ('0'+hex).slice(-2);
    }

    return result;
  }

  // similar to web3-eth-accounts' sign() method
  // using a different preamble and returns just v, r and s

  /* create signatures to create and settle markets */
  function signFactsignerMessage(valueHex, privateKey) {
    valueHex = valueHex.replace(/^0x/, '');

    if (valueHex.length != 32*2)
      throw new Error('invalid valueHex');

    var messageHashHex = web3Utils.keccak256(
      '0x' +
      stringHexEncode('\x19Factsigner Signed Message:\n32') +
      valueHex
    );
    var signature = EthLibAccount.sign(messageHashHex, privateKey);
    var vrs = EthLibAccount.decodeSignature(signature);
    return {
      v: vrs[0],
      r: vrs[1],
      s: vrs[2],
    };
  }

  function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;

    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  function validateDataForFactHash(marketBaseData){
    // use marketBaseData.strikes as namedRanges with named marktes if marketBaseData.namedRanges is not set
    var namedRanges = marketBaseData.namedRanges || ((marketBaseData.config & constants.configMarketTypeIsStrikedMask)? []: marketBaseData.strikes);

    if (marketBaseData.config & constants.configMarketTypeIsStrikedMask) {
      /* striked market */
      if (namedRanges.length !== 0) {
        throw new Error('"namedRanges" must be empty for striked markets');
      }
    } else {
      /* named market */
      if (Number(marketBaseData.ndigit) !== constants.NDIGIT_DEFAULT) {
        throw new Error('"ndigit" must be ' + constants.NDIGIT_DEFAULT + ' for named markets');
      }
      if (marketBaseData.config & constants.configIntervalTypeIsUsedMask) {
        throw new Error('"intervalType" must be 0/false for named markets');
      }
      if (Number(marketBaseData.baseUnitExp) !== constants.BASE_UNIT_EXP_DEFAULT) {
        throw new Error('"baseUnitExp" must be ' + constants.BASE_UNIT_EXP_DEFAULT + ' for named markets');
      }
      if (namedRanges.length < 2) {
        throw new Error('"namedRanges" must contain at least two valid strings for named markets');
      }
    }
  }

  function validateDataForMarketHash(marketBaseData){
    validateDataForFactHash(marketBaseData);

    var namedRanges = marketBaseData.namedRanges || ((marketBaseData.config & constants.configMarketTypeIsStrikedMask)? []: marketBaseData.strikes);

    if (marketBaseData.config & constants.configIntervalTypeIsUsedMask) {
      if (marketBaseData.marketInterval === constants.marketInterval.NONE) {
        throw new Error('"marketInterval" must NOT be ' + constants.marketInterval.NONE + ' for markets with intervalType == 1/true');
      }
    } else {
      if (marketBaseData.marketInterval !== constants.marketInterval.NONE) {
        throw new Error('"marketInterval" must be ' + constants.marketInterval.NONE + ' for markets with intervalType == 0/false');
      }
    }

    if (marketBaseData.config & constants.configMarketTypeIsStrikedMask) {
      /* striked market */
      if (marketBaseData.strikes.length < 1) {
        throw new Error('"strikes" must contain at least one valid float for striked markets');
      }
    } else {
      /* named market */
      if (! arraysEqual(namedRanges, marketBaseData.strikes)){
        //TODO move this to digoptionsContracts?
        throw new Error('"namedRanges" and "strikes" must be equal for for named markets');
      }
    }
  }

  function factHash(marketBaseData){

    validateDataForFactHash(marketBaseData);

    // use marketBaseData.strikes as namedRanges with named marktes if marketBaseData.namedRanges is not set
    var namedRanges = marketBaseData.namedRanges || ((marketBaseData.config & constants.configMarketTypeIsStrikedMask)? []: marketBaseData.strikes);

    // following does NOT work with trailing '\0'
    //var underlyingHash =  web3Utils.soliditySha3(
    //  {t: 'string', v: marketBaseData.underlyingString}
    //);

    // Split up string by '\0' (utf8ToHex() does not handle '\0'),
    // call utf8ToHex(), join string with '00'
    // and call keccak256().
    // This works with trailing '\0' (and strings that look like hex e.g. '0xff')
    var underlyingParts = marketBaseData.underlyingString.split('\0');
    var underlyingHex = '0x' + underlyingParts.map(function(part){return web3Utils.utf8ToHex(part).replace(/^0x/, '');}).join('00');
    var underlyingHash = web3Utils.keccak256(underlyingHex);

    var args = [
      {t: 'bytes32', v: underlyingHash},
      {t: 'uint40', v: marketBaseData.expirationDatetime},
      {t: 'uint24', v: marketBaseData.objectionPeriod},
      {t: 'uint8', v: marketBaseData.config},
      {t: 'uint8', v: marketBaseData.marketCategory},

      {t: 'uint8', v: marketBaseData.baseUnitExp},
      {t: 'int8', v: marketBaseData.ndigit},
      {t: 'int256', v: namedRanges} // use int256 though type is int128 because of array
    ];

    return web3Utils.soliditySha3.apply(this, args);
  }

  function settlementHash(factHash, valueBnOrHex, settlementType) {
    if (! factHash){
      throw new Error('factHash invalid');
    }
    return web3Utils.soliditySha3(
      {t: 'bytes32', v: factHash},
      {t: 'int256', v: valueBnOrHex},
      {t: 'uint16', v: settlementType} // type: e.g. final type == 0
    );
  }

  function replaceUrl(url, signerAddr, factHash){
    /* for e.g. constants.signerAddresses[x].url or constants.signerAddresses[x].urlApi */
    return (
      url
        .replace('{signerAddr}', addHexPrefix(signerAddr.toLowerCase()))
        .replace('{factHash}', addHexPrefix(factHash.toLowerCase()))
    );
  }

  return {
    constants: constants,
    parseFloatToBn: parseFloatToBn,
    toUnitString: toUnitString,
    toUnitStringExact: toUnitStringExact,
    stringToNamedRange: function(str){
      var signed_int = new web3Utils.BN(stringToHex(str, constants.NAMED_RANGE_MAX_BYTES), 16).fromTwos(8*constants.NAMED_RANGE_MAX_BYTES);
      return signed_int.toString();
    },
    namedRangeToString: function(x){
      return hexToString('0x' + web3Utils.toBN(x).toTwos(8*constants.NAMED_RANGE_MAX_BYTES).toString(16));
    },
    underlyingStringToUnderlyingParts: function(underlyingString){
      var list = underlyingString.split('\0');
      return {
        'name': list[0], // e.g. "BTC"
        'unit': list[1], // e.g. "USD"
        'marketplace': list[2], // e.g. "bitfinex" exchage
        'provider': list[3] // e.g. api-provider "dia"
      };
    },
    underlyingSimple: function(underlyingParts){ // TODO rename
      var name = underlyingParts.name;
      if (
        (typeof(underlyingParts.unit) !== 'undefined') &&
        (underlyingParts.unit !== '')
      )
        name = name + '/' + underlyingParts.unit;
      return name;
    },

    signFactsignerMessage: signFactsignerMessage,
    validateDataForFactHash: validateDataForFactHash,
    validateDataForMarketHash: validateDataForMarketHash,
    factHash: factHash,
    settlementHash: settlementHash,
    replaceUrl: replaceUrl,
    weiToEthExponent: 18 // useful for parseFloatToBn()
  };
}));
