// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IDscCircuitVerifier} from "./IDscCircuitVerifier.sol";
import {CircuitConstants} from "../constants/CircuitConstants.sol";

/**
 * @title IIdentityVerificationHubV1
 * @notice Interface for the Identity Verification Hub for verifying zero-knowledge proofs using VC and Disclose circuits.
 * @dev Defines data structures and external functions for verifying proofs and recovering human-readable data.
 */
interface IIdentityVerificationHubV1 {
    /**
     * @notice Registers a DSC key commitment using a DSC circuit proof.
     * @dev Verifies the DSC circuit proof before registering the DSC key commitment.
     * @param dscCircuitVerifierId The identifier for the DSC circuit verifier to be used.
     * @param dscCircuitProof The proof data for the DSC circuit.
     */
    function registerDscKeyCommitment(
        uint256 dscCircuitVerifierId,
        IDscCircuitVerifier.DscCircuitProof memory dscCircuitProof
    )
        external;

    /**
     * @notice Returns the address of the Identity Registry.
     * @return registryAddr The address of the Identity Registry contract.
     */
    function registry() external view returns (address registryAddr);

    /**
     * @notice Retrieves the DSC circuit verifier for a given signature type.
     * @param typeId The signature type identifier.
     * @return verifier The address of the DSC circuit verifier.
     */
    function sigTypeToDscCircuitVerifiers(
        uint256 typeId
    )
        external
        view
        returns (address verifier);
} 