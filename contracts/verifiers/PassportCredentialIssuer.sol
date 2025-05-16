// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IdentityLib} from "@iden3/contracts/lib/IdentityLib.sol";
import {IdentityBase} from "@iden3/contracts/lib/IdentityBase.sol";
import {ICredentialCircuitVerifier} from "../interfaces/ICredentialCircuitVerifier.sol";
import {CircuitConstants} from "../constants/CircuitConstants.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {DateTime} from "@quant-finance/solidity-datetime/contracts/DateTime.sol";
import {IAttestationValidator} from "../interfaces/IAttestationValidator.sol";

error InvalidLinkId(uint256 linkId1, uint256 linkId2);
error InvalidHashIndex(uint256 hashIndex);
error InvalidHashValue(uint256 hashValue);
error InvalidTemplateRoot(uint256 templateRoot, uint256 expectedTemplateRoot);
error IssuanceDateExpired(uint256 issuanceDate);
error IssuanceDateInFuture(uint256 issuanceDate);
error CurrentDateExpired(uint256 currentDate);
error CurrentDateInFuture(uint256 currentDate);
error NullifierAlreadyExists(uint256 nullifier);
error NullifierDoesNotExist(uint256 nullifier);
error LengthMismatch(uint256 length1, uint256 length2);
error NoVerifierSet();
error InvalidCredentialProof();
error InvalidPassportSignatureProof();
error InvalidSignerPassportSignatureProof(address signer);
error NoCredentialCircuitIdFound(string circuitId);
error InvalidTransactor(address transactor);
error ImageHashIsNotWhitelisted(bytes32 imageHash);
error InvalidAttestation();
error InvalidSignerAddress();
error InvalidAttestationUserDataLength();
error InvalidIssuerDidHash();
error InvalidRevocationNonce(uint64 revocationNonce);

/**
 * @dev Address ownership credential issuer.
 * This issuer issue non-merklized credentials decentralized.
 */
