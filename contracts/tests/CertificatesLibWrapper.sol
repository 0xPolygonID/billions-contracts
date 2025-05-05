// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import {CertificatesLib} from "../utils/CertificatesLib.sol";

contract CertificatesLibWrapper {
    function parseCertificate(
        bytes calldata certificate
    ) external pure returns (CertificatesLib.Certificate memory) {
        return CertificatesLib.parseCertificate(certificate);
    }

    function parseCertificateMinimal(
        bytes calldata certificate
    ) external pure returns (CertificatesLib.Certificate memory) {
        return CertificatesLib.parseCertificateMinimal(certificate);
    }

    function verifyP384Signature(
        bytes calldata data,
        bytes calldata signature,
        bytes calldata publicKey
    ) external view returns (bool) {
        return CertificatesLib.verifyP384Signature(data, signature, publicKey);
    }
}
