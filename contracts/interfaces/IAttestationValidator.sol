// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import {ICertificatesValidator} from "./ICertificatesValidator.sol";

/**
 * @dev IAttestationValidator. Interface for verification of attestations.
 */
interface IAttestationValidator {
    struct Attestation {
        uint256 tag;
        AttestationValue value;
    }

    struct AttestationValue {
        bytes protectedHeader;
        bytes unprotectedHeader;
        Payload payload;
        bytes rawPayload;
        bytes signature;
        bytes32 imageHash;
    }

    struct Payload {
        string moduleId;
        string digest;
        uint256 timestamp;
        bytes[] pcrs;
        bytes certificate;
        bytes[] cabundle;
        bytes publicKey;
        bytes userData;
        bytes nonce;
    }

    /**
     * @dev Get version of the contract
     */
    function version() external view returns (string memory);

    /**
     * @dev Validates the attestation
     * @param attestation bytes for the attestation
     * @param checkCertificatesValidation indicates wether to check expiration for the credential
     * @return User data fields and a boolean indicating if the attestation is valid
     */
    function validateAttestation(
        bytes calldata attestation,
        bool checkCertificatesValidation
    ) external returns (bytes memory, bytes32 imageHash, bool);

    /**
     * @dev Validates the attestation
     * @param protectedHeader bytes for the protected header
     * @param rawPayload bytes for the raw payload
     * @param signature bytes for the signature
     * @param checkCertificatesValidation indicates wether to check expiration for the certificates
     * @return User data bytes and a boolean indicating if the attestation is valid
     */
    function validateAttestationV2(
        bytes calldata protectedHeader,
        bytes calldata rawPayload,
        bytes calldata signature,
        bool checkCertificatesValidation
    ) external returns (bytes memory, bytes32 imageHash, bool);

    /**
     * @dev Parse the attestation data and return the parsed data
     * @param attestation The attestation bytes data
     */
    function parseAttestation(
        bytes calldata attestation
    ) external pure returns (Attestation memory);

    /**
     * @dev Set certificates validator
     * @param validator - certificates validator
     */
    function setCertificatesValidator(ICertificatesValidator validator) external;
}
