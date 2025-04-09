// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import {IdentityLib} from "@iden3/contracts/lib/IdentityLib.sol";
import {IdentityBase} from "@iden3/contracts/lib/IdentityBase.sol";
import {IZKPVerifier} from "@iden3/contracts/interfaces/IZKPVerifier.sol";
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
// error CurrentDateExpired(uint256 currentDate);
error IssuanceDateExpired(uint256 issuanceDate);
error NullifierAlreadyExists(uint256 nullifier);
error LengthMismatch(uint256 length1, uint256 length2);
error NoVerifierSet();
error InvalidDscCommitmentRoot();
error InvalidCredentialProof();
error InvalidSignatureProof();
error NoCredentialCircuitForRequestId(uint256 requestId);
error NoSignatureCircuitForRequestId(uint256 requestId);

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
        mapping(uint256 requestId => string circuitId) _credentialRequestIdToCircuitId;
        mapping(uint256 requestId => string circuitId) _signatureRequestIdToCircuitId;
        mapping(string circuitId => uint256 requestId) _credentialCircuitIdToRequestId;
        mapping(string circuitId => uint256 requestId) _signatureCircuitIdToRequestId;
        uint256 _requestIds;
    }

    /**
     * @dev Version of the contract
     */
    string public constant VERSION = "1.0.4";

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
     * @param requestId The request id for the credential circuit.
     */
    event CredentialCircuitVerifierUpdated(string circuitId, address verifier, uint256 requestId);
    /**
     * @notice Emitted when a signature circuit verifier is updated.
     * @param circuitId The signature circuit id.
     * @param verifier The new verifier address for the signature circuit.
     * @param requestId The request id for the signature circuit.
     */
    event SignatureCircuitVerifierUpdated(string circuitId, address verifier, uint256 requestId);
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
        $._requestIds = 1;
        updateCredentialVerifiers(credentialCircuitIds, credentialVerifierAddresses);
        updateSignatureVerifiers(signatureCircuitIds, signatureVerifierAddresses);
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
    ) public virtual onlyProxy onlyOwner {
        PassportCredentialIssuerV1Storage storage $ = _getPassportCredentialIssuerV1Storage();
        if (circuitIds.length != verifierAddresses.length) {
            revert LengthMismatch(circuitIds.length, verifierAddresses.length);
        }
        for (uint256 i = 0; i < circuitIds.length; i++) {
            $._signatureVerifiers[circuitIds[i]] = verifierAddresses[i];
            uint256 requestId = $._signatureCircuitIdToRequestId[circuitIds[i]];
            if (requestId == 0) {
                requestId = $._requestIds; 
                $._signatureCircuitIdToRequestId[circuitIds[i]] = requestId;
                $._signatureRequestIdToCircuitId[requestId] = circuitIds[i];
                $._requestIds++;
            }

            emit SignatureCircuitVerifierUpdated(
                circuitIds[i],
                verifierAddresses[i],
                requestId
            );
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
    ) public virtual onlyProxy onlyOwner {
        PassportCredentialIssuerV1Storage storage $ = _getPassportCredentialIssuerV1Storage();
        if (circuitIds.length != verifierAddresses.length) {
            revert LengthMismatch(circuitIds.length, verifierAddresses.length);
        }
        for (uint256 i = 0; i < circuitIds.length; i++) {
            $._credentialVerifiers[circuitIds[i]] = verifierAddresses[i];

            uint256 requestId = $._credentialCircuitIdToRequestId[circuitIds[i]];
            if (requestId == 0) {
                requestId = $._requestIds; 
                $._credentialCircuitIdToRequestId[circuitIds[i]] = requestId;
                $._credentialRequestIdToCircuitId[requestId] = circuitIds[i];
                $._requestIds++;
            }

            emit CredentialCircuitVerifierUpdated(
                circuitIds[i],
                verifierAddresses[i],
                requestId
            );
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

    /**
     * @notice Retrieves credential the request id for a given circuit id.
     * @param circuitId The circuit id identifier.
     * @return The request id.
     */
    function credentialCircuitIdToRequestIds(
        string memory circuitId
    ) external view virtual onlyProxy returns (uint256) {
        return _getPassportCredentialIssuerV1Storage()._credentialCircuitIdToRequestId[circuitId];
    }

    /**
     * @notice Retrieves signature the request id for a given circuit id.
     * @param circuitId The circuit id identifier.
     * @return The request id.
     */
    function signatureCircuitIdToRequestIds(
        string memory circuitId
    ) external view virtual onlyProxy returns (uint256) {
        return _getPassportCredentialIssuerV1Storage()._signatureCircuitIdToRequestId[circuitId];
    }

    /**
     * @notice Retrieves credential the circuit id for a given request id.
     * @param requestId The request id identifier.
     * @return The circuit id.
     */
    function credentialRequestIdToCircuitIds(
        uint256 requestId
    ) external view virtual onlyProxy returns (string memory) {
        return _getPassportCredentialIssuerV1Storage()._credentialRequestIdToCircuitId[requestId];
    }

    /**
     * @notice Retrieves signature the circuit id for a given request id.
     * @param requestId The request id identifier.
     * @return The circuit id.
     */
    function signatureRequestIdToCircuitIds(
        uint256 requestId
    ) external view virtual onlyProxy returns (string memory) {
        return _getPassportCredentialIssuerV1Storage()._signatureRequestIdToCircuitId[requestId];
    }

    function cleanNullifier(uint256 nullifier) external onlyOwner {
        PassportCredentialIssuerV1Storage storage $ = _getPassportCredentialIssuerV1Storage();
        require($._nullifiers[nullifier], "Nullifier does not exist");
        $._nullifiers[nullifier] = false;
    }

    /// @notice Submits a ZKP response V2
    /// @param responses The list of responses including ZKP request ID, ZK proof and metadata
    /// @param crossChainProofs The list of cross chain proofs from universal resolver (oracle)
    function submitZKPResponseV2(
        IZKPVerifier.ZKPResponse[] memory responses,
        bytes memory crossChainProofs
    ) external {
        PassportCredentialIssuerV1Storage storage $ = _getPassportCredentialIssuerV1Storage();

        if (responses.length != 2) {
            revert InvalidResponsesLength(responses.length, 2);
        }
        // response[0] for credential proof
        // response[1] for signature proof
        string memory credentialCircuitId;
        string memory signatureCircuitId;

        credentialCircuitId = $._credentialRequestIdToCircuitId[responses[0].requestId];
        signatureCircuitId = $._signatureRequestIdToCircuitId[responses[1].requestId];

        if (bytes(credentialCircuitId).length == 0) {
            revert NoCredentialCircuitForRequestId(responses[0].requestId);
        }
        if (bytes(signatureCircuitId).length == 0) {
            revert NoSignatureCircuitForRequestId(responses[1].requestId);
        }

        (
            uint256[] memory inputs1,
            uint256[2] memory a1,
            uint256[2][2] memory b1,
            uint256[2] memory c1
        ) = abi.decode(responses[0].zkProof, (uint256[], uint256[2], uint256[2][2], uint256[2]));

        ICredentialCircuitVerifier.CredentialCircuitProof
            memory credentialCircuitProof = ICredentialCircuitVerifier.CredentialCircuitProof(
                a1,
                b1,
                c1,
                [inputs1[0], inputs1[1], inputs1[2], inputs1[3], inputs1[4], inputs1[5]]
            );

        (
            uint256[] memory inputs2,
            uint256[2] memory a2,
            uint256[2][2] memory b2,
            uint256[2] memory c2
        ) = abi.decode(responses[1].zkProof, (uint256[], uint256[2], uint256[2][2], uint256[2]));
        ISignatureCircuitVerifier.SignatureCircuitProof
            memory signatureCircuitProof = ISignatureCircuitVerifier.SignatureCircuitProof(
                a2,
                b2,
                c2,
                [inputs2[0], inputs2[1], inputs2[2]]
            );

        _verifyPassportCredential(
            credentialCircuitId,
            credentialCircuitProof,
            signatureCircuitId,
            signatureCircuitProof
        );
    }

    function _verifyPassportCredential(
        string memory credentialCircuitId,
        ICredentialCircuitVerifier.CredentialCircuitProof memory credentialCircuitProof,
        string memory signatureCircuitId,
        ISignatureCircuitVerifier.SignatureCircuitProof memory signatureCircuitProof
    ) internal {
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
    ) internal view {
        PassportCredentialIssuerV1Storage storage $ = _getPassportCredentialIssuerV1Storage();
        if (hashIndex == 0) revert InvalidHashIndex(hashIndex);
        if (hashValue == 0) revert InvalidHashValue(hashValue);

        if (templateRoot != $._templateRoot)
            revert InvalidTemplateRoot(templateRoot, $._templateRoot);

        if (linkIdSignatureProof != linkIdCredentialProof)
            revert InvalidLinkId(linkIdSignatureProof, linkIdCredentialProof);

        if (!IIdentityRegistryV1($._registry).checkDscKeyCommitmentMerkleRoot(merkleRoot)) {
            revert InvalidDscCommitmentRoot();
        }

        // TODO: uncomment this when currentDate is comparable to block.timestamp
        /*if (currentDate + $._expirationTime < block.timestamp)
            revert CurrentDateExpired(currentDate);*/
        if (issuanceDate + $._expirationTime < block.timestamp)
            revert IssuanceDateExpired(issuanceDate);

        if ($._nullifiers[nullifier]) revert NullifierAlreadyExists(nullifier);
    }

    function _addHashAndTransit(uint256 hi, uint256 hv) internal {
        _getIdentityBaseStorage().identity.addClaimHash(hi, hv);
        _getIdentityBaseStorage().identity.transitState();
    }

    function _setNullifier(uint256 nullifier) internal {
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
