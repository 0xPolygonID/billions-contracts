// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title IIdentityRegistryV1
 * @notice Interface for the Identity Registry v1.
 * @dev This interface exposes only the external functions accessible by regular callers,
 *      i.e. functions that are not owner-restricted.
 */
interface IIdentityRegistryV1 {
    /**
     * @notice Retrieves the address of the registered identity verification hub.
     * @return The address of the hub.
     */
    function hub() external view returns (address);

    /**
     * @notice Checks if a specific nullifier is already registered for the given attestation.
     * @param attestationId The attestation identifier.
     * @param nullifier The nullifier to check.
     * @return True if the nullifier is registered; otherwise, false.
     */
    function nullifiers(
        bytes32 attestationId,
        uint256 nullifier
    ) external view returns (bool);

    /**
     * @notice Checks whether a DSC key commitment is registered.
     * @param commitment The DSC key commitment to check.
     * @return True if the commitment is registered, false otherwise.
     */
    function isRegisteredDscKeyCommitment(
        uint256 commitment
    ) external view returns (bool);

    /**
     * @notice Retrieves the timestamp at which a given Merkle tree root was created.
     * @param root The Merkle tree root.
     * @return The creation timestamp for the provided root.
     */
    function rootTimestamps(uint256 root) external view returns (uint256);

    /**
     * @notice Retrieves the current CSCA root.
     * @return The current CSCA root value.
     */
    function getCscaRoot() external view returns (uint256);

    /**
     * @notice Checks if the provided CSCA root matches the stored CSCA root.
     * @param root The CSCA root to verify.
     * @return True if the given root equals the stored CSCA root, otherwise false.
     */
    function checkCscaRoot(
        uint256 root
    ) external view returns (bool);

    /**
     * @notice Retrieves the current Merkle root of the DSC key commitments.
     * @return The current DSC key commitment Merkle root.
     */
    function getDscKeyCommitmentMerkleRoot() external view returns (uint256);

    /**
     * @notice Checks if the provided root matches the DSC key commitment Merkle root.
     * @param root The root to check.
     * @return True if it matches the current root, false otherwise.
     */
    function checkDscKeyCommitmentMerkleRoot(
        uint256 root
    ) external view returns (bool);

    /**
     * @notice Retrieves the total number of DSC key commitments in the Merkle tree.
     * @return The DSC key commitment Merkle tree size.
     */
    function getDscKeyCommitmentTreeSize() external view returns (uint256);

    /**
     * @notice Retrieves the index of a specific DSC key commitment in the Merkle tree.
     * @param commitment The DSC key commitment to locate.
     * @return The index of the provided commitment.
     */
    function getDscKeyCommitmentIndex(
        uint256 commitment
    ) external view returns (uint256);

    /**
     * @notice Registers a new DSC key commitment.
     * @dev Must be called by the identity verification hub. Reverts if the DSC key commitment is already registered.
     * @param dscCommitment The DSC key commitment to register.
     */
    function registerDscKeyCommitment(
        uint256 dscCommitment
    ) external;
}
