// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {CircuitConstants} from "./constants/CircuitConstants.sol";
import {Formatter} from "./libraries/Formatter.sol";
import {IIdentityVerificationHubV1} from "./interfaces/IIdentityVerificationHubV1.sol";
import {IIdentityRegistryV1} from "./interfaces/IIdentityRegistryV1.sol";
import {IDscCircuitVerifier} from "./interfaces/IDscCircuitVerifier.sol";
import {ImplRoot} from "./upgradeable/ImplRoot.sol";

/**
 * @notice ⚠️ CRITICAL STORAGE LAYOUT WARNING ⚠️
 * =============================================
 *
 * This contract uses the UUPS upgradeable pattern which makes storage layout EXTREMELY SENSITIVE.
 *
 * 🚫 NEVER MODIFY OR REORDER existing storage variables
 * 🚫 NEVER INSERT new variables between existing ones
 * 🚫 NEVER CHANGE THE TYPE of existing variables
 *
 * ✅ New storage variables MUST be added in one of these two ways ONLY:
 *    1. At the END of the storage layout
 *    2. In a new V2 contract that inherits from this V1
 *
 * Examples of forbidden changes:
 * - Changing uint256 to uint128
 * - Changing bytes32 to bytes
 * - Changing array type to mapping
 *
 * For more detailed information about forbidden changes, please refer to:
 * https://docs.openzeppelin.com/upgrades-plugins/writing-upgradeable#modifying-your-contracts
 *
 * ⚠️ VIOLATION OF THESE RULES WILL CAUSE CATASTROPHIC STORAGE COLLISIONS IN FUTURE UPGRADES ⚠️
 * =============================================
 */

/**
 * @title IdentityVerificationHubStorageV1
 * @notice Storage contract for IdentityVerificationHubImplV1.
 * @dev Inherits from ImplRoot to include upgradeability functionality.
 */
abstract contract IdentityVerificationHubStorageV1 is ImplRoot {
    // ====================================================
    // Storage Variables
    // ====================================================

    /// @notice Address of the Identity Registry.
    address internal _registry;

    /// @notice Mapping from signature type to DSC circuit verifier addresses..
    mapping(uint256 => address) internal _sigTypeToDscCircuitVerifiers;
}

/**
 * @title IdentityVerificationHubImplV1
 * @notice Implementation contract for the Identity Verification Hub.
 * @dev Provides functions for registering commitments and verifying groth16 proofs and inclusion proofs.
 */
