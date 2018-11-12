/*
 Contract example for https://www.factsigner.com

 Version 2.1.1
*/

pragma solidity ^0.4.25;
pragma experimental ABIEncoderV2;


contract FactSignerExample {

    struct BaseData {
        /* facts (sorted alphabetically) */
        uint8 baseUnitExp; /* */
        bytes32 name; /*  */
        int8 ndigit;
        uint32 objectionPeriond; /* */
        uint64 settlement; /*  */

        /* address of signing authority - used to check the signed value via ecrecover() */
        address signerAddr;
    }

    struct Signature {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    /* after settlement value is successfully received 'settled' is set to true */
    bool public settled;

    /* variables */
    BaseData baseData;

    /* This is the constructor */
    constructor (
        uint8 baseUnitExp,
        bytes32 name,
        int8 ndigit,
        uint32 objectionPeriond,
        uint64 settlement,
        Signature signature,
        address signerAddr
    ) public
    {
        bytes32 factHash = calcFactHash(
            baseUnitExp,
            name,
            ndigit,
            objectionPeriond,
            settlement
        );

        require(
            verify(
                factHash,
                signature
            ) == signerAddr,
            "Signature invalid."
        );

        /* facts */
        baseData.baseUnitExp = baseUnitExp;
        baseData.name = name;
        baseData.ndigit = ndigit;
        baseData.objectionPeriond = objectionPeriond;
        baseData.settlement = settlement;

        /* address of signing authority (i.e. factsigner.com) */
        baseData.signerAddr = signerAddr;
    }

    function settle (
        int256 value,
        Signature signature
    ) public
    {
        if (settled == true)
            return;

        if (
            verify(
                keccak256(
                    abi.encodePacked(
                        calcFactHash(
                            baseData.baseUnitExp,
                            baseData.name,
                            baseData.ndigit,
                            baseData.objectionPeriond,
                            baseData.settlement
                        ),
                        value,
                        uint16(0) // type: final type == 0
                    )
                ),
                signature
            ) == baseData.signerAddr
        ) {
            /* DO SOMETHING HERE using the validated parameter 'value' */
            settled = true;
        }
    }

    /* internal functions */

    function verify(
        bytes32 _message,
        Signature signature
    ) internal pure returns (address)
    {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedHash = keccak256(
            abi.encodePacked(
                prefix, 
                _message
            )
        );
        address signer = ecrecover(
            prefixedHash,
            signature.v,
            signature.r,
            signature.s
        );
        return signer;
    }

    function calcFactHash (
        uint8 baseUnitExp,
        bytes32 name,
        int8 ndigit,
        uint32 objectionPeriond,
        uint64 settlement
    ) internal pure returns (bytes32)
    {
        return keccak256(
            abi.encodePacked(
                /* sorted alphabetically */
                baseUnitExp, /* 'base_unit_exp' = 18 -> base_unit = 10**18 = 1000000000000000000 */
                name, /* 'name' ascii encoded string as bytes32 - unused bytes are filled with \0 */
                ndigit, /* 'ndigit' number of digits (may be negative) */
                objectionPeriond, /* 'objection_period' 3600 seconds */
                settlement /* 'settlement' unix epoch seconds UTC */
            )
        );
    }

}
