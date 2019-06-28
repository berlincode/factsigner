/*
 Contract example for https://www.factsigner.com

 Version 6.0.2
*/

pragma solidity 0.5.10;
pragma experimental ABIEncoderV2;


contract FactSignerExample {

    struct BaseData {
        /* facts (sorted alphabetically) */
        uint8 baseUnitExp; /* */
        bytes32 underlying; /* name */
        int8 ndigit;
        uint32 objectionPeriod; /* */
        uint40 expirationDatetime; /*  */

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
        bytes32 underlying, /* name */
        int8 ndigit,
        uint32 objectionPeriod,
        uint40 expirationDatetime,
        Signature memory signature,
        address signerAddr
    ) public
    {
        bytes32 factHash = calcFactHash(
            baseUnitExp,
            underlying,
            ndigit,
            objectionPeriod,
            expirationDatetime
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
        baseData.underlying = underlying;
        baseData.ndigit = ndigit;
        baseData.objectionPeriod = objectionPeriod;
        baseData.expirationDatetime = expirationDatetime;

        /* address of signing authority (i.e. factsigner.com) */
        baseData.signerAddr = signerAddr;
    }

    function settle (
        int256 value,
        Signature memory signature
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
                            baseData.underlying,
                            baseData.ndigit,
                            baseData.objectionPeriod,
                            baseData.expirationDatetime
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

    function calcFactHash (
        uint8 baseUnitExp,
        bytes32 underlying,
        int8 ndigit,
        uint32 objectionPeriod,
        uint40 expirationDatetime
    ) public pure returns (bytes32)
    {
        return keccak256(
            abi.encodePacked(
                baseUnitExp, /* 'base_unit_exp' = 18 -> base_unit = 10**18 = 1000000000000000000 */
                underlying, /* 'name' utf8 encoded string as bytes32 - unused bytes are filled with \0 */
                ndigit, /* 'ndigit' number of digits (may be negative) */
                objectionPeriod, /* 'objection_period' 3600 seconds */
                expirationDatetime /* 'expirationDatetime' unix epoch seconds UTC */
            )
        );
    }

    /* internal functions */

    function verify(
        bytes32 _message,
        Signature memory signature
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

}
