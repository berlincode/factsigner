/*
 Contract defines for https://www.factsigner.com

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

pragma solidity >=0.7.0;

library FactsignerDefines
{
    // TODO we use a enum here as a hack until
    // https://github.com/ethereum/solidity/issues/1290 is solved
    enum ConfigMask {
        ConfigMaskDummy0,
        ConfigMarketTypeIsStrikedMask, // = 1
        ConfigMaskDummy2,
        ConfigMaskDummy3,
        ConfigIntervalTypeIsUsedMask // = 4
    }

    enum SettlementType {
        FINAL, // = 0
        PRELIMINARY_FIRST // = 1
        //PRELIMINARY_MAX // = 65535
    }

    enum MarketInterval {
        NONE, // = 0
        // the following constants are just proposed assignments
        YEARLY, // = 1
        QUATERLY, // 2
        MONTHLY, // = 3
        WEEKLY, // = 4
        DAILY, // = 5
        HOURLY, // = 6
        SHORT_TERM // = 7
    }

}
