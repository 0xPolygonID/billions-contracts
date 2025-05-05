// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

/**
 * @dev ICertificatesValidator. Interface for validation of certificates.
 */
interface ICertificatesValidator {
    /**
     * @dev Get version of the contract
     */
    function version() external view returns (string memory);

    /**
     * @dev Validate the chain of certificates
     * @param certificates Chain of certificates in PEM format sorted. Root certificate is latest.
     */
    function validateChainOfCertificates(
        bytes[] calldata certificates
    ) external view returns (bool);

    /**
     * @dev Adds certificate verification to the contract
     * @param subjectCertificate Certificate to verify the signature with issuer public key.
     * @param issuerCertificate Certificate of the issuer.
     */
    function addCertificateVerification(
        bytes calldata subjectCertificate,
        bytes calldata issuerCertificate
    ) external;
}
