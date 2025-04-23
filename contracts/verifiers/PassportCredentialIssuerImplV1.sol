// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IdentityLib} from "@iden3/contracts/lib/IdentityLib.sol";
import {IdentityBase} from "@iden3/contracts/lib/IdentityBase.sol";
import {IZKPVerifier} from "@iden3/contracts/interfaces/IZKPVerifier.sol";
import {ICredentialCircuitVerifier} from "../interfaces/ICredentialCircuitVerifier.sol";
import {CircuitConstants} from "../constants/CircuitConstants.sol";
import {ImplRoot} from "../upgradeable/ImplRoot.sol";
import {IAttestationValidator} from "../interfaces/IAttestationValidator.sol";

error InvalidResponsesLength(uint256 length, uint256 expectedLength);
error InvalidLinkId(uint256 linkId1, uint256 linkId2);
error InvalidHashIndex(uint256 hashIndex);
error InvalidHashValue(uint256 hashValue);
error InvalidTemplateRoot(uint256 templateRoot, uint256 expectedTemplateRoot);
error IssuanceDateExpired(uint256 issuanceDate);
error NullifierAlreadyExists(uint256 nullifier);
error LengthMismatch(uint256 length1, uint256 length2);
error NoVerifierSet();
error InvalidCredentialProof();
error InvalidPassportSignatureProof();
error InvalidSignerPassportSignatureProof(address signer);
error NoCredentialCircuitForRequestId(uint256 requestId);
error ImageHashIsNotWhitelisted(bytes32 imageHash);
error InvalidAttestation();

/**
 * @dev Address ownership credential issuer.
 * This issuer issue non-merklized credentials decentralized.
 */
