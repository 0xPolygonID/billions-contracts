// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import {IdentityLib} from "@iden3/contracts/lib/IdentityLib.sol";
import {IdentityBase} from "@iden3/contracts/lib/IdentityBase.sol";
import {ICredentialCircuitVerifier} from "../interfaces/ICredentialCircuitVerifier.sol";
import {ISignatureCircuitVerifier} from "../interfaces/ISignatureCircuitVerifier.sol";
import {CircuitConstants} from "../constants/CircuitConstants.sol";
import {IIdentityRegistryV1} from "../interfaces/IIdentityRegistryV1.sol";
import {ImplRoot} from "../upgradeable/ImplRoot.sol";

error InvalidResponsesLength(uint256 length, uint256 expectedLength);
error InvalidLinkId(uint256 linkId1, uint256 linkId2);
error InvalidHashIndex(uint256 hashIndex);
error InvalidHashValue(uint256 hashValue);
error InvalidTemplateRoot(uint256 templateRoot, uint256 expectedTemplateRoot);
error CurrentDateExpired(uint256 currentDate);
error IssuanceDateExpired(uint256 issuanceDate);
error NullifierAlreadyExists(uint256 nullifier);
error LengthMismatch(uint256 length1, uint256 length2);
error NoVerifierSet();
error InvalidDscCommitmentRoot();
error InvalidCredentialProof();
error InvalidSignatureProof();

/**
 * @dev Address ownership credential issuer.
 * This issuer issue non-merklized credentials decentralized.
 */
