// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import {IdentityLib} from "@iden3/contracts/lib/IdentityLib.sol";
import {IdentityBase} from "@iden3/contracts/lib/IdentityBase.sol";
import {IZKPVerifier} from "@iden3/contracts/interfaces/IZKPVerifier.sol";
import {IAnonAadhaarCircuitVerifier} from "../interfaces/IAnonAadhaarCircuitVerifier.sol";
import {ImplRoot} from "../upgradeable/ImplRoot.sol";

error InvalidResponsesLength(uint256 length, uint256 expectedLength);
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

event IssuerDidHashUpdated(uint256 issuerDidHash);
event TemplateRootUpdated(uint256 templateRoot);
event NullifierCleaned(uint256 nullifier);
event PublicKeyHashAdded(uint256 publicKeyHash);

/**
 * @dev Address ownership credential issuer.
 * This issuer issues non-merklized credentials in a decentralized manner.
 */
contract AnonAadhaarCredentialIssuerImplV1 is IdentityBase, ImplRoot {
    using IdentityLib for IdentityLib.Data;

    string public constant VERSION = "1.0.1";

    /// @custom:storage-location erc7201:polygonid.storage.AnonAadhaarIssuerV1
    struct AnonAadhaarIssuerV1Storage {
        uint256 nullifierSeed;
        uint256 expirationTime;
        uint256 templateRoot;
        uint256 issuerDidHash;
        address anonAadhaarVerifier;
        mapping(uint256 => bool) publicKeysHashes;
        mapping(uint256 nullifier => HashIndexHashValueNullifier hashIndexHashValue) nullifiers;
        mapping(uint256 qrVersion => bool) qrVersions;
    }

    struct HashIndexHashValueNullifier {
        uint256 hashIndex;
        uint256 hashValue;
        bool isSet;
    }

    // check if the hash was calculated correctly
    // keccak256(abi.encode(uint256(keccak256("polygonid.storage.AnonAadhaarIssuerV1")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant AnonAadhaarIssuerV1StorageLocation = 
        0xcb4c32479afd0d9095322a3f93b16fa02cb0bf6c78456f30d0d6005caa749700;
    
    function _getAnonAadhaarIssuerV1Storage() 
        private
        pure 
        returns (AnonAadhaarIssuerV1Storage storage store) 
    {
        assembly {
            store.slot := AnonAadhaarIssuerV1StorageLocation
        }
    }

    /**
     * @notice Constructor that disables initializers.
     * @dev Prevents direct initialization of the implementation contract.
     */
    constructor()  {      
        _disableInitializers();
    }

    function initialize(
        uint256 nullifierSeed,
        uint256[] calldata publicKeysHashes,
        uint256[] calldata qrVersions,
        uint256 expirationTime,
        uint256 templateRoot,
        address anonAadhaarVerifier, 
        address _stateContractAddress,
        bytes2 idType
    ) public initializer {
        if (anonAadhaarVerifier == address(0)) revert InvalidVerifierAddress();
        if (_stateContractAddress == address(0)) revert InvalidStateContractAddress();

        super.initialize(_stateContractAddress, idType);
        __Ownable_init(msg.sender);

        AnonAadhaarIssuerV1Storage storage $ = _getAnonAadhaarIssuerV1Storage();
        $.nullifierSeed = nullifierSeed;
        $.expirationTime = expirationTime;
        $.templateRoot = templateRoot;
        $.anonAadhaarVerifier = anonAadhaarVerifier;

        addPublicKeyHashesBatch(publicKeysHashes);
        addQrVersionBatch(qrVersions);
    }    

    /**
     * @notice Updates the issuer DID hash.
     * @param issuerDidHash The new issuer DID hash.
     */
    function setIssuerDidHash(uint256 issuerDidHash) public onlyOwner {
        AnonAadhaarIssuerV1Storage storage $ = _getAnonAadhaarIssuerV1Storage();
        $.issuerDidHash = issuerDidHash;
        emit IssuerDidHashUpdated(issuerDidHash);
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
        AnonAadhaarIssuerV1Storage storage $ = _getAnonAadhaarIssuerV1Storage();
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
        if ($.nullifiers[nullifier].isSet) revert NullifierAlreadyExists();
        if (!$.qrVersions[qrVersion]) revert UnsupportedQrVersion(qrVersion);
    }

    function _addHashAndTransit(uint256 hi, uint256 hv) private {
        _getIdentityBaseStorage().identity.addClaimHash(hi, hv);
        _getIdentityBaseStorage().identity.transitState();
    }

    function _setNullifier(uint256 nullifier, uint256 hi, uint256 hv) private {
        AnonAadhaarIssuerV1Storage storage $ = _getAnonAadhaarIssuerV1Storage();
        $.nullifiers[nullifier] = HashIndexHashValueNullifier(hi, hv, true);
    }

    function nullifierExists(uint256 nullifier) external view returns (bool) {
        AnonAadhaarIssuerV1Storage storage $ = _getAnonAadhaarIssuerV1Storage();
        return $.nullifiers[nullifier].isSet;
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
        _setNullifier(nullifier, hashIndex, hashValue);
        _addHashAndTransit(hashIndex, hashValue);
    }

    /**
     * @notice Updates the template root.
     * @param templateRoot The new template root.
     */
    function setTemplateRoot(uint256 templateRoot) public onlyProxy onlyOwner {
        AnonAadhaarIssuerV1Storage storage $ = _getAnonAadhaarIssuerV1Storage();
        $.templateRoot = templateRoot;
        emit TemplateRootUpdated(templateRoot);
    }

    /**
     * @notice Cleans a nullifier.
     * @param nullifier The nullifier to clean.
     */
    function cleanNullifier(uint256 nullifier) public onlyProxy onlyOwner {
        AnonAadhaarIssuerV1Storage storage $ = _getAnonAadhaarIssuerV1Storage();
        if (!$.nullifiers[nullifier].isSet) revert NullifierDoesNotExist();
        $.nullifiers[nullifier] = HashIndexHashValueNullifier(0, 0, false);
        emit NullifierCleaned(nullifier);
    }

    /**
     * @notice Adds a public key hash.
     * @param publicKeyHash The public key hash to add.
     */
    function addPublicKeyHash(
        uint256 publicKeyHash
    ) public onlyProxy onlyOwner {
        AnonAadhaarIssuerV1Storage storage $ = _getAnonAadhaarIssuerV1Storage();
        $.publicKeysHashes[publicKeyHash] = true;
        emit PublicKeyHashAdded(publicKeyHash);
    }

    /**
     * @notice Adds multiple public key hashes in a batch.
     * @param publicKeysHashes The array of public key hashes to add.
     */
    function addPublicKeyHashesBatch(uint256[] calldata publicKeysHashes) public onlyProxy onlyOwner {
        AnonAadhaarIssuerV1Storage storage $ = _getAnonAadhaarIssuerV1Storage();
        for (uint256 i = 0; i < publicKeysHashes.length; i++) {
            $.publicKeysHashes[publicKeysHashes[i]] = true;
            emit PublicKeyHashAdded(publicKeysHashes[i]);
        }
    }

    function submitZKPResponseV2(
        IZKPVerifier.ZKPResponse[] memory responses,
        bytes memory crossChainProofs
    ) external {
        if (responses.length != 1) {
            revert InvalidResponsesLength(responses.length, 1);
        }
        
        (
            uint256[] memory inputs,
            uint256[2] memory a1,
            uint256[2][2] memory b1,
            uint256[2] memory c1
        ) = abi.decode(responses[0].zkProof, (uint256[], uint256[2], uint256[2][2], uint256[2]));


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
                    inputs[10]
                ]
            );

        AnonAadhaarIssuerV1Storage storage $ = _getAnonAadhaarIssuerV1Storage();
        address verifier = $.anonAadhaarVerifier;
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
        return _getAnonAadhaarIssuerV1Storage().nullifierSeed;
    }

    /**
     * @notice Returns if the public key hash exists.
     * @param publicKeyHash The public key hash to check.
     * @return True if the public key hash exists, false otherwise.
     */
    function publicKeyHashExists(uint256 publicKeyHash) public view returns (bool) {
        return _getAnonAadhaarIssuerV1Storage().publicKeysHashes[publicKeyHash];
    }

    /**
     * @notice Returns the template root.
     * @return The template root.
     */
    function getTemplateRoot() public view returns (uint256) {
        return _getAnonAadhaarIssuerV1Storage().templateRoot;
    }

    /**
     * @notice Returns the expiration time.
     * @return The expiration time.
     */
    function getExpirationTime() public view returns (uint256) {
        return _getAnonAadhaarIssuerV1Storage().expirationTime;
    }

    /**
     * @notice Adds a QR version.
     * @param qrVersion The QR version to add.
     */
    function addQrVersion(uint256 qrVersion) public onlyProxy onlyOwner {
        AnonAadhaarIssuerV1Storage storage $ = _getAnonAadhaarIssuerV1Storage();
        $.qrVersions[qrVersion] = true;
    }

    /**
     * @notice Adds multiple QR versions in a batch.
     * @param qrVersions The array of QR versions to add.
     */
    function addQrVersionBatch(uint256[] calldata qrVersions) public onlyProxy onlyOwner {
        AnonAadhaarIssuerV1Storage storage $ = _getAnonAadhaarIssuerV1Storage();
        for (uint256 i = 0; i < qrVersions.length; i++) {
            $.qrVersions[qrVersions[i]] = true;
        }
    }

    /**
     * @notice Removes a QR version.
     * @param qrVersion The QR version to remove.
     */
    function removeQrVersion(uint256 qrVersion) public onlyProxy onlyOwner {
        AnonAadhaarIssuerV1Storage storage $ = _getAnonAadhaarIssuerV1Storage();
        if (!$.qrVersions[qrVersion]) revert UnsupportedQrVersion(qrVersion);
        $.qrVersions[qrVersion] = false;
    }

    /**
     * @notice Checks if a QR version is supported.
     * @param qrVersion The QR version to check.
     * @return True if the QR version is supported, false otherwise.
     */
    function qrVersionSupported(uint256 qrVersion) public view returns (bool) {
        return _getAnonAadhaarIssuerV1Storage().qrVersions[qrVersion];
    }
}
