// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;

// We import these here to force Hardhat to compile them.
// solhint-disable no-unused-import, max-line-length
import {ProxyAdmin} from "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import {TransparentUpgradeableProxy} from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import {State} from "@iden3/contracts/state/State.sol";
import {Groth16VerifierStateTransition} from "@iden3/contracts/lib/groth16-verifiers/Groth16VerifierStateTransition.sol";
import {CrossChainProofValidator} from "@iden3/contracts/cross-chain/CrossChainProofValidator.sol";
// solhint-enable no-unused-import, max-line-length