contract IdentityVerificationHubImplV1 is
    IdentityVerificationHubStorageV1,
    IIdentityVerificationHubV1
{
    using Formatter for uint256;

    // ====================================================
    // Events
    // ====================================================

    /**
     * @notice Emitted when the hub is initialized.
     * @param registry The address of the registry.
     * @param dscCircuitVerifierIds Array of DSC circuit verifier ids.
     * @param dscCircuitVerifiers Array of DSC circuit verifier addresses.
     */
    event HubInitialized(
        address registry,
        uint256[] dscCircuitVerifierIds,
        address[] dscCircuitVerifiers
    );
    /**
     * @notice Emitted when the registry address is updated.
     * @param registry The new registry address.
     */
    event RegistryUpdated(address registry);

    /**
     * @notice Emitted when a DSC circuit verifier is updated.
     * @param typeId The signature type id.
     * @param verifier The new verifier address for the DSC circuit.
     */
    event DscCircuitVerifierUpdated(uint256 typeId, address verifier);

    // ====================================================
    // Errors
    // ====================================================

    /// @notice Thrown when the lengths of provided arrays do not match.
    /// @dev Used when initializing or updating arrays that must have equal length.
    error LENGTH_MISMATCH();

    /// @notice Thrown when no verifier is set for a given signature type.
    /// @dev Indicates that the mapping lookup for the verifier returned the zero address.
    error NO_VERIFIER_SET();

    /// @notice Thrown when the current date in the proof is not within the valid range.
    /// @dev Ensures that the provided proof's date is within one day of the expected start time.
    error CURRENT_DATE_NOT_IN_VALID_RANGE();

    /// @notice Thrown when the 'older than' attribute in the proof is invalid.
    /// @dev The 'older than' value derived from the proof does not match the expected criteria.
    error INVALID_OLDER_THAN();

    /// @notice Thrown when the DSC circuit proof is invalid.
    /// @dev The DSC circuit verifier did not validate the provided proof.
    error INVALID_DSC_PROOF();

    /// @notice Thrown when the provided commitment root is invalid.
    /// @dev Used in proofs to ensure that the commitment root matches the expected value in the registry.
    error INVALID_COMMITMENT_ROOT();

    /// @notice Thrown when the provided OFAC root is invalid.
    /// @dev Indicates that the OFAC root from the proof does not match the expected OFAC root.
    error INVALID_OFAC_ROOT();

    /// @notice Thrown when the provided CSCA root is invalid.
    /// @dev Indicates that the CSCA root from the DSC proof does not match the expected CSCA root.
    error INVALID_CSCA_ROOT();

    // ====================================================
    // Constructor
    // ====================================================

    /**
     * @notice Constructor that disables initializers.
     * @dev Prevents direct initialization of the implementation contract.
     */
    constructor() {
        _disableInitializers();
    }

    // ====================================================
    // Initializer
    // ====================================================

    /**
     * @notice Initializes the hub implementation.
     * @dev Sets the registry, VC and Disclose circuit verifier address, signature circuit verifiers, and DSC circuit verifiers.
     * @param registryAddress The address of the Identity Registry.
     * @param dscCircuitVerifierIds Array of ids for DSC circuit verifiers.
     * @param dscCircuitVerifierAddresses Array of addresses for DSC circuit verifiers.
     */
    function initialize(
        address registryAddress,
        uint256[] memory dscCircuitVerifierIds,
        address[] memory dscCircuitVerifierAddresses
    ) external initializer {
        __ImplRoot_init();
        _registry = registryAddress;
        if (dscCircuitVerifierIds.length != dscCircuitVerifierAddresses.length) {
            revert LENGTH_MISMATCH();
        }
        for (uint256 i = 0; i < dscCircuitVerifierIds.length; i++) {
            _sigTypeToDscCircuitVerifiers[dscCircuitVerifierIds[i]] = dscCircuitVerifierAddresses[
                i
            ];
        }
        emit HubInitialized(registryAddress, dscCircuitVerifierIds, dscCircuitVerifierAddresses);
    }

    // ====================================================
    // External View Functions
    // ====================================================

    /**
     * @notice Retrieves the registry address.
     * @return The address of the Identity Registry.
     */
    function registry() external view virtual onlyProxy returns (address) {
        return _registry;
    }

    /**
     * @notice Retrieves the DSC circuit verifier address for a given signature type.
     * @param typeId The signature type identifier.
     * @return The DSC circuit verifier address.
     */
    function sigTypeToDscCircuitVerifiers(
        uint256 typeId
    ) external view virtual onlyProxy returns (address) {
        return _sigTypeToDscCircuitVerifiers[typeId];
    }

    // ====================================================
    // External Functions - Registration
    // ====================================================

    /**
     * @notice Registers a DSC key commitment using a DSC circuit proof.
     * @dev Verifies the DSC proof and then calls the Identity Registry to register the dsc key commitment.
     * @param dscCircuitVerifierId The identifier for the DSC circuit verifier to use.
     * @param dscCircuitProof The DSC circuit proof data.
     */
    function registerDscKeyCommitment(
        uint256 dscCircuitVerifierId,
        IDscCircuitVerifier.DscCircuitProof memory dscCircuitProof
    ) external virtual onlyProxy {
        _verifyPassportDscProof(dscCircuitVerifierId, dscCircuitProof);
        IIdentityRegistryV1(_registry).registerDscKeyCommitment(
            dscCircuitProof.pubSignals[CircuitConstants.DSC_TREE_LEAF_INDEX]
        );
    }

    // ====================================================
    // External Functions - Only Owner
    // ====================================================

    /**
     * @notice Updates the registry address.
     * @param registryAddress The new registry address.
     */
    function updateRegistry(address registryAddress) external virtual onlyProxy onlyOwner {
        _registry = registryAddress;
        emit RegistryUpdated(registryAddress);
    }

    /**
     * @notice Updates the DSC circuit verifier for a specific signature type.
     * @param typeId The signature type identifier.
     * @param verifierAddress The new DSC circuit verifier address.
     */
    function updateDscVerifier(
        uint256 typeId,
        address verifierAddress
    ) external virtual onlyProxy onlyOwner {
        _sigTypeToDscCircuitVerifiers[typeId] = verifierAddress;
        emit DscCircuitVerifierUpdated(typeId, verifierAddress);
    }

    /**
     * @notice Batch updates DSC circuit verifiers.
     * @param typeIds An array of signature type identifiers.
     * @param verifierAddresses An array of new DSC circuit verifier addresses.
     */
    function batchUpdateDscCircuitVerifiers(
        uint256[] calldata typeIds,
        address[] calldata verifierAddresses
    ) external virtual onlyProxy onlyOwner {
        if (typeIds.length != verifierAddresses.length) {
            revert LENGTH_MISMATCH();
        }
        for (uint256 i = 0; i < typeIds.length; i++) {
            _sigTypeToDscCircuitVerifiers[typeIds[i]] = verifierAddresses[i];
            emit DscCircuitVerifierUpdated(typeIds[i], verifierAddresses[i]);
        }
    }

    // ====================================================
    // Internal Functions
    // ====================================================

    /**
     * @notice Verifies the passport DSC circuit proof.
     * @dev Uses the DSC circuit verifier specified by dscCircuitVerifierId.
     * @param dscCircuitVerifierId The identifier for the DSC circuit verifier.
     * @param dscCircuitProof The DSC circuit proof data.
     */
    function _verifyPassportDscProof(
        uint256 dscCircuitVerifierId,
        IDscCircuitVerifier.DscCircuitProof memory dscCircuitProof
    ) internal view {
        address verifier = _sigTypeToDscCircuitVerifiers[dscCircuitVerifierId];
        if (verifier == address(0)) {
            revert NO_VERIFIER_SET();
        }

        if (
            !IIdentityRegistryV1(_registry).checkCscaRoot(
                dscCircuitProof.pubSignals[CircuitConstants.DSC_CSCA_ROOT_INDEX]
            )
        ) {
            revert INVALID_CSCA_ROOT();
        }

        if (
            !IDscCircuitVerifier(verifier).verifyProof(
                dscCircuitProof.a,
                dscCircuitProof.b,
                dscCircuitProof.c,
                dscCircuitProof.pubSignals
            )
        ) {
            revert INVALID_DSC_PROOF();
        }
    }
}
