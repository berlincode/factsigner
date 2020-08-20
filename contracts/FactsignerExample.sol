/*
 Contract example for https://www.factsigner.com

 Public repository:
 https://github.com/berlincode/factsigner

 Version 7.0.0

 SPDX-License-Identifier: MIT

 MIT License

 Copyright (c) factsigner.com (https://www.factsigner.com)

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

*/

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./FactsignerDefines.sol";
import "./FactsignerVerify.sol";

contract FactsignerExample {

    struct BaseData {
        /* facts */
        string underlyingString; /* e.g. name */
        uint40 expirationDatetime;
        uint24 objectionPeriod;

        uint8 config;
        uint8 marketCategory;

        int8 ndigit; /* only used with striked markets */
        uint8 baseUnitExp; /* only used with striked markets */

        int128[] namedRanges;

        /* address of signing authority - used to check the signed value via ecrecover() */
        address signerAddr; /* 20 bytes */
    }

    /* after settlement value is successfully received 'settled' is set to true */
    bool public settled;

    /* variables */
    BaseData baseData;

    /* This is the constructor */
    constructor (
        BaseData memory marketBasedata,
        FactsignerVerify.Signature memory signature
    ) public
    {
        bytes32 factHash = calcFactHash(marketBasedata);

        require(
            FactsignerVerify.verifyFactsignerMessage(
                factHash,
                signature
            ) == marketBasedata.signerAddr,
            "Signature invalid."
        );

        baseData = marketBasedata;
    }

    function settle (
        int256 value,
        FactsignerVerify.Signature memory signature
    ) public
    {
        require(
            ! settled,
            "alredy settled"
        );

        require(
            FactsignerVerify.verifyFactsignerMessage(
                keccak256(
                    abi.encodePacked(
                        calcFactHash(baseData),
                        value,
                        uint16(FactsignerDefines.SettlementType.FINAL)
                    )
                ),
                signature
            ) == baseData.signerAddr,
            'signature invalid'
        );

        /* DO SOMETHING HERE using the validated parameter 'value' */
        settled = true;
    }

    function calcFactHash (
        BaseData memory marketBasedata
    ) public pure returns (bytes32)
    {
        bytes memory data;
        data = abi.encodePacked(
            keccak256(abi.encodePacked(marketBasedata.underlyingString)), /* 'name' utf8 encoded */
            marketBasedata.expirationDatetime, /* 'expirationDatetime' unix epoch seconds UTC */
            marketBasedata.objectionPeriod, /* 'objection_period' 3600 seconds */
            marketBasedata.config,
            marketBasedata.marketCategory,
            marketBasedata.baseUnitExp, /* 'base_unit_exp' = 18 -> base_unit = 10**18 = 1000000000000000000 */
            marketBasedata.ndigit, /* 'ndigit' number of digits (may be negative) */
            marketBasedata.namedRanges /* used with named markets - must be empty with striked markets */
        );
        return keccak256(data);
    }
}
