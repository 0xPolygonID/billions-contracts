// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.27;

import {ECDSA384} from "@solarity/solidity-lib/libs/crypto/ECDSA384.sol";
import {SHA384} from "../crypto/SHA384.sol";
import {DateTime} from "@quant-finance/solidity-datetime/contracts/DateTime.sol";
import {Asn1Decode, NodePtr} from "../utils/Asn1Decode.sol";
import {BytesUtils} from "../utils/BytesUtils.sol";

error InvalidSignatureAlgorithm();

library CertificatesLib {
    /**
     * @dev Certificate. Information about the parsed certificate
     * @param serialNumber Serial number of the certificate
     * @param validNotBefore Validity start date of the certificate
     * @param validNotAfter Validity end date of the certificate
     * @param publicKey Public key of the certificate
     * @param signature Signature of the tbsCertificate from the issuer of the certificate
     * @param tbsCertificate To be signed certificate
     */
    struct Certificate {
        uint160 serialNumber;
        uint40 validNotBefore;
        uint40 validNotAfter;
        bytes publicKey;
        bytes signature;
        bytes tbsCertificate;
    }

    uint256 private constant BYTES_POINT_CURVE = 48;

    using ECDSA384 for *;
    using SHA384 for *;
    using Asn1Decode for bytes;
    using BytesUtils for bytes;

    /**
     * @dev Verify wheter the P-384 signature is valid
     * @param data Information that was signed
     * @param signature Signature to be verified
     * @param publicKey Public key of the signer to verify the signature
     */
    function verifyP384Signature(
        bytes calldata data,
        bytes calldata signature,
        bytes calldata publicKey
    ) external view returns (bool) {
        /* solhint-disable max-line-length */
        ECDSA384.Parameters memory _secp384r1CurveParams = ECDSA384.Parameters({
            a: hex"fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeffffffff0000000000000000fffffffc",
            b: hex"b3312fa7e23ee7e4988e056be3f82d19181d9c6efe8141120314088f5013875ac656398d8a2ed19d2a85c8edd3ec2aef",
            gx: hex"aa87ca22be8b05378eb1c71ef320ad746e1d3b628ba79b9859f741e082542a385502f25dbf55296c3a545e3872760ab7",
            gy: hex"3617de4a96262c6f5d9e98bf9292dc29f8f41dbd289a147ce9da3113b5f0b8c00a60b1ce1d7e819d7a431d7c90ea0e5f",
            p: hex"fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffeffffffff0000000000000000ffffffff",
            n: hex"ffffffffffffffffffffffffffffffffffffffffffffffffc7634d81f4372ddf581a0db248b0a77aecec196accc52973",
            // only accept signatures with S values in the lower half of the curve lowSmax = n/2
            // lowSmax: hex"7fffffffffffffffffffffffffffffffffffffffffffffffe3b1a6c0fa1b96efac0d06d9245853bd76760cb5666294b9"
            lowSmax: hex"ffffffffffffffffffffffffffffffffffffffffffffffffc7634d81f4372ddf581a0db248b0a77aecec196accc52973"
        });
        /* solhint-enable max-line-length */

        return
            _secp384r1CurveParams.verify(
                abi.encodePacked(SHA384.sha384(data)),
                signature,
                publicKey
            );
    }

    /**
     * @dev Parse the certificate
     * @param cert Certificate in PEM format in bytes
     */
    function parseCertificate(bytes memory cert) external pure returns (Certificate memory) {
        Certificate memory certificate;

        uint256 node1;
        uint256 node2;
        uint256 node3;

        node1 = cert.root();
        node1 = cert.firstChildOf(node1);
        certificate.tbsCertificate = cert.allBytesAt(node1); // tbsCertificate including header

        node2 = cert.nextSiblingOf(node1);
        node3 = cert.firstChildOf(node2); // signatureAlgorithm

        // We suport ecdsawithSHA384 only now
        // Oid for ecdsawithSHA384 in hex 0x2A8648CE3D040303
        if (keccak256(hex"2a8648ce3d040303") != keccak256(cert.bytesAt(node3))) {
            revert InvalidSignatureAlgorithm();
        }

        node2 = cert.nextSiblingOf(node2); // signature BITSTRING ASN1 encoded
        // Dss-Sig-Value  ::=  SEQUENCE  {
        //      r       INTEGER,
        //      s       INTEGER  }

        bytes memory signatureASN1 = cert.bitstringAt(node2);

        node3 = signatureASN1.root();
        node3 = signatureASN1.firstChildOf(node3); // r
        certificate.signature = signatureASN1.bytesAt(node3);
        // r and s must be BYTES_POINT_CURVE bytes each
        if (certificate.signature.length > BYTES_POINT_CURVE) {
            certificate.signature = certificate.signature.substring(
                certificate.signature.length - BYTES_POINT_CURVE,
                BYTES_POINT_CURVE
            );
        }
        node3 = signatureASN1.nextSiblingOf(node3); // s

        bytes memory s = signatureASN1.bytesAt(node3);
        if (s.length > BYTES_POINT_CURVE) {
            s = s.substring(s.length - BYTES_POINT_CURVE, BYTES_POINT_CURVE);
        }
        certificate.signature = abi.encodePacked(certificate.signature, s); // concat s

        node2 = cert.firstChildOf(node1);
        if (cert[NodePtr.ixs(node2)] == 0xa0) {
            node2 = cert.nextSiblingOf(node2);
        }
        // Extract serial number
        certificate.serialNumber = uint160(cert.uintAt(node2));

        node2 = cert.nextSiblingOf(node2);
        node2 = cert.firstChildOf(node2);

        node1 = cert.firstChildOf(node1);
        node1 = cert.nextSiblingOf(node1);
        node1 = cert.nextSiblingOf(node1);
        node1 = cert.nextSiblingOf(node1);
        node1 = cert.nextSiblingOf(node1);

        node2 = cert.firstChildOf(node1);
        // Check validNotBefore
        certificate.validNotBefore = uint40(_toTimestamp(cert.bytesAt(node2)));
        node2 = cert.nextSiblingOf(node2);
        // Check validNotAfter
        certificate.validNotAfter = uint40(_toTimestamp(cert.bytesAt(node2)));

        node1 = cert.nextSiblingOf(node1);
        node1 = cert.nextSiblingOf(node1);
        node2 = cert.firstChildOf(node1);
        node2 = cert.nextSiblingOf(node2);

        bytes memory publicKey = cert.bitstringAt(node2);
        certificate.publicKey = new bytes(publicKey.length - 1);
        // remove 0x04 prefix that indicates the uncompressed form of the public key
        for (uint256 i = 0; i < publicKey.length - 1; i++) {
            certificate.publicKey[i] = publicKey[i + 1];
        }

        return certificate;
    }

    /**
     * @dev Parse the certificate with the minimum info needed (serial number, validity dates)
     * @param cert Certificate in PEM format in bytes
     */
    function parseCertificateMinimal(bytes memory cert) external pure returns (Certificate memory) {
        Certificate memory certificate;

        uint256 node1;
        uint256 node2;

        node1 = cert.root();
        node1 = cert.firstChildOf(node1);

        node2 = cert.firstChildOf(node1);
        if (cert[NodePtr.ixs(node2)] == 0xa0) {
            node2 = cert.nextSiblingOf(node2);
        }
        // Extract serial number
        certificate.serialNumber = uint160(cert.uintAt(node2));

        node1 = cert.firstChildOf(node1);
        node1 = cert.nextSiblingOf(node1);
        node1 = cert.nextSiblingOf(node1);
        node1 = cert.nextSiblingOf(node1);
        node1 = cert.nextSiblingOf(node1);

        node2 = cert.firstChildOf(node1);
        // Check validNotBefore
        certificate.validNotBefore = uint40(_toTimestamp(cert.bytesAt(node2)));
        node2 = cert.nextSiblingOf(node2);
        // Check validNotAfter
        certificate.validNotAfter = uint40(_toTimestamp(cert.bytesAt(node2)));

        return certificate;
    }

    function _toTimestamp(bytes memory x509Time) private pure returns (uint256) {
        uint16 yrs;
        uint8 mnths;
        uint8 dys;
        uint8 hrs;
        uint8 mins;
        uint8 secs;
        uint8 offset;

        if (x509Time.length == 13) {
            if (uint8(x509Time[0]) - 48 < 5) yrs += 2000;
            else yrs += 1900;
        } else {
            yrs += (uint8(x509Time[0]) - 48) * 1000 + (uint8(x509Time[1]) - 48) * 100;
            offset = 2;
        }
        yrs += (uint8(x509Time[offset + 0]) - 48) * 10 + uint8(x509Time[offset + 1]) - 48;
        mnths = (uint8(x509Time[offset + 2]) - 48) * 10 + uint8(x509Time[offset + 3]) - 48;
        dys += (uint8(x509Time[offset + 4]) - 48) * 10 + uint8(x509Time[offset + 5]) - 48;
        hrs += (uint8(x509Time[offset + 6]) - 48) * 10 + uint8(x509Time[offset + 7]) - 48;
        mins += (uint8(x509Time[offset + 8]) - 48) * 10 + uint8(x509Time[offset + 9]) - 48;
        secs += (uint8(x509Time[offset + 10]) - 48) * 10 + uint8(x509Time[offset + 11]) - 48;

        return DateTime.timestampFromDateTime(yrs, mnths, dys, hrs, mins, secs);
    }
}
