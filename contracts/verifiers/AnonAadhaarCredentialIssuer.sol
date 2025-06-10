// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import {IdentityLib} from "@iden3/contracts/lib/IdentityLib.sol";
import {IdentityBase} from "@iden3/contracts/lib/IdentityBase.sol";
import {IZKPVerifier} from "@iden3/contracts/interfaces/IZKPVerifier.sol";
import {IAnonAadhaarCircuitVerifier} from "../interfaces/IAnonAadhaarCircuitVerifier.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

error NoVerifierSet();
error InvalidAnonAadhaarProof();
error InvalidHashIndex();
error InvalidHashValue();
error InvalidNullifierSeed();
error InvalidTemplateRoot();
error InvalidIssuerDidHash();
error InvalidExpirationDate(uint256 expected, uint256 provided);
error ProofExpired();
error InvalidPubKeyHash();
error NullifierAlreadyExists();
error NullifierDoesNotExist();
error InvalidVerifierAddress();
error InvalidStateContractAddress();
error UnsupportedQrVersion(uint256 qrVersion);
error InvalidRevocationNonce(uint64 revocationNonce);
error LengthMismatch(uint256 length1, uint256 length2);
error NoAnonAadhaarCircuitIdFound(string circuitId);

event IssuerDidHashUpdated(uint256 issuerDidHash);
event TemplateRootUpdated(uint256 templateRoot);
event PublicKeyHashAdded(uint256 publicKeyHash);
event CredentialRevoked(uint256 nullifier, uint64 revocationNonce);
event AnonAadhaarCircuitVerifierUpdated(string circuitId, address verifierAddress);

/**
 * @dev Address ownership credential issuer.
 * This issuer issues non-merklized credentials in a decentralized manner.
 */
