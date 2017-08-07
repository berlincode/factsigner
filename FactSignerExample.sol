/*
 Contract example for https://www.factsigner.com

 Version 0.1.0
*/

pragma solidity ^0.4.14;


contract FactSignerExample {

    struct BaseData {
        /* facts (sorted alphabetically) */
        uint8 baseUnitExp; /* */
        bytes32 name; /*  */
        int8 ndigit;
        uint32 objectionPeriond; /* */
        uint64 settlement; /*  */

        /* address of signing authority - used to check the signed value via ecrecover() */
        address ethAddr;
    }

    /* after settlement value is successfully received 'settled' is set to true */
    bool public settled;

    /* variables */
    BaseData baseData;

    /* This is the constructor */
    function FactSignerExample (
        uint8 baseUnitExp,
        bytes32 name,
        int8 ndigit,
        uint32 objectionPeriond,
        uint64 settlement,
        bytes32[3] signature, /* array containing signature elements [v, r, s] */
        address ethAddr
    ) {
        bytes32 factHash = calcFactHash(
            baseUnitExp,
            name,
            ndigit,
            objectionPeriond,
            settlement
        );

        require(
            ecrecover(
                factHash,
                uint8(signature[0]),
                signature[1],
                signature[2]
            ) == ethAddr
        );

        /* facts */
        baseData.baseUnitExp = baseUnitExp;
        baseData.name = name;
        baseData.ndigit = ndigit;
        baseData.objectionPeriond = objectionPeriond;
        baseData.settlement = settlement;

        /* address of signing authority (i.e. factsigner.com */
        baseData.ethAddr = ethAddr;
    }

    function calcFactHash (
        uint8 baseUnitExp,
        bytes32 name,
        int8 ndigit,
        uint32 objectionPeriond,
        uint64 settlement
    ) internal constant returns (bytes32)
    {
        return sha3(
            /* sorted alphabetically */
            baseUnitExp, /* 'base_unit_exp' = 18 -> base_unit = 10**18 = 1000000000000000000 */
            name, /* 'name' ascii encoded string as bytes32 - unused bytes are filled with \0 */
            ndigit, /* 'ndigit' number of digits (may be negative) */
            objectionPeriond, /* 'objection_period' 3600 seconds */
            settlement /* 'settlement' unix epoch seconds UTC */
        );
    }

    function settlement (
        bytes32 value,
        bytes32[3] signature /* array containing signature elements [v, r, s] */
    ) {
        if (settled == true)
            return;

        if (
            ecrecover(
                sha3(
                    calcFactHash(
                        baseData.baseUnitExp,
                        baseData.name,
                        baseData.ndigit,
                        baseData.objectionPeriond,
                        baseData.settlement
                    ),
                    value
                ),
                uint8(signature[0]),
                signature[1],
                signature[2]
            ) == baseData.ethAddr
        ) {
            /* DO SOMETHING HERE using the validated parameter 'value' */
            settled = true;
        }
    }

}