contract PassportCredentialIssuerImplV1 is IdentityBase, ImplRoot {
    using IdentityLib for IdentityLib.Data;

    /// @custom:storage-location erc7201:polygonid.storage.PassportCredentialIssuerV1
    struct PassportCredentialIssuerV1Storage {
        uint256 _expirationTime;
        uint256 _templateRoot;
        mapping(uint256 => bool) _nullifiers;
        address _registry;
        mapping(string circuitId => address verifier) _credentialVerifiers;
        mapping(string circuitId => address verifier) _signatureVerifiers;
    }

    // check if the hash was calculated correctly
    // keccak256(abi.encode(uint256(keccak256("polygonid.storage.PassportCredentialIssuerV1")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant PassportCredentialIssuerV1StorageLocation =
        0xd64ab600136c76c630ed81a54cc1acbcc213dadb956fdd8687dc5ebb0bb5f500;

    function _getPassportCredentialIssuerV1Storage()
        private
        pure
        returns (PassportCredentialIssuerV1Storage storage store)
    {
        assembly {
            store.slot := PassportCredentialIssuerV1StorageLocation
        }
    }

    /**
     * @notice Emitted when a credential circuit verifier is updated.
     * @param circuitId The credential circuit id.
     * @param verifier The new verifier address for the credential circuit.
     */
    event CredentialCircuitVerifierUpdated(string circuitId, address verifier);
    /**
     * @notice Emitted when a signature circuit verifier is updated.
     * @param circuitId The signature circuit id.
     * @param verifier The new verifier address for the signature circuit.
     */
    event SignatureCircuitVerifierUpdated(string circuitId, address verifier);
    /**
     * @notice Emitted when the registry address is updated.
     * @param registry The new registry address.
     */
    event RegistryUpdated(address registry);
    /**
     * @notice Emitted when the expiration time is updated.
     * @param expirationTime The new expiration time.
     */
    event ExpirationTimeUpdated(uint256 expirationTime);
    /**
     * @notice Emitted when the template root is updated.
     * @param tampletRoot The new template root.
     */
    event TemplateRootUpdated(uint256 tampletRoot);

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

    function initializeIssuer(
        uint256 expirationTime,
        uint256 templateRoot,
        address registry,
        string[] memory credentialCircuitIds,
        address[] memory credentialVerifierAddresses,
        string[] memory signatureCircuitIds,
        address[] memory signatureVerifierAddresses,
        address stateAddress,
        bytes2 idType
    ) public initializer {
        super.initialize(stateAddress, idType);
        __Ownable_init(msg.sender);

        PassportCredentialIssuerV1Storage storage $ = _getPassportCredentialIssuerV1Storage();
        $._expirationTime = expirationTime;
        $._templateRoot = templateRoot;
        $._registry = registry;
        if (credentialCircuitIds.length != credentialVerifierAddresses.length) {
            revert LengthMismatch(credentialCircuitIds.length, credentialVerifierAddresses.length);
        }
        if (signatureCircuitIds.length != signatureVerifierAddresses.length) {
            revert LengthMismatch(signatureCircuitIds.length, signatureVerifierAddresses.length);
        }
        for (uint256 i = 0; i < credentialCircuitIds.length; i++) {
            $._credentialVerifiers[credentialCircuitIds[i]] = credentialVerifierAddresses[i];
        }
        for (uint256 i = 0; i < signatureCircuitIds.length; i++) {
            $._signatureVerifiers[signatureCircuitIds[i]] = signatureVerifierAddresses[i];
        }
    }

    /**
     * @notice Retrieves the Identity Registry address.
     * @return The address of the Identity Registry.
     */
    function getRegistry() external view virtual onlyProxy returns (address) {
        return _getPassportCredentialIssuerV1Storage()._registry;
    }

    /**
     * @notice Sets the Identity Registry address.
     * @param registry The new Identity Registry address.
     */
    function setRegistry(address registry) external onlyProxy onlyOwner {
        _getPassportCredentialIssuerV1Storage()._registry = registry;
        emit RegistryUpdated(registry);
    }

    /**
     * @notice Retrieves the expiration time.
     * @return The expiration time.
     */
    function getExpirationTime() external view virtual onlyProxy onlyOwner returns (uint256) {
        return _getPassportCredentialIssuerV1Storage()._expirationTime;
    }

    /**
     * @notice Sets the expiration time.
     * @param expirationTime The new expiration time.
     */
    function setExpirationTime(uint256 expirationTime) external onlyProxy onlyOwner {
        _getPassportCredentialIssuerV1Storage()._expirationTime = expirationTime;
        emit ExpirationTimeUpdated(expirationTime);
    }

    /**
     * @notice Retrieves the template root.
     * @return The template root.
     */
    function getTemplateRoot() external view virtual onlyProxy returns (uint256) {
        return _getPassportCredentialIssuerV1Storage()._templateRoot;
    }

    /**
     * @notice Sets the template root.
     * @param templateRoot The new template root.
     */
    function setTemplateRoot(uint256 templateRoot) external onlyProxy onlyOwner {
        _getPassportCredentialIssuerV1Storage()._templateRoot = templateRoot;
        emit TemplateRootUpdated(templateRoot);
    }

    /**
     * @dev Updates the signature circuit verifiers for a specific circuit identifiers.
     * @param circuitIds The signature circuit identifiers.
     * @param verifierAddresses The new signature circuit verifier addresses.
     */
    function updateSignatureVerifiers(
        string[] memory circuitIds,
        address[] memory verifierAddresses
    ) external virtual onlyProxy onlyOwner {
        PassportCredentialIssuerV1Storage storage $ = _getPassportCredentialIssuerV1Storage();
        if (circuitIds.length != verifierAddresses.length) {
            revert LengthMismatch(circuitIds.length, verifierAddresses.length);
        }
        for (uint256 i = 0; i < circuitIds.length; i++) {
            $._signatureVerifiers[circuitIds[i]] = verifierAddresses[i];
            emit SignatureCircuitVerifierUpdated(circuitIds[i], verifierAddresses[i]);
        }
    }

    /**
     * @dev Updates the credential circuit verifiers for a specific circuit identifiers.
     * @param circuitIds The credential circuit identifiers.
     * @param verifierAddresses The new credential circuit verifier addresses.
     */
    function updateCredentialVerifiers(
        string[] memory circuitIds,
        address[] memory verifierAddresses
    ) external virtual onlyProxy onlyOwner {
        PassportCredentialIssuerV1Storage storage $ = _getPassportCredentialIssuerV1Storage();
        if (circuitIds.length != verifierAddresses.length) {
            revert LengthMismatch(circuitIds.length, verifierAddresses.length);
        }
        for (uint256 i = 0; i < circuitIds.length; i++) {
            $._credentialVerifiers[circuitIds[i]] = verifierAddresses[i];
            emit CredentialCircuitVerifierUpdated(circuitIds[i], verifierAddresses[i]);
        }
    }

    /**
     * @notice Retrieves the credential verifier address for a given circuit id.
     * @param circuitId The circuit id identifier.
     * @return The credential verifier address.
     */
    function credentialVerifiers(
        string memory circuitId
    ) external view virtual onlyProxy returns (address) {
        return _getPassportCredentialIssuerV1Storage()._credentialVerifiers[circuitId];
    }

    /**
     * @notice Retrieves the signature verifier address for a given circuit id.
     * @param circuitId The circuit id identifier.
     * @return The signature verifier address.
     */
    function signatureVerifiers(
        string memory circuitId
    ) external view virtual onlyProxy returns (address) {
        return _getPassportCredentialIssuerV1Storage()._signatureVerifiers[circuitId];
    }

    function cleanNullifier(uint256 nullifier) public onlyOwner {
        PassportCredentialIssuerV1Storage storage $ = _getPassportCredentialIssuerV1Storage();
        require($._nullifiers[nullifier], "Nullifier does not exist");
        $._nullifiers[nullifier] = false;
    }

    function verifyPassportCredential(
        string memory credentialCircuitId,
        ICredentialCircuitVerifier.CredentialCircuitProof memory credentialCircuitProof,
        string memory signatureCircuitId,
        ISignatureCircuitVerifier.SignatureCircuitProof memory signatureCircuitProof
    ) external {
        _verifyCredentialProof(credentialCircuitId, credentialCircuitProof);
        _verifySignatureProof(signatureCircuitId, signatureCircuitProof);
        _afterProofsSubmit(credentialCircuitProof, signatureCircuitProof);
    }

    function _validatePublicInputs(
        uint256 hashIndex,
        uint256 hashValue,
        uint256 currentDate,
        uint256 issuanceDate,
        uint256 templateRoot,
        uint256 linkIdCredentialProof,
        uint256 linkIdSignatureProof,
        uint256 nullifier,
        uint256 merkleRoot
    ) private view {
        PassportCredentialIssuerV1Storage storage $ = _getPassportCredentialIssuerV1Storage();
        if (hashIndex == 0) revert InvalidHashIndex(hashIndex);
        if (hashValue == 0) revert InvalidHashValue(hashValue);

        if (templateRoot != $._templateRoot)
            revert InvalidTemplateRoot(templateRoot, $._templateRoot);

        // TODO: uncomment this when the linkId check is verified and ready
        /* if (linkIdSignatureProof != linkIdCredentialProof)
            revert InvalidLinkId(linkIdSignatureProof, linkIdCredentialProof);
        */
        // TODO: uncomment this when currentDate is comparable to block.timestamp
        /*if (currentDate + $._expirationTime < block.timestamp)
            revert CurrentDateExpired(currentDate);*/
        if (issuanceDate + $._expirationTime < block.timestamp)
            revert IssuanceDateExpired(issuanceDate);

        if ($._nullifiers[nullifier]) revert NullifierAlreadyExists(nullifier);
    }

    function _addHashAndTransit(uint256 hi, uint256 hv) private {
        _getIdentityBaseStorage().identity.addClaimHash(hi, hv);
        _getIdentityBaseStorage().identity.transitState();
    }

    function _setNullifier(uint256 nullifier) private {
        PassportCredentialIssuerV1Storage storage $ = _getPassportCredentialIssuerV1Storage();
        $._nullifiers[nullifier] = true;
    }

    function _verifyCredentialProof(
        string memory credentialCircuitId,
        ICredentialCircuitVerifier.CredentialCircuitProof memory credentialCircuitProof
    ) internal view {
        PassportCredentialIssuerV1Storage storage $ = _getPassportCredentialIssuerV1Storage();
        address verifier = $._credentialVerifiers[credentialCircuitId];
        if (verifier == address(0)) {
            revert NoVerifierSet();
        }

        if (
            !ICredentialCircuitVerifier(verifier).verifyProof(
                credentialCircuitProof.a,
                credentialCircuitProof.b,
                credentialCircuitProof.c,
                credentialCircuitProof.pubSignals
            )
        ) {
            revert InvalidCredentialProof();
        }
    }

    function _verifySignatureProof(
        string memory signatureCircuitId,
        ISignatureCircuitVerifier.SignatureCircuitProof memory signatureCircuitProof
    ) internal view {
        PassportCredentialIssuerV1Storage storage $ = _getPassportCredentialIssuerV1Storage();
        address verifier = $._signatureVerifiers[signatureCircuitId];
        if (verifier == address(0)) {
            revert NoVerifierSet();
        }

        // TODO: uncomment this when the registry is ready
        /* 
        if (
            !IIdentityRegistryV1($._registry).checkDscKeyCommitmentMerkleRoot(
                signatureCircuitProof.pubSignals[CircuitConstants.SIGNATURE_MERKLE_ROOT_INDEX]
            )
        ) {
            revert InvalidDscCommitmentRoot();
        } */

        if (
            !ISignatureCircuitVerifier(verifier).verifyProof(
                signatureCircuitProof.a,
                signatureCircuitProof.b,
                signatureCircuitProof.c,
                signatureCircuitProof.pubSignals
            )
        ) {
            revert InvalidSignatureProof();
        }
    }

    function _afterProofsSubmit(
        ICredentialCircuitVerifier.CredentialCircuitProof memory credentialCircuitProof,
        ISignatureCircuitVerifier.SignatureCircuitProof memory signatureCircuitProof
    ) internal {
        // credential proof

        uint256 hashIndex = credentialCircuitProof.pubSignals[
            CircuitConstants.CREDENTIAL_HASH_INDEX_INDEX
        ];
        uint256 hashValue = credentialCircuitProof.pubSignals[
            CircuitConstants.CREDENTIAL_HASH_VALUE_INDEX
        ];
        uint256 currentDate = credentialCircuitProof.pubSignals[
            CircuitConstants.CREDENTIAL_CURRENT_DATE_INDEX
        ];
        uint256 issuanceDate = credentialCircuitProof.pubSignals[
            CircuitConstants.CREDENTIAL_ISSUANCE_DATE_INDEX
        ];
        uint256 templateRoot = credentialCircuitProof.pubSignals[
            CircuitConstants.CREDENTIAL_TEMPLATE_ROOT_INDEX
        ];
        uint256 linkIdSignatureProof = credentialCircuitProof.pubSignals[
            CircuitConstants.CREDENTIAL_LINK_ID_INDEX
        ];

        // signature proof
        uint256 linkIdCredentialProof = signatureCircuitProof.pubSignals[
            CircuitConstants.SIGNATURE_LINKID_INDEX
        ];
        uint256 nullifier = signatureCircuitProof.pubSignals[
            CircuitConstants.SIGNATURE_NULLIFIER_INDEX
        ];
        uint256 merkleRoot = signatureCircuitProof.pubSignals[
            CircuitConstants.SIGNATURE_MERKLE_ROOT_INDEX
        ];

        _validatePublicInputs(
            hashIndex,
            hashValue,
            currentDate,
            issuanceDate,
            templateRoot,
            linkIdCredentialProof,
            linkIdSignatureProof,
            nullifier,
            merkleRoot
        );
        _setNullifier(nullifier);
        _addHashAndTransit(hashIndex, hashValue);
    }
}
