/*
 Signature validation for https://www.factsigner.com

 Public repository:
 https://github.com/berlincode/factsigner

 Version 7.0.0


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

pragma solidity ^0.6.1;

library FactsignerVerify {

    struct Signature {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    bytes constant factsignerPrefix = "\x19Factsigner Signed Message:\n32";
    function verifyFactsignerMessage(
        bytes32 message,
        Signature memory signature
    ) internal pure returns (address)
    {
        bytes32 prefixedHash = keccak256(
            abi.encodePacked(
                factsignerPrefix,
                message
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