contract PassportCredentialIssuerImplV1 is IdentityBase, EIP712Upgradeable, ImplRoot {
    using IdentityLib for IdentityLib.Data;
    using ECDSA for bytes32;
    using EnumerableSet for EnumerableSet.AddressSet;

    /**
     * @dev Version of EIP 712 domain
     */
    string public constant DOMAIN_VERSION = "1.0.0";

    /**
     * @dev PassportCredential message data type hash
     */
    bytes32 public constant PASSPORT_CREDENTIAL_MESSAGE_TYPEHASH =
        keccak256("PassportCredential(uint256 linkId,uint256 nullifier)");

    /// @custom:storage-location erc7201:polygonid.storage.PassportCredentialIssuerV1
    struct PassportCredentialIssuerV1Storage {
        uint256 _expirationTime;
        uint256 _templateRoot;
        mapping(uint256 => bool) _nullifiers;
        mapping(string circuitId => address verifier) _credentialVerifiers;
        mapping(uint256 requestId => string circuitId) _credentialRequestIdToCircuitId;
        mapping(string circuitId => uint256 requestId) _credentialCircuitIdToRequestId;
        uint256 _requestIds;
        EnumerableSet.AddressSet _signers;
        IAttestationValidator _attestationValidator;
        mapping(bytes32 imageHash => bool isApproved) _imageHashesWhitelist;
    }

    struct UserData {
        IZKPVerifier.ZKPResponse[] responses;
        bytes crossChainProofs;
    }

    struct PassportCredentialMessage {
        uint256 linkId;
        uint256 nullifier;
    }

    struct PassportSignatureProof {
        PassportCredentialMessage passportCredentialMsg;
        bytes signature;
    }

    /**
     * @dev Version of the contract
     */
    string public constant VERSION = "1.0.2";

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
     * @notice Emitted when the expiration time is updated.
     * @param expirationTime The new expiration time.
     */
    event ExpirationTimeUpdated(uint256 expirationTime);
    /**
     * @notice Emitted when the template root is updated.
     * @param tampletRoot The new template root.
     */
    event TemplateRootUpdated(uint256 tampletRoot);
    /**
     * @notice Emitted when a new signer is added.
     * @param signer The signer address.
     */
    event SignerAdded(address signer);

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
        string[] calldata credentialCircuitIds,
        address[] calldata credentialVerifierAddresses,
        address[] calldata signers,
        address stateAddress,
        bytes2 idType
    ) public initializer {
        super.initialize(stateAddress, idType);
        __Ownable_init(msg.sender);

        PassportCredentialIssuerV1Storage storage $ = _getPassportCredentialIssuerV1Storage();
        $._expirationTime = expirationTime;
        $._templateRoot = templateRoot;
        $._requestIds = 1;

        __EIP712_init("PassportIssuerV1", DOMAIN_VERSION);
        addSigners(signers);
        updateCredentialVerifiers(credentialCircuitIds, credentialVerifierAddresses);
    }

    function addSigners(address[] calldata signers) public onlyProxy onlyOwner {
        PassportCredentialIssuerV1Storage storage $ = _getPassportCredentialIssuerV1Storage();
        for (uint256 i = 0; i < signers.length; i++) {
            $._signers.add(signers[i]);
            emit SignerAdded(signers[i]);
        }
    }

    /**
     * @notice Retrieves the signers.
     */
    function getSigners() external view onlyProxy returns (address[] memory) {
        return _getPassportCredentialIssuerV1Storage()._signers.values();
    }

    /**
     * @notice Retrieves the expiration time.
     * @return The expiration time.
     */
    function getExpirationTime() external view virtual onlyProxy returns (uint256) {
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
     * @dev Set attestation validator
     * @param validator - attestation validator
     */
    function setAttestationValidator(IAttestationValidator validator) external onlyProxy onlyOwner {
        _getPassportCredentialIssuerV1Storage()._attestationValidator = validator;
    }

    /**
     * @dev Updates the credential circuit verifiers for a specific circuit identifiers.
     * @param circuitIds The credential circuit identifiers.
     * @param verifierAddresses The new credential circuit verifier addresses.
     */
    function updateCredentialVerifiers(
        string[] calldata circuitIds,
        address[] calldata verifierAddresses
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

            emit CredentialCircuitVerifierUpdated(circuitIds[i], verifierAddresses[i], requestId);
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
     * @notice Retrieves credential the circuit id for a given request id.
     * @param requestId The request id identifier.
     * @return The circuit id.
     */
    function credentialRequestIdToCircuitIds(
        uint256 requestId
    ) external view virtual onlyProxy returns (string memory) {
        return _getPassportCredentialIssuerV1Storage()._credentialRequestIdToCircuitId[requestId];
    }

    function cleanNullifier(uint256 nullifier) external onlyOwner {
        PassportCredentialIssuerV1Storage storage $ = _getPassportCredentialIssuerV1Storage();
        require($._nullifiers[nullifier], "Nullifier does not exist");
        $._nullifiers[nullifier] = false;
    }

    /**
     * @dev Verifies the passport credential and signature proofs after verifying the attestation.
     * @param attestation - attestation in bytes that includes user data for the passport credential and signature proofs
     */
    function verifyPassport(bytes memory attestation) external {
        (
            bytes memory userData,
            bytes32 imageHash,
            bool validated
        ) = _getPassportCredentialIssuerV1Storage()._attestationValidator.validateAttestation(
                attestation,
                false
            );

        if (!isWhitelistedImageHash(imageHash)) {
            revert ImageHashIsNotWhitelisted(imageHash);
        }

        if (!validated) {
            revert InvalidAttestation();
        }

        // TODO: remove this code after testing
        userData = hex"000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000320000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000002800000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000012005a0984bdc209b7a1ff5d3c3bc36b3268c5dc22a2128f4f312c60a980ccacf811c98c8c178e385c7ccf62733b1cfcfc1869cd610b2efc8f18d5bb6f13e9a65b20b57692a6fc9fc08391b41611037f1c52cb2bb0cea5aa57779e73da9c0be8ab02aa1b7c77988a81c750f99c624f72ffa46b4e44d37176596445d4f94916875121bf6fca56d157baa94f68f6e3e52cf7baa0c9238bb0a86efdac9749949a9b16813718c7223e5c62a68ab2bcf96a5d716771a158b22ea01b45a1601f42b22ae202c045ee58e216e9e1f588d2339c79ae6af0482dbc92d00455a6dcd94399f60622a583fa35dd13eb60b297db5fa1fafe0f3891e9f86d4dc44dbd31e43c1aa296800000000000000000000000000000000000000000000000000000000000000060642fa4461450eb2eca343566c054c85160b60792d43e414b69341475fc718652ec529b37e1107487de89f0ac42e52799f43f279c07e1f97bcddda9703175eb5271b7028ff034e5582be8da0ce445ce7627e620b2732d41d953a6ac1f5bc4cf5000000000000000000000000000000000000000000000000000000000003d237000000000000000000000000000000000000000000000000000000006808ee0b07cf4e481e60ce0dfe7c39f588c687ad293247702335214539a827fde0a4f04600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020271b7028ff034e5582be8da0ce445ce7627e620b2732d41d953a6ac1f5bc4cf5000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000041c78a609f7b1edc77a5b028fe8d2fe7a3d023955e93c496a3e4a72a39223b752d38b39835a00ab61c6eab1cf6bab42599bccff95c605c4dcf81db3b34a046e3361b00000000000000000000000000000000000000000000000000000000000000";

        // 1. decode user data
        UserData memory userDataDecoded = abi.decode(userData, (UserData));

        // 2. verify the passport credential and signature proofs
        submitZKPResponseV2(userDataDecoded.responses, userDataDecoded.crossChainProofs);
    }

    function nullifierExists(uint256 nullifier) external view returns (bool) {
        return _getPassportCredentialIssuerV1Storage()._nullifiers[nullifier];
    }

    /// @notice Submits a ZKP response V2
    /// @param responses The list of responses including ZKP request ID, ZK proof and metadata
    /// @param crossChainProofs The list of cross chain proofs from universal resolver (oracle)
    function submitZKPResponseV2(
        IZKPVerifier.ZKPResponse[] memory responses,
        bytes memory crossChainProofs
    ) public {
        PassportCredentialIssuerV1Storage storage $ = _getPassportCredentialIssuerV1Storage();

        if (responses.length != 1) {
            revert InvalidResponsesLength(responses.length, 1);
        }
        // response[0] for credential proof
        // crossChainProofs for passport is signed data + signature
        string memory credentialCircuitId;
        credentialCircuitId = $._credentialRequestIdToCircuitId[responses[0].requestId];

        if (bytes(credentialCircuitId).length == 0) {
            revert NoCredentialCircuitForRequestId(responses[0].requestId);
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

        PassportSignatureProof[] memory passportSignatureProof = abi.decode(
            crossChainProofs,
            (PassportSignatureProof[])
        );

        _verifyPassportCredential(
            credentialCircuitId,
            credentialCircuitProof,
            passportSignatureProof[0]
        );
    }

    /**
     * @dev Checks if imageHash of the enclave is whitelisted
     * @param imageHash The imageHash of the enclave
     * @return True if imageHash is whitelisted, otherwise returns false
     */
    function isWhitelistedImageHash(bytes32 imageHash) public view virtual returns (bool) {
        return _getPassportCredentialIssuerV1Storage()._imageHashesWhitelist[imageHash];
    }

    /**
     * @dev Adds an imageHash of the enclave to the whitelist
     * @param imageHash The imageHash of the enclave to add
     */
    function addImageHashToWhitelist(bytes32 imageHash) public onlyOwner {
        _getPassportCredentialIssuerV1Storage()._imageHashesWhitelist[imageHash] = true;
    }

    /**
     * @dev Removes an imageHash of the enclave from the whitelist
     * @param imageHash The imageHash of the enclave to remove
     */
    function removeImageHashFromWhitelist(bytes32 imageHash) public onlyOwner {
        _getPassportCredentialIssuerV1Storage()._imageHashesWhitelist[imageHash] = false;
    }

    function _verifyPassportCredential(
        string memory credentialCircuitId,
        ICredentialCircuitVerifier.CredentialCircuitProof memory credentialCircuitProof,
        PassportSignatureProof memory passportSignatureProof
    ) internal {
        _verifyCredentialProof(credentialCircuitId, credentialCircuitProof);
        _verifySignature(passportSignatureProof);
        _afterProofsSubmit(credentialCircuitProof, passportSignatureProof);
    }

    function _validatePublicInputs(
        uint256 hashIndex,
        uint256 hashValue,
        uint256 issuanceDate,
        uint256 templateRoot,
        uint256 linkIdCredentialProof,
        uint256 linkIdSignature,
        uint256 nullifier
    ) internal view {
        PassportCredentialIssuerV1Storage storage $ = _getPassportCredentialIssuerV1Storage();
        if (hashIndex == 0) revert InvalidHashIndex(hashIndex);
        if (hashValue == 0) revert InvalidHashValue(hashValue);

        if (templateRoot != $._templateRoot)
            revert InvalidTemplateRoot(templateRoot, $._templateRoot);

        if (linkIdSignature != linkIdCredentialProof)
            revert InvalidLinkId(linkIdSignature, linkIdCredentialProof);

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

    function _verifySignature(PassportSignatureProof memory passportSignatureProof) internal view {
        (bool isValid, address recovered) = _recoverPassportSignatureProofSigner(
            passportSignatureProof.passportCredentialMsg,
            passportSignatureProof.signature
        );
        if (!isValid) {
            revert InvalidPassportSignatureProof();
        }
        if (!_getPassportCredentialIssuerV1Storage()._signers.contains(recovered)) {
            revert InvalidSignerPassportSignatureProof(recovered);
        }
    }

    function _recoverPassportSignatureProofSigner(
        PassportCredentialMessage memory message,
        bytes memory signature
    ) internal view virtual returns (bool, address) {
        bytes32 hashTypedData = _hashTypedDataV4(
            keccak256(
                abi.encode(PASSPORT_CREDENTIAL_MESSAGE_TYPEHASH, message.linkId, message.nullifier)
            )
        );

        (address recovered, ECDSA.RecoverError err, ) = hashTypedData.tryRecover(signature);

        return (err == ECDSA.RecoverError.NoError, recovered);
    }

    function _afterProofsSubmit(
        ICredentialCircuitVerifier.CredentialCircuitProof memory credentialCircuitProof,
        PassportSignatureProof memory passportSignatureProof
    ) internal {
        // credential proof

        uint256 hashIndex = credentialCircuitProof.pubSignals[
            CircuitConstants.CREDENTIAL_HASH_INDEX_INDEX
        ];
        uint256 hashValue = credentialCircuitProof.pubSignals[
            CircuitConstants.CREDENTIAL_HASH_VALUE_INDEX
        ];
        uint256 issuanceDate = credentialCircuitProof.pubSignals[
            CircuitConstants.CREDENTIAL_ISSUANCE_DATE_INDEX
        ];
        uint256 templateRoot = credentialCircuitProof.pubSignals[
            CircuitConstants.CREDENTIAL_TEMPLATE_ROOT_INDEX
        ];
        uint256 linkIdCredentialProof = credentialCircuitProof.pubSignals[
            CircuitConstants.CREDENTIAL_LINK_ID_INDEX
        ];

        uint256 nullifier = passportSignatureProof.passportCredentialMsg.nullifier;

        _validatePublicInputs(
            hashIndex,
            hashValue,
            issuanceDate,
            templateRoot,
            linkIdCredentialProof,
            passportSignatureProof.passportCredentialMsg.linkId,
            nullifier
        );
        _setNullifier(nullifier);
        _addHashAndTransit(hashIndex, hashValue);
    }
}
