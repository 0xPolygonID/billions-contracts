// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import {U512, uint512, call512} from "@solarity/solidity-lib/libs/bn/U512.sol";

contract TestU512 {
    function u512ModexpU256(
        bytes calldata x,
        bytes calldata y,
        bytes calldata p
    ) public returns (bytes memory, bytes memory) {
        unchecked {
            call512 call = U512.initCall();
            uint512 x_ = U512.fromBytes(x);
            uint512 y_ = U512.fromBytes(y);
            uint512 p_ = U512.fromBytes(p);

            uint512 lhs = U512.modexpU256(call, y_, 2, p_);
            uint512 rhs = U512.modexpU256(call, x_, 3, p_);

            return (U512.toBytes(lhs), U512.toBytes(rhs));
        }
    }

    function callBigModExp(
        bytes32 base,
        bytes32 exponent,
        bytes32 modulus
    ) public returns (bytes32 result) {
        assembly {
            // free memory pointer
            let memPtr := mload(0x40)

            // length of base, exponent, modulus
            mstore(memPtr, 0x20)
            mstore(add(memPtr, 0x20), 0x20)
            mstore(add(memPtr, 0x40), 0x20)

            // assign base, exponent, modulus
            mstore(add(memPtr, 0x60), base)
            mstore(add(memPtr, 0x80), exponent)
            mstore(add(memPtr, 0xa0), modulus)

            // call the precompiled contract BigModExp (0x05)
            let success := call(gas(), 0x05, 0x0, memPtr, 0xc0, memPtr, 0x20)
            switch success
            case 0 {
                revert(0x0, 0x0)
            }
            default {
                result := mload(memPtr)
            }
        }
    }

    function modExp(
        bytes calldata base,
        bytes calldata exponent,
        bytes calldata modulus
    ) public returns (bytes memory) {
        (, bytes memory result) = address(5).call(
            abi.encodePacked(base.length, exponent.length, modulus.length, base, exponent, modulus)
        );
        return result;
    }
}