contract PassportCredentialIssuer is IdentityBase, EIP712Upgradeable, Ownable2StepUpgradeable {
    using IdentityLib for IdentityLib.Data;
    using ECDSA for bytes32;
    using EnumerableSet for EnumerableSet.AddressSet;
    using DateTime for uint256;

    /**
     * @dev Version of the contract
     */
    string public constant VERSION = "1.0.0";

    /**
     * @dev Version of EIP 712 domain
     */
    string public constant DOMAIN_VERSION = "1.0.0";

    uint256 private constant DATE_20TH_CENTURY = 500000;
    uint256 private constant CURRENT_DATE_EXPIRATION_TIME = 7 days;

    /**
     * @dev PassportCredential message data type hash
     */
    bytes32 public constant PASSPORT_CREDENTIAL_MESSAGE_TYPEHASH =
        keccak256("PassportCredential(uint256 linkId,uint256 nullifier)");

    struct StateInfo {
        address stateAddress;
        bytes2 idType;
    }

    struct PassportCredentialMessage {
        uint256 linkId;
        uint256 nullifier;
    }

    struct PassportSignatureProof {
        PassportCredentialMessage passportCredentialMsg;
        bytes signature;
    }

    struct CredentialProof {
        string circuitId;
        bytes proof;
    }

    struct ProofInputs {
        uint256 hashIndex;
        uint256 hashValue;
        uint256 issuanceDate;
        uint256 currentDate;
        uint256 templateRoot;
        uint256 linkIdCredentialProof;
        uint64 revocationNonce;
        uint256 issuerDidHash;
    }

    /// @custom:storage-location erc7201:polygonid.storage.PassportCredentialIssuer
    struct PassportCredentialIssuerStorage {
        uint256 _expirationTime;
        uint256 _templateRoot;
        uint256 _maxFutureTime;
        mapping(string circuitId => address verifier) _credentialVerifiers;
        EnumerableSet.AddressSet _signers;
        IAttestationValidator _attestationValidator;
        mapping(bytes32 imageHash => bool isApproved) _imageHashesWhitelist;
        EnumerableSet.AddressSet _transactors;
        mapping(uint256 nullifier => uint64 revocationNonce) _nullifiersToRevocationNonce;
        uint256 _issuerDidHash;
    }

    // check if the hash was calculated correctly
    // keccak256(abi.encode(uint256(keccak256("polygonid.storage.PassportCredentialIssuer")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant PassportCredentialIssuerStorageLocation =
        0x405d73f251ed6c997b1c097c46d2f830c946626e510c12346d80e7c5a4dad300;

    function _getPassportCredentialIssuerStorage()
        private
        pure
        returns (PassportCredentialIssuerStorage storage store)
    {
        assembly {
            store.slot := PassportCredentialIssuerStorageLocation
        }
    }

    /**
     * @notice Emitted when a credential circuit verifier is updated.
     * @param circuitId The credential circuit id.
     * @param verifier The new verifier address for the credential circuit.
     */
    event CredentialCircuitVerifierUpdated(string circuitId, address verifier);
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
    /**
     * @notice Emitted when a new transactor is added.
     * @param transactor The transactor address.
     */
    event TransactorAdded(address transactor);
    /**
     * @notice Emitted when a credential is revoked.
     * @param revocationNonce The revocation nonce of the revoked credential.
     */
    event CredentialRevoked(uint256 nullifier, uint64 revocationNonce);
    /**
     * @notice Emitted when the max future time is updated.
     * @param maxFutureTime The new max future time.
     */
    event MaxFutureTimeUpdated(uint256 maxFutureTime);

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

    /**
     * @dev Throws if called by any account other than transactors.
     */
    modifier onlyTransactors() {
        _checkTransactor();
        _;
    }

    // ====================================================
    // Initializer
    // ====================================================

    function initializeIssuer(
        uint256 expirationTime,
        uint256 maxFutureTime,
        uint256 templateRoot,
        string[] calldata credentialCircuitIds,
        address[] calldata credentialVerifierAddresses,
        StateInfo calldata stateInfo,
        address owner,
        IAttestationValidator validator
    ) public initializer {
        super.initialize(stateInfo.stateAddress, stateInfo.idType);
        __Ownable_init(owner);

        PassportCredentialIssuerStorage storage $ = _getPassportCredentialIssuerStorage();
        $._expirationTime = expirationTime;
        $._maxFutureTime = maxFutureTime;
        $._templateRoot = templateRoot;
        $._attestationValidator = validator;

        __EIP712_init("PassportIssuerV1", DOMAIN_VERSION);
        _updateCredentialVerifiers(credentialCircuitIds, credentialVerifierAddresses);
    }

    function addSigner(bytes memory attestation) public onlyTransactors {
        PassportCredentialIssuerStorage storage $ = _getPassportCredentialIssuerStorage();

        (bytes memory userData, bytes32 imageHash, bool validated) = $
            ._attestationValidator
            .validateAttestation(attestation);

        if (!isWhitelistedImageHash(imageHash)) {
            revert ImageHashIsNotWhitelisted(imageHash);
        }

        if (!validated) {
            revert InvalidAttestation();
        }

        if (userData.length < 20) {
            revert InvalidAttestationUserDataLength();
        }

        // 1. decode user data
        address userDataDecoded;
        assembly {
            userDataDecoded := mload(add(userData, 20))
        }

        if (userDataDecoded == address(0)) {
            revert InvalidSignerAddress();
        }

        // 2. add signer
        $._signers.add(userDataDecoded);
        emit SignerAdded(userDataDecoded);
    }

    /**
     * @notice Retrieves the signers.
     */
    function getSigners() external view returns (address[] memory) {
        return _getPassportCredentialIssuerStorage()._signers.values();
    }

    function addTransactor(address transactor) public onlyOwner {
        PassportCredentialIssuerStorage storage $ = _getPassportCredentialIssuerStorage();
        $._transactors.add(transactor);
        emit TransactorAdded(transactor);
    }

    /**
     * @notice Retrieves the transactors.
     */
    function getTransactors() external view returns (address[] memory) {
        return _getPassportCredentialIssuerStorage()._transactors.values();
    }

    /**
     * @notice Retrieves the expiration time.
     * @return The expiration time.
     */
    function getExpirationTime() external view virtual returns (uint256) {
        return _getPassportCredentialIssuerStorage()._expirationTime;
    }

    /**
     * @notice Sets the expiration time.
     * @param expirationTime The new expiration time.
     */
    function setExpirationTime(uint256 expirationTime) external onlyOwner {
        _getPassportCredentialIssuerStorage()._expirationTime = expirationTime;
        emit ExpirationTimeUpdated(expirationTime);
    }

    /**
     * @notice Retrieves the template root.
     * @return The template root.
     */
    function getTemplateRoot() external view virtual returns (uint256) {
        return _getPassportCredentialIssuerStorage()._templateRoot;
    }

    /**
     * @notice Sets the template root.
     * @param templateRoot The new template root.
     */
    function setTemplateRoot(uint256 templateRoot) external onlyOwner {
        _getPassportCredentialIssuerStorage()._templateRoot = templateRoot;
        emit TemplateRootUpdated(templateRoot);
    }

    /**
     * @notice Retrieves the max future time.
     * @return The max future time.
     */
    function getMaxFutureTime() external view virtual returns (uint256) {
        return _getPassportCredentialIssuerStorage()._maxFutureTime;
    }

    /**
     * @notice Sets the max future time.
     * @param maxFutureTime The new max future time.
     */
    function setMaxFutureTime(uint256 maxFutureTime) external onlyOwner {
        _getPassportCredentialIssuerStorage()._maxFutureTime = maxFutureTime;
        emit MaxFutureTimeUpdated(maxFutureTime);
    }

    /**
     * @dev Set attestation validator
     * @param validator - attestation validator
     */
    function setAttestationValidator(IAttestationValidator validator) external onlyOwner {
        _getPassportCredentialIssuerStorage()._attestationValidator = validator;
    }

    /**
     * @dev Updates the credential circuit verifiers for a specific circuit identifiers.
     * @param circuitIds The credential circuit identifiers.
     * @param verifierAddresses The new credential circuit verifier addresses.
     */
    function updateCredentialVerifiers(
        string[] calldata circuitIds,
        address[] calldata verifierAddresses
    ) public virtual onlyOwner {
        _updateCredentialVerifiers(circuitIds, verifierAddresses);
    }

    /**
     * @notice Retrieves the credential verifier address for a given circuit id.
     * @param circuitId The circuit id identifier.
     * @return The credential verifier address.
     */
    function credentialVerifiers(string memory circuitId) external view virtual returns (address) {
        return _getPassportCredentialIssuerStorage()._credentialVerifiers[circuitId];
    }

    /**
     * @notice Revoke credential and remove nullifier.
     * @param nullifier credential nullifier.
     */
    function revokeCredential(uint256 nullifier) external onlyOwner {
        PassportCredentialIssuerStorage storage $ = _getPassportCredentialIssuerStorage();
        uint64 nonce = $._nullifiersToRevocationNonce[nullifier];
        if (nonce == 0) {
            revert NullifierDoesNotExist(nullifier);
        }
        _revokeClaimAndTransit(nonce);
        $._nullifiersToRevocationNonce[nullifier] = 0;
        emit CredentialRevoked(nullifier, nonce);
    }

    /**
     * @notice Retrieves wether the nullifier exists.
     * @param nullifier The nullifier to check.
     * @return Wether the nullifier exists.
     */
    function nullifierExists(uint256 nullifier) external view returns (bool) {
        uint64 nonce = _getPassportCredentialIssuerStorage()._nullifiersToRevocationNonce[
            nullifier
        ];
        return nonce != 0;
    }

    /// @notice Verifies the passport credential.
    /// @param credentialProof Credential proof for the passport credential
    /// @param passportSignatureProof Signature proof of the validation of the passport credential
    function verifyPassport(
        CredentialProof memory credentialProof,
        bytes memory passportSignatureProof
    ) external {
        if (bytes(credentialProof.circuitId).length == 0) {
            revert NoCredentialCircuitIdFound(credentialProof.circuitId);
        }

        (
            uint256[] memory inputs1,
            uint256[2] memory a1,
            uint256[2][2] memory b1,
            uint256[2] memory c1
        ) = abi.decode(credentialProof.proof, (uint256[], uint256[2], uint256[2][2], uint256[2]));

        ICredentialCircuitVerifier.CredentialCircuitProof
            memory credentialCircuitProof = ICredentialCircuitVerifier.CredentialCircuitProof(
                a1,
                b1,
                c1,
                [
                    inputs1[0],
                    inputs1[1],
                    inputs1[2],
                    inputs1[3],
                    inputs1[4],
                    inputs1[5],
                    inputs1[6],
                    inputs1[7]
                ]
            );

        PassportSignatureProof memory passportSignatureProofDecoded = abi.decode(
            passportSignatureProof,
            (PassportSignatureProof)
        );

        _verifyPassportCredential(
            credentialProof.circuitId,
            credentialCircuitProof,
            passportSignatureProofDecoded
        );
    }

    /**
     * @dev Checks if imageHash of the enclave is whitelisted
     * @param imageHash The imageHash of the enclave
     * @return True if imageHash is whitelisted, otherwise returns false
     */
    function isWhitelistedImageHash(bytes32 imageHash) public view virtual returns (bool) {
        return _getPassportCredentialIssuerStorage()._imageHashesWhitelist[imageHash];
    }

    /**
     * @dev Adds an imageHash of the enclave to the whitelist
     * @param imageHash The imageHash of the enclave to add
     */
    function addImageHashToWhitelist(bytes32 imageHash) public onlyOwner {
        _getPassportCredentialIssuerStorage()._imageHashesWhitelist[imageHash] = true;
    }

    /**
     * @dev Removes an imageHash of the enclave from the whitelist
     * @param imageHash The imageHash of the enclave to remove
     */
    function removeImageHashFromWhitelist(bytes32 imageHash) public onlyOwner {
        _getPassportCredentialIssuerStorage()._imageHashesWhitelist[imageHash] = false;
    }

    /**
     * @notice Retrieves the issuer DID hash.
     * @return The issuer DID hash.
     */
    function getIssuerDIDHash() external view onlyOwner returns (uint256) {
        return _getPassportCredentialIssuerStorage()._issuerDidHash;
    }

    /**
     * @notice Updates the issuer DID hash.
     * @param issuerDidHash The new issuer DID hash.
     */
    function setIssuerDIDHash(uint256 issuerDidHash) external onlyOwner {
        _getPassportCredentialIssuerStorage()._issuerDidHash = issuerDidHash;
    }

    function _checkTransactor() internal view {
        if (!_getPassportCredentialIssuerStorage()._transactors.contains(_msgSender())) {
            revert InvalidTransactor(_msgSender());
        }
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
        uint256 currentDate,
        uint256 templateRoot,
        uint256 linkIdCredentialProof,
        uint256 linkIdSignature,
        uint256 nullifier,
        uint256 issuerDidHash
    ) internal view {
        PassportCredentialIssuerStorage storage $ = _getPassportCredentialIssuerStorage();
        if (hashIndex == 0) revert InvalidHashIndex(hashIndex);
        if (hashValue == 0) revert InvalidHashValue(hashValue);

        if (templateRoot != $._templateRoot)
            revert InvalidTemplateRoot(templateRoot, $._templateRoot);

        if (linkIdSignature != linkIdCredentialProof)
            revert InvalidLinkId(linkIdSignature, linkIdCredentialProof);

        uint256 currentDateWithFullYear;
        // currentDate is YYMMDD format
        if (currentDate > DATE_20TH_CENTURY) {
            // 19xx
            currentDateWithFullYear = currentDate + 19000000;
        } else {
            // 20xx
            currentDateWithFullYear = currentDate + 20000000;
        }

        // This scope was added to avoid stack too deep error
        // scope: verify if currentDate is in time range
        {
            (uint256 year, uint256 month, uint256 day) = DateTime.timestampToDate(
                block.timestamp - $._expirationTime
            );
            uint256 minimumExpectedCurrentDate = year * 10000 + month * 100 + day;
            if (minimumExpectedCurrentDate > currentDateWithFullYear) {
                revert CurrentDateExpired(currentDate);
            }
            (uint256 futureYear, uint256 futureMonth, uint256 futureDay) = DateTime.timestampToDate(
                block.timestamp + $._maxFutureTime
            );
            uint256 futureDate = futureYear * 10000 + futureMonth * 100 + futureDay;
            if (currentDateWithFullYear > futureDate) {
                revert CurrentDateInFuture(currentDate);
            }
        }

        if (issuanceDate + $._expirationTime < block.timestamp)
            revert IssuanceDateExpired(issuanceDate);
        if (issuanceDate > block.timestamp + $._maxFutureTime)
            revert IssuanceDateInFuture(issuanceDate);

        if ($._issuerDidHash != issuerDidHash) revert InvalidIssuerDidHash();

        if ($._nullifiersToRevocationNonce[nullifier] != 0)
            revert NullifierAlreadyExists(nullifier);
    }

    function _addHashAndTransit(uint256 hi, uint256 hv) internal {
        _getIdentityBaseStorage().identity.addClaimHash(hi, hv);
        _getIdentityBaseStorage().identity.transitState();
    }

    function _revokeClaimAndTransit(uint64 nonce) internal {
        _getIdentityBaseStorage().identity.revokeClaim(nonce);
        _getIdentityBaseStorage().identity.transitState();
    }

    function _setNullifier(uint256 nullifier, uint64 revocationNonce) internal {
        if (revocationNonce == 0) revert InvalidRevocationNonce(revocationNonce);
        PassportCredentialIssuerStorage storage $ = _getPassportCredentialIssuerStorage();
        $._nullifiersToRevocationNonce[nullifier] = revocationNonce;
    }

    function _verifyCredentialProof(
        string memory credentialCircuitId,
        ICredentialCircuitVerifier.CredentialCircuitProof memory credentialCircuitProof
    ) internal view {
        PassportCredentialIssuerStorage storage $ = _getPassportCredentialIssuerStorage();
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
        if (!_getPassportCredentialIssuerStorage()._signers.contains(recovered)) {
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
        ProofInputs memory inputs = _extractProofInputs(credentialCircuitProof);

        uint256 nullifier = passportSignatureProof.passportCredentialMsg.nullifier;
        _validatePublicInputs(
            inputs.hashIndex,
            inputs.hashValue,
            inputs.issuanceDate,
            inputs.currentDate,
            inputs.templateRoot,
            inputs.linkIdCredentialProof,
            passportSignatureProof.passportCredentialMsg.linkId,
            nullifier,
            inputs.issuerDidHash
        );
        _setNullifier(nullifier, inputs.revocationNonce);
        _addHashAndTransit(inputs.hashIndex, inputs.hashValue);
    }

    function _updateCredentialVerifiers(
        string[] calldata circuitIds,
        address[] calldata verifierAddresses
    ) internal {
        PassportCredentialIssuerStorage storage $ = _getPassportCredentialIssuerStorage();
        if (circuitIds.length != verifierAddresses.length) {
            revert LengthMismatch(circuitIds.length, verifierAddresses.length);
        }
        for (uint256 i = 0; i < circuitIds.length; i++) {
            $._credentialVerifiers[circuitIds[i]] = verifierAddresses[i];

            emit CredentialCircuitVerifierUpdated(circuitIds[i], verifierAddresses[i]);
        }
    }

    function _extractProofInputs(
        ICredentialCircuitVerifier.CredentialCircuitProof memory credentialCircuitProof
    ) internal pure returns (ProofInputs memory) {
        return
            ProofInputs({
                hashIndex: credentialCircuitProof.pubSignals[
                    CircuitConstants.CREDENTIAL_HASH_INDEX_INDEX
                ],
                hashValue: credentialCircuitProof.pubSignals[
                    CircuitConstants.CREDENTIAL_HASH_VALUE_INDEX
                ],
                issuanceDate: credentialCircuitProof.pubSignals[
                    CircuitConstants.CREDENTIAL_ISSUANCE_DATE_INDEX
                ],
                currentDate: credentialCircuitProof.pubSignals[
                    CircuitConstants.CREDENTIAL_CURRENT_DATE_INDEX
                ],
                templateRoot: credentialCircuitProof.pubSignals[
                    CircuitConstants.CREDENTIAL_TEMPLATE_ROOT_INDEX
                ],
                linkIdCredentialProof: credentialCircuitProof.pubSignals[
                    CircuitConstants.CREDENTIAL_LINK_ID_INDEX
                ],
                revocationNonce: uint64(
                    credentialCircuitProof.pubSignals[
                        CircuitConstants.CREDENTIAL_REVOCATION_NONCE_INDEX
                    ]
                ),
                issuerDidHash: credentialCircuitProof.pubSignals[
                    CircuitConstants.CREDENTIAL_ISSUER_DID_HASH_INDEX
                ]
            });
    }
}