contract AnonAadhaarCredentialIssuer is IdentityBase, Ownable2StepUpgradeable {
    using IdentityLib for IdentityLib.Data;

    string public constant VERSION = "1.0.1";
    string private constant defaultCircuitId = "anon_aadhaar_v1";

    struct StateInfo {
        address stateAddress;
        bytes2 idType;
    }
    
    struct CredentialProof {
        string circuitId;
        bytes proof;
    }

    /// @custom:storage-location erc7201:polygonid.storage.AnonAadhaarCredentialIssuer
    struct AnonAadhaarCredentialIssuerStorage {
        uint256 nullifierSeed;
        uint256 expirationTime;
        uint256 templateRoot;
        uint256 issuerDidHash;
        mapping(string circuitId => address verifier) _anonAadhaarVerifiers;
        mapping(uint256 => bool) publicKeysHashes;
        mapping(uint256 nullifier => uint64 revocationNonce) _nullifiersToRevocationNonce;
        mapping(uint256 qrVersion => bool) qrVersions;
    }

    // check if the hash was calculated correctly
    // keccak256(abi.encode(uint256(keccak256("polygonid.storage.AnonAadhaarCredentialIssuer")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant AnonAadhaarCredentialIssuerStorageLocation =
        0x45045675f3efe2ec0ccfad8aa4c678179d3e20b95a34ad9d981fab6f95ba1e00;

    function _getAnonAadhaarCredentialIssuerStorage()
        private
        pure
        returns (AnonAadhaarCredentialIssuerStorage storage store)
    {
        assembly {
            store.slot := AnonAadhaarCredentialIssuerStorageLocation
        }
    }

    /**
     * @notice Constructor that disables initializers.
     * @dev Prevents direct initialization of the implementation contract.
     */
    constructor() {
        _disableInitializers();
    }

    function initializeIssuer(
        uint256 nullifierSeed,
        uint256[] calldata publicKeysHashes,
        uint256[] calldata qrVersions,
        uint256 expirationTime,
        uint256 templateRoot,
        address anonAadhaarVerifier,
        StateInfo calldata stateInfo,
        address owner
    ) public initializer {
        if (anonAadhaarVerifier == address(0)) revert InvalidVerifierAddress();
        if (stateInfo.stateAddress == address(0)) revert InvalidStateContractAddress();

        super.initialize(stateInfo.stateAddress, stateInfo.idType);
        __Ownable_init(owner);

        AnonAadhaarCredentialIssuerStorage storage $ = _getAnonAadhaarCredentialIssuerStorage();
        $.nullifierSeed = nullifierSeed;
        $.expirationTime = expirationTime;
        $.templateRoot = templateRoot;
        // Set the default circuit verifier
        $._anonAadhaarVerifiers[defaultCircuitId] = anonAadhaarVerifier;

        _addPublicKeyHashesBatch(publicKeysHashes);
        _addQrVersionBatch(qrVersions);
    }

    function setNullifierSeed(uint256 nullifierSeed) external onlyOwner {
        AnonAadhaarCredentialIssuerStorage storage $ = _getAnonAadhaarCredentialIssuerStorage();
        $.nullifierSeed = nullifierSeed;
    }

    /**
     * @notice Updates the issuer DID hash.
     * @param issuerDidHash The new issuer DID hash.
     */
    function setIssuerDidHash(uint256 issuerDidHash) public onlyOwner {
        AnonAadhaarCredentialIssuerStorage storage $ = _getAnonAadhaarCredentialIssuerStorage();
        $.issuerDidHash = issuerDidHash;
        emit IssuerDidHashUpdated(issuerDidHash);
    }

    function nullifierExists(uint256 nullifier) external view returns (bool) {
        AnonAadhaarCredentialIssuerStorage storage $ = _getAnonAadhaarCredentialIssuerStorage();
        return $._nullifiersToRevocationNonce[nullifier] != 0;
    }

    /**
     * @notice Updates the template root.
     * @param templateRoot The new template root.
     */
    function setTemplateRoot(uint256 templateRoot) public onlyOwner {
        AnonAadhaarCredentialIssuerStorage storage $ = _getAnonAadhaarCredentialIssuerStorage();
        $.templateRoot = templateRoot;
        emit TemplateRootUpdated(templateRoot);
    }

    /**
     * @notice Revoke credential and remove nullifier.
     * @param nullifier credential nullifier.
     */
    function revokeCredential(uint256 nullifier) external onlyOwner {
        AnonAadhaarCredentialIssuerStorage storage $ = _getAnonAadhaarCredentialIssuerStorage();
        uint64 nonce = $._nullifiersToRevocationNonce[nullifier];
        if (nonce == 0) revert NullifierDoesNotExist();
        _revokeClaimAndTransit(nonce);
        $._nullifiersToRevocationNonce[nullifier] = 0;
        emit CredentialRevoked(nullifier, nonce);
    }

    /**
     * @notice Adds a public key hash.
     * @param publicKeyHash The public key hash to add.
     */
    function addPublicKeyHash(uint256 publicKeyHash) public onlyOwner {
        AnonAadhaarCredentialIssuerStorage storage $ = _getAnonAadhaarCredentialIssuerStorage();
        $.publicKeysHashes[publicKeyHash] = true;
        emit PublicKeyHashAdded(publicKeyHash);
    }

    /**
     * @notice Adds multiple public key hashes in a batch.
     * @param publicKeysHashes The array of public key hashes to add.
     */
    function addPublicKeyHashesBatch(uint256[] calldata publicKeysHashes) public onlyOwner {
        _addPublicKeyHashesBatch(publicKeysHashes);
    }

    /**
     * @notice Removes a public key hash.
     * @param publicKeyHash The public key hash to remove.
     */
    function removePublicKeyHash(uint256 publicKeyHash) public onlyOwner {
        AnonAadhaarCredentialIssuerStorage storage $ = _getAnonAadhaarCredentialIssuerStorage();
        if (!$.publicKeysHashes[publicKeyHash]) {
            revert InvalidPubKeyHash();
        }
        $.publicKeysHashes[publicKeyHash] = false;
    }

    /**
     * @dev Updates the AnonAadhar circuit verifiers for a specific circuit identifiers.
     * @param circuitIds The AnonAadhar circuit identifiers.
     * @param verifierAddresses The new AnonAadhar circuit verifier addresses.
     */
    function updateAnonAadhaarVerifiers(
        string[] calldata circuitIds,
        address[] calldata verifierAddresses
    ) public virtual onlyOwner {
        _updateAnonAadhaarVerifiers(circuitIds, verifierAddresses);
    }

    /**
     * @notice Retrieves the anonAadhaar verifier address for a given circuit id.
     * @param circuitId The circuit id identifier.
     * @return The anonAadhaar verifier address.
     */
    function anonAadhaarVerifiers(string memory circuitId) external view virtual returns (address) {
        return _getAnonAadhaarCredentialIssuerStorage()._anonAadhaarVerifiers[circuitId];
    }

    /**
     * @notice Verifies the passport credential.
     * @param credentialProof Credential proof for the passport credential
     * @param passportSignatureProof Signature proof of the validation of the passport credential
     */
    function verifyAadhaar(
        CredentialProof memory credentialProof,
        bytes memory passportSignatureProof
    ) external {
        if (bytes(credentialProof.circuitId).length == 0) {
            revert NoAnonAadhaarCircuitIdFound(credentialProof.circuitId);
        }

        (
            uint256[] memory inputs,
            uint256[2] memory a1,
            uint256[2][2] memory b1,
            uint256[2] memory c1
        ) = abi.decode(credentialProof.proof, (uint256[], uint256[2], uint256[2][2], uint256[2]));

        IAnonAadhaarCircuitVerifier.AnonAadhaarCircuitProof
            memory groth16Proof = IAnonAadhaarCircuitVerifier.AnonAadhaarCircuitProof(
                a1,
                b1,
                c1,
                [
                    inputs[0],
                    inputs[1],
                    inputs[2],
                    inputs[3],
                    inputs[4],
                    inputs[5],
                    inputs[6],
                    inputs[7],
                    inputs[8],
                    inputs[9],
                    inputs[10],
                    inputs[11]
                ]
            );

        AnonAadhaarCredentialIssuerStorage storage $ = _getAnonAadhaarCredentialIssuerStorage();
        address verifier = $._anonAadhaarVerifiers[credentialProof.circuitId];
        if (verifier == address(0)) {
            revert NoVerifierSet();
        }
        if (
            !IAnonAadhaarCircuitVerifier(verifier).verifyProof(
                groth16Proof.a,
                groth16Proof.b,
                groth16Proof.c,
                groth16Proof.pubSignals
            )
        ) {
            revert InvalidAnonAadhaarProof();
        }

        _afterProofSubmit(groth16Proof);
    }

    /**
     * @notice Returns the nullifier seed.
     * @return The nullifier seed.
     */
    function getNullifierSeed() public view returns (uint256) {
        return _getAnonAadhaarCredentialIssuerStorage().nullifierSeed;
    }

    /**
     * @notice Returns if the public key hash exists.
     * @param publicKeyHash The public key hash to check.
     * @return True if the public key hash exists, false otherwise.
     */
    function publicKeyHashExists(uint256 publicKeyHash) public view returns (bool) {
        return _getAnonAadhaarCredentialIssuerStorage().publicKeysHashes[publicKeyHash];
    }

    /**
     * @notice Returns the template root.
     * @return The template root.
     */
    function getTemplateRoot() public view returns (uint256) {
        return _getAnonAadhaarCredentialIssuerStorage().templateRoot;
    }

    /**
     * @notice Returns the expiration time.
     * @return The expiration time.
     */
    function getExpirationTime() public view returns (uint256) {
        return _getAnonAadhaarCredentialIssuerStorage().expirationTime;
    }

    /**
     * @notice Adds a QR version.
     * @param qrVersion The QR version to add.
     */
    function addQrVersion(uint256 qrVersion) public onlyOwner {
        AnonAadhaarCredentialIssuerStorage storage $ = _getAnonAadhaarCredentialIssuerStorage();
        $.qrVersions[qrVersion] = true;
    }

    /**
     * @notice Adds multiple QR versions in a batch.
     * @param qrVersions The array of QR versions to add.
     */
    function addQrVersionBatch(uint256[] calldata qrVersions) public onlyOwner {
        _addQrVersionBatch(qrVersions);
    }

    /**
     * @notice Removes a QR version.
     * @param qrVersion The QR version to remove.
     */
    function removeQrVersion(uint256 qrVersion) public onlyOwner {
        AnonAadhaarCredentialIssuerStorage storage $ = _getAnonAadhaarCredentialIssuerStorage();
        if (!$.qrVersions[qrVersion]) revert UnsupportedQrVersion(qrVersion);
        $.qrVersions[qrVersion] = false;
    }

    /**
     * @notice Checks if a QR version is supported.
     * @param qrVersion The QR version to check.
     * @return True if the QR version is supported, false otherwise.
     */
    function qrVersionSupported(uint256 qrVersion) public view returns (bool) {
        return _getAnonAadhaarCredentialIssuerStorage().qrVersions[qrVersion];
    }

    /**
     * @notice Revokes a claim and transit the state.
     * @param nonce The nonce of the claim to revoke.
     */
    function _revokeClaimAndTransit(uint64 nonce) internal {
        _getIdentityBaseStorage().identity.revokeClaim(nonce);
        _getIdentityBaseStorage().identity.transitState();
    }

    function _addPublicKeyHashesBatch(uint256[] calldata publicKeysHashes) internal {
        AnonAadhaarCredentialIssuerStorage storage $ = _getAnonAadhaarCredentialIssuerStorage();
        for (uint256 i = 0; i < publicKeysHashes.length; i++) {
            $.publicKeysHashes[publicKeysHashes[i]] = true;
            emit PublicKeyHashAdded(publicKeysHashes[i]);
        }
    }

    function _updateAnonAadhaarVerifiers(
        string[] calldata circuitIds,
        address[] calldata verifierAddresses
    ) internal {
        AnonAadhaarCredentialIssuerStorage storage $ = _getAnonAadhaarCredentialIssuerStorage();
        if (circuitIds.length != verifierAddresses.length) {
            revert LengthMismatch(circuitIds.length, verifierAddresses.length);
        }
        for (uint256 i = 0; i < circuitIds.length; i++) {
            $._anonAadhaarVerifiers[circuitIds[i]] = verifierAddresses[i];

            emit AnonAadhaarCircuitVerifierUpdated(circuitIds[i], verifierAddresses[i]);
        }
    }

    function _afterProofSubmit(
        IAnonAadhaarCircuitVerifier.AnonAadhaarCircuitProof memory proof
    ) internal {
        uint256 pubKeyHash = proof.pubSignals[0];
        uint256 nullifier = proof.pubSignals[1];
        uint256 hashIndex = proof.pubSignals[2];
        uint256 hashValue = proof.pubSignals[3];
        uint256 issuanceDate = proof.pubSignals[4];
        uint256 expirationDate = proof.pubSignals[5];
        uint256 qrVersion = proof.pubSignals[6];
        uint256 nullifierSeed = proof.pubSignals[7];
        uint256 signalHash = proof.pubSignals[8];
        uint256 templateRoot = proof.pubSignals[9];
        uint256 issuerDidHash = proof.pubSignals[10];
        uint64 revocationNonce = uint64(proof.pubSignals[11]);

        _validatePublicInputs(
            hashIndex,
            hashValue,
            nullifier,
            pubKeyHash,
            nullifierSeed,
            issuanceDate,
            expirationDate,
            templateRoot,
            issuerDidHash,
            qrVersion
        );
        _setNullifier(nullifier, revocationNonce);
        _addHashAndTransit(hashIndex, hashValue);
    }

    // solhint-disable-next-line code-complexity
    function _validatePublicInputs(
        uint256 hashIndex,
        uint256 hashValue,
        uint256 nullifier,
        uint256 pubKeyHash,
        uint256 nullifierSeed,
        uint256 issuanceDate,
        uint256 expirationDate,
        uint256 templateRoot,
        uint256 issuerDidHash,
        uint256 qrVersion
    ) internal view {
        AnonAadhaarCredentialIssuerStorage storage $ = _getAnonAadhaarCredentialIssuerStorage();
        if (hashIndex == 0) revert InvalidHashIndex();
        if (hashValue == 0) revert InvalidHashValue();
        if (nullifierSeed != $.nullifierSeed) revert InvalidNullifierSeed();
        if (templateRoot != $.templateRoot) revert InvalidTemplateRoot();
        if (issuerDidHash != $.issuerDidHash) revert InvalidIssuerDidHash();

        uint256 expectedExpiration = issuanceDate + $.expirationTime;
        if (expirationDate != expectedExpiration) {
            revert InvalidExpirationDate(expectedExpiration, expirationDate);
        }
        if (expirationDate <= block.timestamp) revert ProofExpired();
        if (!$.publicKeysHashes[pubKeyHash]) revert InvalidPubKeyHash();
        if (!$.qrVersions[qrVersion]) revert UnsupportedQrVersion(qrVersion);
        if ($._nullifiersToRevocationNonce[nullifier] != 0) revert NullifierAlreadyExists();
    }

    function _addHashAndTransit(uint256 hi, uint256 hv) internal {
        _getIdentityBaseStorage().identity.addClaimHash(hi, hv);
        _getIdentityBaseStorage().identity.transitState();
    }

    function _setNullifier(uint256 nullifier, uint64 revocationNonce) private {
        if (revocationNonce == 0) revert InvalidRevocationNonce(revocationNonce);
        AnonAadhaarCredentialIssuerStorage storage $ = _getAnonAadhaarCredentialIssuerStorage();
        $._nullifiersToRevocationNonce[nullifier] = revocationNonce;
    }

    function _addQrVersionBatch(uint256[] calldata qrVersions) internal {
        AnonAadhaarCredentialIssuerStorage storage $ = _getAnonAadhaarCredentialIssuerStorage();
        for (uint256 i = 0; i < qrVersions.length; i++) {
            $.qrVersions[qrVersions[i]] = true;
        }
    }
}
