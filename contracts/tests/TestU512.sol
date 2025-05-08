// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import {U512, uint512, call512} from "@solarity/solidity-lib/libs/bn/U512.sol";

contract TestU512 {
  function u512ModexpU256(bytes calldata x, bytes calldata y, bytes calldata p) public returns (bytes memory, bytes memory) {
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
}