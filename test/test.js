// vim: sts=2:ts=2:sw=2
/* eslint-env mocha */

const factsigner = require('../js/index.js');
const Web3 = require('web3');
const web3Utils = require('web3-utils');
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
    path.join('js', 'FactsignerExample_sol_FactsignerExample.abi'),
    {encoding: 'utf8'}
  )
);
const contract_bytecode = fs.readFileSync(
  path.join('js', 'FactsignerExample_sol_FactsignerExample.bin'),
  {encoding: 'utf8'}
);

let web3;
let accountDefault;
const accountSign = (new Web3()).eth.accounts.privateKeyToAccount('0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8709');

function setup(done){
  const options = {
    logger: logger,
    gasPrice: 20000000000,
    gasLimit: 0x47E7C4,
    accounts: [
      {
        index: 0,
        balance: web3Utils.toWei('1000', 'ether')
      }
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
}

describe('Test contract and signature', function() {
  this.timeout(240*1000);

  const marketBaseData0 = {
    underlyingString: 'BTC',
    expirationDatetime: 1457676000,
    objectionPeriod: 3600,
    config: (
      factsigner.constants.configMarketType.STRIKED + /* this a striked market */
      factsigner.constants.configIntervalType.USED
    ),
    marketCategory: factsigner.constants.marketCategory.CRYPTO,

    baseUnitExp: factsigner.constants.BASE_UNIT_EXP_DEFAULT,
    ndigit: 2,

    namedRanges: [
    ],

    marketInterval: factsigner.constants.marketInterval.NONE,
    signerAddr: accountSign.address
  };
  const valueBn0 = web3Utils.toBN('11318686387200000000'); // = 11.3186863872 * (10**18)

  const marketBaseData1 = {
    underlyingString: 'Humans on the moon before 2030?',
    expirationDatetime: 1457676000,
    objectionPeriod: 3600,
    config: (
      factsigner.constants.configMarketType.NAMED + /* this a named market */
      factsigner.constants.configIntervalType.UNUSED
    ),
    marketCategory: factsigner.constants.marketCategory.SOCIETY,

    baseUnitExp: factsigner.constants.BASE_UNIT_EXP_DEFAULT, // unused with named markets
    ndigit: factsigner.constants.NDIGIT_DEFAULT, // unused with named markets

    namedRanges: [
      factsigner.stringToNamedRange('no'),
      factsigner.stringToNamedRange('yes'),
      //factsigner.stringToNamedRange('ä special char'),
    ],

    marketInterval: factsigner.constants.marketInterval.NONE,
    signerAddr: accountSign.address
  };
  const valueBn1 = web3Utils.toBN(factsigner.stringToNamedRange('yes'));


  before('Setup', function(done) {
    setup(done);
  });

  for (let idx=0 ; idx < 2 ; idx++) {
    let factHash;
    let signatureSettlement;
    let contractInstance;

    const marketBaseData = [marketBaseData0, marketBaseData1][idx];
    const valueBn = [valueBn0, valueBn1][idx];

    describe(`market "${marketBaseData.underlyingString}"`, function() {

      it('calculate factHash', function(done) {

        factHash = factsigner.factHash(marketBaseData);

        //assert.equal(factHash, '0xaa676b28deb61150a2645da854f70259c1b4a5375b86b67dc1258419b22c2694');

        done();
      });

      it('Contract create', async function() {
        const contract = new web3.eth.Contract(contract_interface);
        const signature = factsigner.signFactsignerMessage(factHash, accountSign.privateKey);

        contractInstance = await contract.deploy(
          {
            data: contract_bytecode,
            arguments: [
              marketBaseData,
              signature
            ]
          }
        ).send(
          {
            gas: 4000000,
            //gasPrice: '30000000000000',
            from: accountDefault
          }
        );
        assert.notEqual(contractInstance.options.address, undefined);
      });

      it('Validate factHash', async function() {
        assert.equal(
          factHash,
          await contractInstance.methods.calcFactHash(
            marketBaseData
          ).call()
        );
      });

      it('Check that no settlement was done', async function() {
        const settled = await contractInstance.methods.settled().call();
        /* the contract should not be settled */
        assert.equal(settled, false);
      });

      it('Calculate settlement signature', async function() {
        const hash = factsigner.settlementHash(
          factHash,
          valueBn,
          factsigner.constants.settlementType.FINAL
        );
        signatureSettlement = factsigner.signFactsignerMessage(hash, accountSign.privateKey);
      });

      it('Settle', async function() {
        return contractInstance.methods.settle(
          valueBn.toString(),
          signatureSettlement
        ).send(
          {
            gas: 300000,
            //gasPrice: '30000000000000',
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
  }
});
