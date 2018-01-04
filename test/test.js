// vim: sts=2:ts=2:sw=2
/* eslint-env mocha */
var factsigner = require('../index.js');
var Web3 = require('web3');
var assert = require('assert');
var TestRPC = require('ethereumjs-testrpc');
var fs = require('fs');
var BigNumber = require('bignumber.js'); // use web3.utils.BN on web3. 1.0

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

  var marketDict = {
    baseUnitExp: 18,
    objectionPeriod: 3600,
    settlement: 1457676000,
    name: 'BTC',
    ndigit: 2
  };

  var factHash;
  var signature_expire;
  var value = new BigNumber('0x9d140d4cd91b0000'); //11.3186863872
  var contractInstance;

  before('Setup', function(done) {
    setup(done);
  });

  describe('contract', function() {

    it('calculate factHash', function(done) {

      factHash = factsigner.factHash(web3, marketDict);

      assert.equal(factHash, '0x03810f608753d91f1b531dec8ee3fb2d3fefec0a8c1290da483bef39a6aa7eed');

      done();
    });

    it('Contract create', function(done) {
      factsigner.sign(web3, account_sign, factHash.replace(/^0x/, ''), function(err, sig) {
        assert.equal(err, null);
        var signature = [
          '0x' + factsigner.toHex(sig.v, 32), // convert to byte32
          sig.r,
          sig.s
        ];
        contract.new(
          marketDict.baseUnitExp,
          '0x' + factsigner.stringToHex(marketDict.name, 32),
          marketDict.ndigit,
          marketDict.objectionPeriod,
          marketDict.settlement,
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

    it('Calculate settlement signature', function(done) {
      var condensed = factHash.replace(/^0x/, '') + factsigner.toHex(value, 32);
      var hash = web3.sha3(
        condensed,
        {encoding: 'hex'}
      );
      factsigner.sign(web3, account_sign, hash.replace(/^0x/, ''), function(err, sig) {
        assert.equal(err, null);
        signature_expire = [
          '0x' + factsigner.toHex(sig.v, 32), // convert to byte32
          sig.r,
          sig.s
        ];
        done();
      });
    });

    it('Settlement', function(done) {
      contractInstance.settlement(
        '0x' + factsigner.toHex(value, 32),
        signature_expire,
        {
          gas: 300000,
          value: 0,
          from: account_default
        }, function(err, result) {
          assert.equal(err, null);
          assert.notEqual(result, undefined);

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
