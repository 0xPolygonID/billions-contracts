// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {ICertificatesValidator} from "../interfaces/ICertificatesValidator.sol";
import {CertificatesLib} from "../utils/CertificatesLib.sol";

error CertificateNotYetValid();
error CertificateExpired();
error CertificateNotVerifiedYet(uint256 serialNumber);
error CertificateVerificationFailed(uint256 serialNumber);

contract CertificatesValidator is Ownable2StepUpgradeable, ICertificatesValidator {
    /**
     * @dev Version of contract
     */
    string public constant VERSION = "1.0.0";

    /// @dev Main storage structure for the contract
    /// @custom:storage-location iden3.storage.CertificatesValidator
    struct CertificatesValidatorStorage {
        mapping(uint256 serialNumber => bool) _certificatesValidation;
    }

    // keccak256(abi.encode(uint256(keccak256("iden3.storage.CertificatesValidator")) - 1))
    //  & ~bytes32(uint256(0xff));
    // solhint-disable-next-line const-name-snakecase
    bytes32 private constant CertificatesValidatorStorageLocation =
        0xcb80662a476e272304626310789d2f9a6b29489a656625f60f1d91af64df6e00;

    /// @dev Get the main storage using assembly to ensure specific storage location
    function _getCertificatesValidatorStorage()
        private
        pure
        returns (CertificatesValidatorStorage storage $)
    {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            $.slot := CertificatesValidatorStorageLocation
        }
    }

    /**
     * @dev Get the version of the contract
     * @return Version of the contract
     */
    function version() public pure returns (string memory) {
        return VERSION;
    }

    /**
     * @dev Initialize the contract
     * @param owner Owner of the contract
     */
    function initialize(address owner) public initializer {
        __Ownable_init(owner);
    }

    /**
     * @dev Validate the chain of certificates
     * @param certificates Chain of certificates in PEM format sorted. Root certificate is latest.
     */
    function validateChainOfCertificates(
        bytes[] calldata certificates
    ) external view returns (bool) {
        CertificatesLib.Certificate[] memory certificatesParsed = new CertificatesLib.Certificate[](
            certificates.length + 1
        );

        // Check expiration and validity of certificates
        for (uint256 i = 0; i < certificates.length; i++) {
            // Parse certificate minimal for checking validity
            certificatesParsed[i] = CertificatesLib.parseCertificateMinimal(certificates[i]);
            if (
                !_getCertificatesValidatorStorage()._certificatesValidation[
                    certificatesParsed[i].serialNumber
                ]
            ) {
                revert CertificateNotVerifiedYet(certificatesParsed[i].serialNumber);
            }

            if (block.timestamp > certificatesParsed[i].validNotAfter) {
                revert CertificateExpired();
            }

            if (certificatesParsed[i].validNotBefore > block.timestamp) {
                revert CertificateNotYetValid();
            }
        }

        return true;
    }

    /**
     * @dev Adds certificate verification to the contract
     * @param subjectCertificate Certificate to verify the signature with issuer public key.
     * @param issuerCertificate Certificate of the issuer.
     */
    function addCertificateVerification(
        bytes calldata subjectCertificate,
        bytes calldata issuerCertificate
    ) external {
        CertificatesLib.Certificate memory sc = CertificatesLib.parseCertificate(
            subjectCertificate
        );

        // Check if certificate is already verified
        if (_getCertificatesValidatorStorage()._certificatesValidation[sc.serialNumber]) {
            return;
        }

        CertificatesLib.Certificate memory ic = CertificatesLib.parseCertificate(issuerCertificate);

        bool result = CertificatesLib.verifyP384Signature(
            sc.tbsCertificate,
            sc.signature,
            ic.publicKey
        );

        if (result) {
            _getCertificatesValidatorStorage()._certificatesValidation[sc.serialNumber] = true;
        } else {
            revert CertificateVerificationFailed(sc.serialNumber);
        }
    }
}
