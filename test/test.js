// vim: sts=2:ts=2:sw=2
/* eslint-env mocha */
var Web3 = require('web3');
var assert = require('assert');
var TestRPC = require('ethereumjs-testrpc');
var fs = require('fs');
var BigNumber = require('bignumber.js'); // use web3.utils.BN on web3. 1.0

function sign(web3, address, value, callback) {
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
}

function toHex(dec, bytes) {
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
}

var logger = {
  log: function(/*message*/) {
    //console.log(message);
  }
};

var contract_interface = JSON.parse(
  fs.readFileSync(
    'FactSignerExample_sol_FactSignerExample.abi',
    {encoding: 'utf8'}
  )
);
var contract_bytecode = fs.readFileSync(
  'FactSignerExample_sol_FactSignerExample.bin',
  {encoding: 'utf8'}
);

var web3;
var contract;
var account_sign, account_default;

function setup(done){
  web3 = new Web3();
  var options = {
    logger: logger,
    gasPrice: 20000000000,
    gasLimit: 0x47E7C4,
    accounts: [
      {index: 0, balance: 1000 * 1000000000000000000}, // 1000 ether
      {index: 1, balance: 0} // used only as signing authority
    ]
  };

  web3.setProvider(TestRPC.provider(options));

  contract = web3.eth.contract(contract_interface);

  web3.eth.getAccounts(function(err, accounts) {
    assert.equal(err, null);
    assert.equal(accounts.length, 2);
    account_default = accounts[0];
    account_sign = accounts[1];
    done();
  });
}

describe('Test1', function() {
  this.timeout(240*1000);

  var base_unit_exp = 18;
  var objection_period = 3600;
  var settlement = 1457676000;
  var name = '0x4254430000000000000000000000000000000000000000000000000000000000'; // 'BTC' ascii string as bytes32
  var ndigit = 2;
  var factHash;
  var signature_expire;
  var value = new BigNumber('0x9d140d4cd91b0000'); //11.3186863872
  var contractInstance;

  before('Setup', function(done) {
    setup(done);
  });

  describe('contract', function() {

    it('calculate factHash', function(done) {

      factHash = web3.sha3(
          // sorted alphabetically by key name in interfact
          toHex(base_unit_exp, 1) + // base_unit_exp
          name.replace(/^0x/, '') + // name
          toHex(ndigit, 1) + // ndigit '02',
          toHex(objection_period, 4) + // objection_period
          toHex(settlement, 8),  // settlement '0000000056e25ee0'
          {encoding: 'hex'}
      );
      //assert();
      done();
    });

    it('Contract create', function(done) {
      sign(web3, account_sign, factHash.replace(/^0x/, ''), function(err, sig) {
        assert.equal(err, null);
        var signature = [
          '0x' + toHex(sig.v, 32), // convert to byte32
          sig.r,
          sig.s
        ];
        contract.new(
          base_unit_exp,
          name,
          ndigit,
          objection_period,
          settlement,
          signature,
          account_sign,
          {
            from: account_default,
            data: contract_bytecode,
            gas: 4000000
          },
          function(err, contr){
            assert.equal(err, null);
            assert(typeof(contr) !== 'undefined');
            if(contr.address) {
              // there are two callbacks here - we check for address on the second call (contract deployed)
              contractInstance = contr;
              done();
            }
          }
        );
      });
    });

    it('Calculate expiration signature', function(done) {
      var condensed = factHash.replace(/^0x/, '') + toHex(value, 32);
      var hash = web3.sha3(
          condensed,
          {encoding: 'hex'}
      );
      sign(web3, account_sign, hash.replace(/^0x/, ''), function(err, sig) {
        assert.equal(err, null);
        signature_expire = [
          '0x' + toHex(sig.v, 32), // convert to byte32
          sig.r,
          sig.s
        ];
        done();
      });
    });

    it('Expire', function(done) {
      contractInstance.settlement(
        '0x' + toHex(value, 32),
        signature_expire,
        {
          gas: 300000,
          value: 0,
          from: account_default
        }, function(err, result) {
          assert.equal(err, null);

          contractInstance.settled(function(err, result) {
            /* check if really expired */
            assert.equal(err, null);
            /* now the contract should be settled */
            assert.equal(result, true);

            done();
          });
        });
    });

  });
});
