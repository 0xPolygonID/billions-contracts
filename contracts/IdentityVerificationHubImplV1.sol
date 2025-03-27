// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {CircuitConstants} from "./constants/CircuitConstants.sol";
import {AttestationId} from "./constants/AttestationId.sol";
import {Formatter} from "./libraries/Formatter.sol";
import {CircuitAttributeHandler} from "./libraries/CircuitAttributeHandler.sol";
import {IIdentityVerificationHubV1} from "./interfaces/IIdentityVerificationHubV1.sol";
import {IIdentityRegistryV1} from "./interfaces/IIdentityRegistryV1.sol";
import {ISignatureCircuitVerifier} from "./interfaces/ISignatureCircuitVerifier.sol";
import {IVcAndDiscloseCircuitVerifier} from "./interfaces/IVcAndDiscloseCircuitVerifier.sol";
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
abstract contract IdentityVerificationHubStorageV1 is 
    ImplRoot 
{
    // ====================================================
    // Storage Variables
    // ====================================================
    
    /// @notice Address of the Identity Registry.
    address internal _registry;

    /// @notice Address of the VC and Disclose circuit verifier.
    address internal _vcAndDiscloseCircuitVerifier;

    /// @notice Mapping from signature type to signature circuit verifier addresses.
    mapping(uint256 => address) internal _sigTypeToSignatureCircuitVerifiers;

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

    uint256 constant MAX_FORBIDDEN_COUNTRIES_LIST_LENGTH = 40;

    // ====================================================
    // Events
    // ====================================================

    /**
     * @notice Emitted when the hub is initialized.
     * @param registry The address of the registry.
     * @param vcAndDiscloseCircuitVerifier The address of the VC and Disclose circuit verifier.
     * @param signatureCircuitVerifierIds Array of signature circuit verifier ids.
     * @param signatureCircuitVerifiers Array of signature circuit verifier addresses.
     * @param dscCircuitVerifierIds Array of DSC circuit verifier ids.
     * @param dscCircuitVerifiers Array of DSC circuit verifier addresses.
     */
    event HubInitialized(
        address registry, 
        address vcAndDiscloseCircuitVerifier,
        uint256[] signatureCircuitVerifierIds,
        address[] signatureCircuitVerifiers,
        uint256[] dscCircuitVerifierIds,
        address[] dscCircuitVerifiers
    );
    /**
     * @notice Emitted when the registry address is updated.
     * @param registry The new registry address.
     */
    event RegistryUpdated(address registry);
    /**
     * @notice Emitted when the VC and Disclose circuit verifier is updated.
     * @param vcAndDiscloseCircuitVerifier The new VC and Disclose circuit verifier address.
     */
    event VcAndDiscloseCircuitUpdated(address vcAndDiscloseCircuitVerifier);
    /**
     * @notice Emitted when a signature circuit verifier is updated.
     * @param typeId The signature type id.
     * @param verifier The new verifier address for the signature circuit.
     */
    event SignatureCircuitVerifierUpdated(uint256 typeId, address verifier);
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
    
    /// @notice Thrown when the provided forbidden countries list is invalid.
    /// @dev The forbidden countries list in the proof does not match the expected packed data.
    error INVALID_FORBIDDEN_COUNTRIES();
    
    /// @notice Thrown when the OFAC check fails.
    /// @dev Indicates that the proof did not satisfy the required OFAC conditions.
    error INVALID_OFAC();
    
    /// @notice Thrown when the signature circuit proof is invalid.
    /// @dev The signature circuit verifier did not validate the provided proof.
    error INVALID_SIGNATURE_PROOF();
    
    /// @notice Thrown when the DSC circuit proof is invalid.
    /// @dev The DSC circuit verifier did not validate the provided proof.
    error INVALID_DSC_PROOF();
    
    /// @notice Thrown when the VC and Disclose proof is invalid.
    /// @dev The VC and Disclose circuit verifier did not validate the provided proof.
    error INVALID_VC_AND_DISCLOSE_PROOF();
    
    /// @notice Thrown when the provided commitment root is invalid.
    /// @dev Used in proofs to ensure that the commitment root matches the expected value in the registry.
    error INVALID_COMMITMENT_ROOT();
    
    /// @notice Thrown when the provided OFAC root is invalid.
    /// @dev Indicates that the OFAC root from the proof does not match the expected OFAC root.
    error INVALID_OFAC_ROOT();
    
    /// @notice Thrown when the provided CSCA root is invalid.
    /// @dev Indicates that the CSCA root from the DSC proof does not match the expected CSCA root.
    error INVALID_CSCA_ROOT();
    
    /// @notice Thrown when the revealed data type is invalid or not supported.
    /// @dev Raised during the processing of revealed data if it does not match any supported type.
    error INVALID_REVEALED_DATA_TYPE();

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
     * @param vcAndDiscloseCircuitVerifierAddress The address of the VC and Disclose circuit verifier.
     * @param signatureCircuitVerifierIds Array of ids for signature circuit verifiers.
     * @param signatureCircuitVerifierAddresses Array of addresses for signature circuit verifiers.
     * @param dscCircuitVerifierIds Array of ids for DSC circuit verifiers.
     * @param dscCircuitVerifierAddresses Array of addresses for DSC circuit verifiers.
     */
    function initialize(
        address registryAddress,
        address vcAndDiscloseCircuitVerifierAddress,
        uint256[] memory signatureCircuitVerifierIds,
        address[] memory signatureCircuitVerifierAddresses,
        uint256[] memory dscCircuitVerifierIds,
        address[] memory dscCircuitVerifierAddresses
    ) external initializer {
        __ImplRoot_init();
        _registry = registryAddress;
        _vcAndDiscloseCircuitVerifier = vcAndDiscloseCircuitVerifierAddress;
        if (signatureCircuitVerifierIds.length != signatureCircuitVerifierAddresses.length) {
            revert LENGTH_MISMATCH();
        }
        if (dscCircuitVerifierIds.length != dscCircuitVerifierAddresses.length) {
            revert LENGTH_MISMATCH();
        }
        for (uint256 i = 0; i < signatureCircuitVerifierIds.length; i++) {
            _sigTypeToSignatureCircuitVerifiers[signatureCircuitVerifierIds[i]] = signatureCircuitVerifierAddresses[i];
        }
        for (uint256 i = 0; i < dscCircuitVerifierIds.length; i++) {
            _sigTypeToDscCircuitVerifiers[dscCircuitVerifierIds[i]] = dscCircuitVerifierAddresses[i];
        }
        emit HubInitialized(
            registryAddress, 
            vcAndDiscloseCircuitVerifierAddress,
            signatureCircuitVerifierIds,
            signatureCircuitVerifierAddresses,
            dscCircuitVerifierIds,
            dscCircuitVerifierAddresses
        );
    }

    // ====================================================
    // External View Functions
    // ====================================================

    /**
     * @notice Retrieves the registry address.
     * @return The address of the Identity Registry.
     */
    function registry() 
        external
        virtual
        onlyProxy
        view 
        returns (address) 
    {
        return _registry;
    }

    /**
     * @notice Retrieves the VC and Disclose circuit verifier address.
     * @return The address of the VC and Disclose circuit verifier.
     */
    function vcAndDiscloseCircuitVerifier() 
        external
        virtual
        onlyProxy
        view 
        returns (address) 
    {
        return _vcAndDiscloseCircuitVerifier;
    }

    /**
     * @notice Retrieves the signature circuit verifier address for a given signature type.
     * @param typeId The signature type identifier.
     * @return The signature circuit verifier address.
     */
    function sigTypeToSignatureCircuitVerifiers(
        uint256 typeId
    ) 
        external
        virtual
        onlyProxy
        view 
        returns (address) 
    {
        return _sigTypeToSignatureCircuitVerifiers[typeId];
    }

    /**
     * @notice Retrieves the DSC circuit verifier address for a given signature type.
     * @param typeId The signature type identifier.
     * @return The DSC circuit verifier address.
     */
    function sigTypeToDscCircuitVerifiers(
        uint256 typeId
    ) 
        external
        virtual
        onlyProxy
        view 
        returns (address) 
    {
        return _sigTypeToDscCircuitVerifiers[typeId];
    }

    /**
     * @notice Converts packed revealed data into a human-readable format.
     * @dev Uses Formatter and CircuitAttributeHandler to decode the data.
     * @param revealedDataPacked An array of three packed uint256 values.
     * @param types An array of RevealedDataType indicating the types of data expected.
     * @return A ReadableRevealedData struct containing the decoded data.
     */
    function getReadableRevealedData(
        uint256[3] memory revealedDataPacked,
        RevealedDataType[] memory types
    )
        external
        virtual
        onlyProxy
        view
        returns (ReadableRevealedData memory)
    {
        bytes memory charcodes = Formatter.fieldElementsToBytes(
            revealedDataPacked
        );

        ReadableRevealedData memory attrs;

        for (uint256 i = 0; i < types.length; i++) {
            RevealedDataType dataType = types[i];
            if (dataType == RevealedDataType.ISSUING_STATE) {
                attrs.issuingState = CircuitAttributeHandler.getIssuingState(charcodes);
            } else if (dataType == RevealedDataType.NAME) {
                attrs.name = CircuitAttributeHandler.getName(charcodes);
            } else if (dataType == RevealedDataType.PASSPORT_NUMBER) {
                attrs.passportNumber = CircuitAttributeHandler.getPassportNumber(charcodes);
            } else if (dataType == RevealedDataType.NATIONALITY) {
                attrs.nationality = CircuitAttributeHandler.getNationality(charcodes);
            } else if (dataType == RevealedDataType.DATE_OF_BIRTH) {
                attrs.dateOfBirth = CircuitAttributeHandler.getDateOfBirth(charcodes);
            } else if (dataType == RevealedDataType.GENDER) {
                attrs.gender = CircuitAttributeHandler.getGender(charcodes);
            } else if (dataType == RevealedDataType.EXPIRY_DATE) {
                attrs.expiryDate = CircuitAttributeHandler.getExpiryDate(charcodes);
            } else if (dataType == RevealedDataType.OLDER_THAN) {
                attrs.olderThan = CircuitAttributeHandler.getOlderThan(charcodes);
            } else if (dataType == RevealedDataType.PASSPORT_NO_OFAC) {
                attrs.passportNoOfac = CircuitAttributeHandler.getPassportNoOfac(charcodes);
            } else if (dataType == RevealedDataType.NAME_AND_DOB_OFAC) {
                attrs.nameAndDobOfac = CircuitAttributeHandler.getNameAndDobOfac(charcodes);
            } else if (dataType == RevealedDataType.NAME_AND_YOB_OFAC) {
                attrs.nameAndYobOfac = CircuitAttributeHandler.getNameAndYobOfac(charcodes);
            }
        }

        return attrs;
    }

    /**
     * @notice Extracts the forbidden countries list from packed data.
     * @param forbiddenCountriesListPacked Packed data representing forbidden countries.
     * @return An array of strings with a maximum length of MAX_FORBIDDEN_COUNTRIES_LIST_LENGTH.
     */
    function getReadableForbiddenCountries(
        uint256[4] memory forbiddenCountriesListPacked
    )
        external
        virtual
        onlyProxy
        view
        returns (string[MAX_FORBIDDEN_COUNTRIES_LIST_LENGTH] memory)
    {
        return Formatter.extractForbiddenCountriesFromPacked(forbiddenCountriesListPacked);
    }

    /**
     * @notice Verifies the VC and Disclose proof.
     * @dev Checks commitment roots, OFAC root, current date range, and other attributes depending on verification configuration.
     * @param proof The VcAndDiscloseHubProof containing the proof data.
     * @return result A VcAndDiscloseVerificationResult struct with the verification results.
     */
    function verifyVcAndDisclose(
        VcAndDiscloseHubProof memory proof
    )
        external
        virtual
        view
        onlyProxy
        returns (VcAndDiscloseVerificationResult memory)
    {
        VcAndDiscloseVerificationResult memory result;
        
        result.identityCommitmentRoot = _verifyVcAndDiscloseProof(proof);

        for (uint256 i = 0; i < 3; i++) {
            result.revealedDataPacked[i] = proof.vcAndDiscloseProof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_REVEALED_DATA_PACKED_INDEX + i];
        }
        for (uint256 i = 0; i < 4; i++) {
            result.forbiddenCountriesListPacked[i] = proof.vcAndDiscloseProof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_FORBIDDEN_COUNTRIES_LIST_PACKED_INDEX + i];
        }
        result.nullifier = proof.vcAndDiscloseProof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_NULLIFIER_INDEX];
        result.attestationId = proof.vcAndDiscloseProof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_ATTESTATION_ID_INDEX];
        result.userIdentifier = proof.vcAndDiscloseProof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_USER_IDENTIFIER_INDEX];
        result.scope = proof.vcAndDiscloseProof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_SCOPE_INDEX];
        return result;
    }

    // ====================================================
    // External Functions - Registration
    // ====================================================

    /**
     * @notice Registers a passport commitment using a signature circuit proof.
     * @dev Verifies the proof and then calls the Identity Registry to signature the commitment.
     * @param signatureCircuitVerifierId The identifier for the signature circuit verifier to use.
     * @param signatureCircuitProof The signature circuit proof data.
     */
    function registerPassportCommitment(
        uint256 signatureCircuitVerifierId,
        ISignatureCircuitVerifier.SignatureCircuitProof memory signatureCircuitProof
    ) 
        external
        virtual
        onlyProxy
    {
        _verifyPassportSignatureProof(signatureCircuitVerifierId, signatureCircuitProof);
        IIdentityRegistryV1(_registry).registerCommitment(
            AttestationId.E_PASSPORT,
            signatureCircuitProof.pubSignals[CircuitConstants.SIGNATURE_NULLIFIER_INDEX],
            signatureCircuitProof.pubSignals[CircuitConstants.SIGNATURE_COMMITMENT_INDEX]
        );
    }

    /**
     * @notice Registers a DSC key commitment using a DSC circuit proof.
     * @dev Verifies the DSC proof and then calls the Identity Registry to register the dsc key commitment.
     * @param dscCircuitVerifierId The identifier for the DSC circuit verifier to use.
     * @param dscCircuitProof The DSC circuit proof data.
     */
    function registerDscKeyCommitment(
        uint256 dscCircuitVerifierId,
        IDscCircuitVerifier.DscCircuitProof memory dscCircuitProof
    )
        external
        virtual
        onlyProxy
    {
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
    function updateRegistry(
        address registryAddress
    ) 
        external 
        virtual
        onlyProxy
        onlyOwner 
    {
        _registry = registryAddress;
        emit RegistryUpdated(registryAddress);
    }

    /**
     * @notice Updates the VC and Disclose circuit verifier address.
     * @param vcAndDiscloseCircuitVerifierAddress The new VC and Disclose circuit verifier address.
     */
    function updateVcAndDiscloseCircuit(
        address vcAndDiscloseCircuitVerifierAddress
    ) 
        external 
        virtual
        onlyProxy
        onlyOwner 
    {
        _vcAndDiscloseCircuitVerifier = vcAndDiscloseCircuitVerifierAddress;
        emit VcAndDiscloseCircuitUpdated(vcAndDiscloseCircuitVerifierAddress);
    }

    /**
     * @notice Updates the signature circuit verifier for a specific signature type.
     * @param typeId The signature type identifier.
     * @param verifierAddress The new signature circuit verifier address.
     */
    function updateSignatureCircuitVerifier(
        uint256 typeId, 
        address verifierAddress
    ) 
        external 
        virtual
        onlyProxy
        onlyOwner 
    {
        _sigTypeToSignatureCircuitVerifiers[typeId] = verifierAddress;
        emit SignatureCircuitVerifierUpdated(typeId, verifierAddress);
    }

    /**
     * @notice Updates the DSC circuit verifier for a specific signature type.
     * @param typeId The signature type identifier.
     * @param verifierAddress The new DSC circuit verifier address.
     */
    function updateDscVerifier(
        uint256 typeId, 
        address verifierAddress
    ) 
        external 
        virtual
        onlyProxy
        onlyOwner 
    {
        _sigTypeToDscCircuitVerifiers[typeId] = verifierAddress;
        emit DscCircuitVerifierUpdated(typeId, verifierAddress);
    }

    /**
     * @notice Batch updates signature circuit verifiers.
     * @param typeIds An array of signature type identifiers.
     * @param verifierAddresses An array of new signature circuit verifier addresses.
     */
    function batchUpdateSignatureCircuitVerifiers(
        uint256[] calldata typeIds,
        address[] calldata verifierAddresses
    ) 
        external 
        virtual
        onlyProxy
        onlyOwner 
    {
        if (typeIds.length != verifierAddresses.length) {
            revert LENGTH_MISMATCH();
        }
        for (uint256 i = 0; i < typeIds.length; i++) {
            _sigTypeToSignatureCircuitVerifiers[typeIds[i]] = verifierAddresses[i];
            emit SignatureCircuitVerifierUpdated(typeIds[i], verifierAddresses[i]);
        }
    }

    /**
     * @notice Batch updates DSC circuit verifiers.
     * @param typeIds An array of signature type identifiers.
     * @param verifierAddresses An array of new DSC circuit verifier addresses.
     */
    function batchUpdateDscCircuitVerifiers(
        uint256[] calldata typeIds,
        address[] calldata verifierAddresses
    ) 
        external
        virtual
        onlyProxy
        onlyOwner 
    {
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
     * @notice Verifies the VC and Disclose proof.
     * @dev Checks commitment roots, OFAC root, current date range, and other attributes depending on verification configuration.
     * @param proof The VcAndDiscloseHubProof containing the proof data.
     * @return identityCommitmentRoot The verified identity commitment root from the proof.
     */
    function _verifyVcAndDiscloseProof(
        VcAndDiscloseHubProof memory proof
    ) 
        internal
        view
        returns (uint256 identityCommitmentRoot)
    {
        // verify identity commitment root
        if (!IIdentityRegistryV1(_registry).checkIdentityCommitmentRoot(proof.vcAndDiscloseProof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_MERKLE_ROOT_INDEX])) {
            revert INVALID_COMMITMENT_ROOT();
        }

        // verify current date
        uint[6] memory dateNum;
        for (uint256 i = 0; i < 6; i++) {
            dateNum[i] = proof.vcAndDiscloseProof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_CURRENT_DATE_INDEX + i];
        }

        uint currentTimestamp = Formatter.proofDateToUnixTimestamp(dateNum);
        if(
            currentTimestamp < _getStartOfDayTimestamp() - 1 days + 1 ||
            currentTimestamp > _getStartOfDayTimestamp() + 1 days - 1
        ) {
            revert CURRENT_DATE_NOT_IN_VALID_RANGE();
        }

        // verify attributes
        uint256[3] memory revealedDataPacked;
        for (uint256 i = 0; i < 3; i++) {
            revealedDataPacked[i] = proof.vcAndDiscloseProof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_REVEALED_DATA_PACKED_INDEX + i];
        }
        if (proof.olderThanEnabled) {
            if (!CircuitAttributeHandler.compareOlderThan(Formatter.fieldElementsToBytes(revealedDataPacked), proof.olderThan)) {
                revert INVALID_OLDER_THAN();
            }
        }
        if (proof.ofacEnabled[0] || proof.ofacEnabled[1] || proof.ofacEnabled[2]) {
            if (!CircuitAttributeHandler.compareOfac(
                Formatter.fieldElementsToBytes(revealedDataPacked),
                proof.ofacEnabled[0],
                proof.ofacEnabled[1],
                proof.ofacEnabled[2]
            )) {
                revert INVALID_OFAC();
            }
            if (!IIdentityRegistryV1(_registry).checkOfacRoots(
                proof.vcAndDiscloseProof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_PASSPORT_NO_SMT_ROOT_INDEX],
                proof.vcAndDiscloseProof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_NAME_DOB_SMT_ROOT_INDEX],
                proof.vcAndDiscloseProof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_NAME_YOB_SMT_ROOT_INDEX]
            )) {
                revert INVALID_OFAC_ROOT();
            }
        }
        if (proof.forbiddenCountriesEnabled) {
            for (uint256 i = 0; i < 4; i++) {
                if (
                    proof.forbiddenCountriesListPacked[i] != proof.vcAndDiscloseProof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_FORBIDDEN_COUNTRIES_LIST_PACKED_INDEX + i]
                ) {
                    revert INVALID_FORBIDDEN_COUNTRIES();
                }
            }
        }

        // verify the proof using the VC and Disclose circuit verifier
        if (!IVcAndDiscloseCircuitVerifier(_vcAndDiscloseCircuitVerifier).verifyProof(proof.vcAndDiscloseProof.a, proof.vcAndDiscloseProof.b, proof.vcAndDiscloseProof.c, proof.vcAndDiscloseProof.pubSignals)) {
            revert INVALID_VC_AND_DISCLOSE_PROOF();
        }

        return proof.vcAndDiscloseProof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_MERKLE_ROOT_INDEX];
    }

    /**
     * @notice Verifies the passport signature circuit proof.
     * @dev Uses the signature circuit verifier specified by signatureCircuitVerifierId.
     * @param signatureCircuitVerifierId The identifier for the signature circuit verifier.
     * @param signatureCircuitProof The signature circuit proof data.
     */
    function _verifyPassportSignatureProof(
        uint256 signatureCircuitVerifierId,
        ISignatureCircuitVerifier.SignatureCircuitProof memory signatureCircuitProof
    ) 
        internal
        view
    {
        address verifier = _sigTypeToSignatureCircuitVerifiers[signatureCircuitVerifierId];
        if (verifier == address(0)) {
            revert NO_VERIFIER_SET();
        }

        if (!IIdentityRegistryV1(_registry).checkDscKeyCommitmentMerkleRoot(signatureCircuitProof.pubSignals[CircuitConstants.SIGNATURE_MERKLE_ROOT_INDEX])) {
            revert INVALID_COMMITMENT_ROOT();
        }

        if(!ISignatureCircuitVerifier(verifier).verifyProof(
            signatureCircuitProof.a,
            signatureCircuitProof.b,
            signatureCircuitProof.c,
            signatureCircuitProof.pubSignals
        )) {
            revert INVALID_SIGNATURE_PROOF();
        }
    }

    /**
     * @notice Verifies the passport DSC circuit proof.
     * @dev Uses the DSC circuit verifier specified by dscCircuitVerifierId.
     * @param dscCircuitVerifierId The identifier for the DSC circuit verifier.
     * @param dscCircuitProof The DSC circuit proof data.
     */
    function _verifyPassportDscProof(
        uint256 dscCircuitVerifierId,
        IDscCircuitVerifier.DscCircuitProof memory dscCircuitProof
    ) 
        internal
        view
    {
        address verifier = _sigTypeToDscCircuitVerifiers[dscCircuitVerifierId];
        if (verifier == address(0)) {
            revert NO_VERIFIER_SET();
        }

        if (!IIdentityRegistryV1(_registry).checkCscaRoot(dscCircuitProof.pubSignals[CircuitConstants.DSC_CSCA_ROOT_INDEX])) {
            revert INVALID_CSCA_ROOT();
        }

        if(!IDscCircuitVerifier(verifier).verifyProof(
            dscCircuitProof.a,
            dscCircuitProof.b,
            dscCircuitProof.c,
            dscCircuitProof.pubSignals
        )) {
            revert INVALID_DSC_PROOF();
        }
    }

    /**
     * @notice Retrieves the timestamp for the start of the current day.
     * @dev Calculated by subtracting the remainder of block.timestamp modulo 1 day.
     * @return The Unix timestamp representing the start of the day.
     */
    function _getStartOfDayTimestamp() internal view returns (uint256) {
        return block.timestamp - (block.timestamp % 1 days);
    }
}