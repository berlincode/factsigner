// vim: sts=2:ts=2:sw=2
/* eslint-env mocha */
var factsigner = require('../index.js');
var Web3 = require('web3');
var web3_utils = require('web3-utils');
var assert = require('assert');
var ganache = require('ganache-core');
var fs = require('fs');

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
var accountDefault;
var accountSign;

function setup(done){
  const options = {
    logger: logger,
    gasPrice: 20000000000,
    gasLimit: 0x47E7C4,
    accounts: [
      {index: 0, balance: 1000 * 1000000000000000000} // 1000 ether
    ]
  };

  web3 = new Web3(ganache.provider(options));

  web3.eth.getAccounts()
    .then(function(accounts){
      assert.equal(accounts.length, 1);
      accountDefault = accounts[0];
      done();
    });

  accountSign = web3.eth.accounts.privateKeyToAccount('0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8709');
}

describe('Test contract and signature', function() {
  this.timeout(240*1000);

  var marketDict = {
    baseUnitExp: 18,
    objectionPeriod: 3600,
    settlement: 1457676000,
    name: 'BTC',
    ndigit: 2
  };

  var factHash;
  var signatureSettlement;
  var valueBn = web3_utils.toBN('0x9d140d4cd91b0000'); //11.3186863872
  var contractInstance;

  before('Setup', function(done) {
    setup(done);
  });

  describe('contract', function() {

    it('calculate factHash', function(done) {

      factHash = factsigner.factHash(marketDict);

      assert.equal(factHash, '0x03810f608753d91f1b531dec8ee3fb2d3fefec0a8c1290da483bef39a6aa7eed');

      done();
    });

    it('Contract create', async function() {
      const contract = new web3.eth.Contract(contract_interface);
      const signature = factsigner.sign(web3, accountSign.privateKey, factHash);

      contractInstance = await contract.deploy(
        {
          data: contract_bytecode,
          arguments: [
            marketDict.baseUnitExp,
            factsigner.stringToHex(marketDict.name, 32),
            marketDict.ndigit,
            marketDict.objectionPeriod,
            marketDict.settlement,
            signature,
            accountSign.address
          ]
        }
      ).send(
        {
          gas: 4000000,
          gasPrice: '30000000000000',
          //value: 0,
          from: accountDefault
        }
      );
      assert.notEqual(contractInstance.options.address, undefined);
    });

    it('Check that no settlement was done', async function() {
      const settlement_success = await contractInstance.methods.settled().call();
      /* the contract should not be settled */
      assert.equal(settlement_success, false);
    });

    it('Calculate settlement signature', async function() {
      const hash = factsigner.settlementHash(
        factHash,
        valueBn,
        factsigner.SETTLEMENT_TYPE_FINAL
      );
      signatureSettlement = factsigner.sign(web3, accountSign.privateKey, hash);
    });

    it('Settle', async function() {
      return contractInstance.methods.settle(
        valueBn.toString(),
        signatureSettlement
      ).send(
        {
          gas: 300000,
          gasPrice: '30000000000000',
          //value: 0,
          from: accountDefault
        }
      ).then(function(transaction){
        assert.notEqual(transaction, undefined);
        return contractInstance.methods.settled().call();
      }).then(function(result) {
        /* now the contract should be settled */
        assert.equal(result, true);
      });
    });

  });
});
