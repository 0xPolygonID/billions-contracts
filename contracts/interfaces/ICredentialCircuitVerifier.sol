// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;
/**
 * @title ICredentialCircuitVerifier
 * @notice Interface for verifying credential circuit proofs.
 * @dev This interface defines the structure of a credential circuit proof and exposes a function to verify such proofs.
 */
interface ICredentialCircuitVerifier {
    /**
     * @notice Represents a credential circuit proof.
     * @dev This structure encapsulates the required proof elements.
     * @param a An array of two unsigned integers representing the proof component 'a'.
     * @param b A 2x2 array of unsigned integers representing the proof component 'b'.
     * @param c An array of two unsigned integers representing the proof component 'c'.
     * @param pubSignals An array of three unsigned integers representing the public signals associated with the proof.
     */
    struct CredentialCircuitProof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
        uint256[8] pubSignals;
    }

    /**
     * @notice Verifies a given credential circuit proof.
     * @dev This function checks the validity of the provided proof parameters.
     * @param a The 'a' component of the proof.
     * @param b The 'b' component of the proof.
     * @param c The 'c' component of the proof.
     * @param pubSignals The public signals associated with the proof.
     * @return isValid A boolean value indicating whether the provided proof is valid (true) or not (false).
     */
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[8] calldata pubSignals
    ) external view returns (bool isValid);
}
