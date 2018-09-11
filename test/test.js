// vim: sts=2:ts=2:sw=2
/* eslint-env mocha */
var factsigner = require('../index.js');
var Web3 = require('web3');
var web3_utils = Web3.utils;
var assert = require('assert');
var TestRPC = require('ganache-core'); // was 'ethereumjs-testrpc'
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

  web3.eth.getAccounts(function(err, accounts) {
    assert.equal(err, null);
    assert.equal(accounts.length, 2);
    account_default = accounts[0];
    account_sign = accounts[1];
    done();
  });
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
  var signature_settlement;
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

    it('Contract create', function(done) {
      factsigner.sign(web3, account_sign, factHash)
        .then(function(signature){

          var contract = new web3.eth.Contract(contract_interface);
          contract.deploy(
            {
              data: contract_bytecode,
              arguments: [
                marketDict.baseUnitExp,
                factsigner.stringToHex(marketDict.name, 32),
                marketDict.ndigit,
                marketDict.objectionPeriod,
                marketDict.settlement,
                signature,
                account_sign
              ]
            }
          ).send(
            {
              gas: 4000000,
              gasPrice: '30000000000000',
              //value: 0,
              from: account_default
            }
          ).on('error', function(error){  
            //console.log('error', error);
            assert.equal(error, null);
            done();
          }).on('transactionHash', function(/*transactionHash*/){
            //console.log('transactionHash', transactionHash);
          }).on('receipt', function(/*receipt*/){
            //console.log('receipt.contractAddress', receipt.contractAddress) // contains the new contract address
          }).on('confirmation', function(confirmationNumber, receipt){
            //console.log('confirmation receipt', receipt);
            assert.notEqual(receipt, undefined);
          }).then(function(newContractInstance){
            assert.notEqual(newContractInstance.options.address, undefined);
            contractInstance = newContractInstance;
            done();
          });
        }
        );
    });

    it('Check that no settlement was done', function(done) {
      contractInstance.methods.settled().call(function(err, result) {
        /* check if really expired */
        assert.equal(err, null);
        /* the contract should not be settled */
        assert.equal(result, false);

        done();
      });
    });

    it('Calculate settlement signature', function(done) {
      var hash = factsigner.settlementHash(
        factHash,
        valueBn,
        factsigner.SETTLEMENT_TYPE_FINAL
      );
      factsigner.sign(web3, account_sign, hash)
        .then(function(sig){
          signature_settlement = sig;
          done();
        });
    });

    it('Settle', function(done) {
      contractInstance.methods.settle(
        valueBn.toString(),
        signature_settlement
      ).send(
        {
          gas: 300000,
          gasPrice: '30000000000000',
          //value: 0,
          from: account_default
        }
      ).on('error', function(error){  
        //console.log('error', error);
        assert.equal(error, null);
        done();
      }
      ).on('confirmation', function(confirmationNumber, receipt){
        assert.notEqual(receipt, undefined);
      }).then(function(transaction){
        assert.notEqual(transaction, undefined);

        contractInstance.methods.settled().call(function(err, result) {
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
