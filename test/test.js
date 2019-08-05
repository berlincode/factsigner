// vim: sts=2:ts=2:sw=2
/* eslint-env mocha */

const factsigner = require('../js/index.js');
const Web3 = require('web3');
const web3_utils = require('web3-utils');
const assert = require('assert');
const ganache = require('ganache-core');
const fs = require('fs');
const path = require('path');

const logger = {
  log: function(/*message*/) {
    //console.log(message);
  }
};

const contract_interface = JSON.parse(
  fs.readFileSync(
    path.join('js', 'FactSignerExample_sol_FactSignerExample.abi'),
    {encoding: 'utf8'}
  )
);
const contract_bytecode = fs.readFileSync(
  path.join('js', 'FactSignerExample_sol_FactSignerExample.bin'),
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

  web3 = new Web3(
    ganache.provider(options),
    null, 
    {
      defaultBlock: 'latest',
      transactionConfirmationBlocks: 1,
      transactionBlockTimeout: 5
    }
  );

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
    expirationDatetime: 1457676000,
    underlying: factsigner.stringToHex('BTC'),
    ndigit: 2
  };

  var factHash;
  var signatureSettlement;
  var valueBn = web3_utils.toBN('11318686387200000000'); // = 11.3186863872 * (10**18)
  var contractInstance;

  before('Setup', function(done) {
    setup(done);
  });

  describe('contract', function() {

    it('calculate factHash', function(done) {

      factHash = factsigner.factHash(marketDict);

      assert.equal(factHash, '0x7fb436bb93af49b4bdc0377b0cf46b89190aa6ac74907642184aa9862ca5072e');

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
            marketDict.underlying,
            marketDict.ndigit,
            marketDict.objectionPeriod,
            marketDict.expirationDatetime,
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

    it('Validate factHash', async function() {
      assert.equal(
        factHash,
        await contractInstance.methods.calcFactHash(
          marketDict.baseUnitExp,
          marketDict.underlying,
          marketDict.ndigit,
          marketDict.objectionPeriod,
          marketDict.expirationDatetime
        ).call()
      );
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
