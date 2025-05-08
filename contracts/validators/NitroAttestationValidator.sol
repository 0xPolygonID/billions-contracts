// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {IAttestationValidator} from "../interfaces/IAttestationValidator.sol";
import {ICertificatesValidator} from "../interfaces/ICertificatesValidator.sol";
import {PrimitiveTypeUtils} from "@iden3/contracts/lib/PrimitiveTypeUtils.sol";
import {CertificatesLib} from "../utils/CertificatesLib.sol";

error InvalidCOSETag();
error InvalidCOSESign1Message();
error InvalidCOSESign1MessagePayload();
error UnsupportedCBORType(uint8 majorType);
error UnsupportedIntegerSize(uint256 length);
error UnsupportedSimpleValue(uint8 value);

// Major Data Types for CBOR
enum MajorType {
    UnsignedInteger,
    NegativeInteger,
    ByteString,
    TextString,
    Array,
    Map,
    Tag,
    SingleValue
}

enum DataType {
    Claim,
    Other
}

contract NitroAttestationValidator is Ownable2StepUpgradeable, IAttestationValidator, ERC165 {
    /**
     * @dev Version of contract
     */
    string public constant VERSION = "1.0.0";

    bytes32 private constant FIELD_MODULE_ID =
        0x8ce577cf664c36ba5130242bf5790c2675e9f4e6986a842b607821bee25372ee; // keccak256("module_id")
    bytes32 private constant FIELD_DIGEST =
        0x682a7e258d80bd2421d3103cbe71e3e3b82138116756b97b8256f061dc2f11fb; // keccak256("digest")
    bytes32 private constant FIELD_TIMESTAMP =
        0x4ebf727c48eac2c66272456b06a885c5cc03e54d140f63b63b6fd10c1227958e; // keccak256("timestamp")
    bytes32 private constant FIELD_PCRS =
        0x61585f8bc67a4b6d5891a4639a074964ac66fc2241dc0b36c157dc101325367a; // keccak256("pcrs")
    bytes32 private constant FIELD_CERTIFICATE =
        0x925cec779426f44d8d555e01d2683a3a765ce2fa7562ca7352aeb09dfc57ea6a; // keccak256("certificate")
    bytes32 private constant FIELD_PUBLIC_KEY =
        0xc7b28019ccfdbd30ffc65951d94bb85c9e2b8434111a000b5afd533ce65f57a4; // keccak256("public_key")
    bytes32 private constant FIELD_CABUNDLE =
        0x8a8cb7aa1da17ada103546ae6b4e13ccc2fafa17adf5f93925e0a0a4e5681a6a; // keccak256("cabundle")
    bytes32 private constant FIELD_USER_DATA =
        0x5e4ea5393e4327b3014bc32f2264336b0d1ee84a4cfd197c8ad7e1e16829a16a; // keccak256("user_data")

    /// @dev Main storage structure for the contract
    /// @custom:storage-location iden3.storage.NitroAttestationValidator
    struct NitroAttestationValidatorStorage {
        ICertificatesValidator _certificatesValidator;
    }

    // keccak256(abi.encode(uint256(keccak256("iden3.storage.NitroAttestationValidator")) - 1))
    //  & ~bytes32(uint256(0xff));
    // solhint-disable-next-line const-name-snakecase
    bytes32 private constant NitroAttestationValidatorStorageLocation =
        0x1208343262ba68924eccc6da9f6f62080c52b75937d283159a3723e1bd998700;

    /// @dev Get the main storage using assembly to ensure specific storage location
    function _getNitroAttestationValidatorStorage()
        private
        pure
        returns (NitroAttestationValidatorStorage storage $)
    {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            $.slot := NitroAttestationValidatorStorageLocation
        }
    }

    /**
     * @dev Get the version of the contract
     * @return Version of the contract
     */
    function version() public pure override returns (string memory) {
        return VERSION;
    }

    /**
     * @dev Initialize the contract
     * @param owner Owner of the contract
     */
    function initialize(address owner, ICertificatesValidator certificatesValidator) public initializer {
        __Ownable_init(owner);
        _getNitroAttestationValidatorStorage()._certificatesValidator = certificatesValidator;
    }

    /**
     * @dev Set certificates validator
     * @param certificatesValidator - certificates validator
     */
    function setCertificatesValidator(ICertificatesValidator certificatesValidator) external onlyOwner {
        _getNitroAttestationValidatorStorage()._certificatesValidator = certificatesValidator;
    }

    /**
     * @dev Validate the attestation signature
     * @param attestation The attestation bytes data
     * @param checkCertificatesValidation indicates wether to check expiration for the certificates
     * @return User data bytes and a boolean indicating if the attestation is valid
     */
    function validateAttestation(
        bytes calldata attestation,
        bool checkCertificatesValidation
    ) external view returns (bytes memory, bytes32, bool) {
        // The steps for verifying a signature are (https://www.rfc-editor.org/rfc/rfc8152#section-4.4):

        // 1. Parse the attestation data
        Attestation memory attestationObj = _parseAttestation(attestation);

        // 2. Validate the attestation
        return
            _validateAttestation(
                attestationObj.value.protectedHeader,
                attestationObj.value.payload,
                attestationObj.value.rawPayload,
                attestationObj.value.signature,
                checkCertificatesValidation
            );
    }

    /**
     * @dev Parse the attestation data and return the parsed data
     * @param attestation The attestation bytes data
     */
    function parseAttestation(bytes calldata attestation) public pure returns (Attestation memory) {
        return _parseAttestation(attestation);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(IAttestationValidator).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function _validateAttestation(
        bytes memory protectedHeader,
        Payload memory payload,
        bytes memory rawPayload,
        bytes memory signature,
        bool checkCertificatesValidation
    ) private view returns (bytes memory, bytes32, bool) {
        // 2. Create the value ToBeSigned by encoding the Sig_structure to a byte string,
        // using the encoding described in Section 14 https://www.rfc-editor.org/rfc/rfc8152#section-14.
        bytes memory toBeSigned = _getToBeSigned(protectedHeader, rawPayload);

        bytes[] memory certificates = new bytes[](payload.cabundle.length + 1);

        certificates[0] = payload.certificate;
        for (uint256 i = 0; i < payload.cabundle.length; i++) {
            certificates[payload.cabundle.length - (i + 1) + 1] = payload.cabundle[i];
        }

        if (checkCertificatesValidation) {
            _getNitroAttestationValidatorStorage()
                ._certificatesValidator
                .validateChainOfCertificates(certificates);
        }

        CertificatesLib.Certificate memory parsedCertificate = CertificatesLib.parseCertificate(
            payload.certificate
        );

        bytes32 imageHash = keccak256(payload.pcrs[0]); // keccak256 of PCR0 (hash of the enclave image)

        // 3. Call the signature verification algorithm passing in K (the key to verify with),
        // alg (the algorithm used sign with), ToBeSigned (the value to sign), and sig (the signature to be verified).
        if (
            CertificatesLib.verifyP384Signature(toBeSigned, signature, parsedCertificate.publicKey)
        ) {
            return (payload.userData, imageHash, true);
        }
        return (payload.userData, imageHash, false);
    }

    function _parseAttestation(
        bytes calldata attestation
    ) private pure returns (Attestation memory) {
        bytes memory attestationData;

        if (attestation[0] != 0xd2) {
            // is COSE format (CBOR Object Signing and Encryption)
            attestationData = bytes.concat(bytes(hex"d2"), attestation);
        } else {
            attestationData = attestation;
        }

        uint256 pointer = 0;
        uint8 majorType;
        uint256 value;
        uint256 tagValue;

        (majorType, tagValue, pointer, ) = _decodeCBOR(attestationData, pointer);
        if (majorType != uint8(MajorType.Tag) || tagValue != 18) {
            revert InvalidCOSETag();
        }

        (majorType, value, pointer, ) = _decodeCBOR(attestationData, pointer);

        if (majorType != uint8(MajorType.Array) || value != 4) {
            revert InvalidCOSESign1Message();
        }

        AttestationValue memory attestationValue;

        (majorType, value, pointer, attestationValue.protectedHeader) = _decodeCBOR(
            attestationData,
            pointer
        );
        (majorType, value, pointer, attestationValue.unprotectedHeader) = _decodeCBOR(
            attestationData,
            pointer
        );
        (majorType, value, pointer, attestationValue.rawPayload) = _decodeCBOR(
            attestationData,
            pointer
        );
        (majorType, value, pointer, attestationValue.signature) = _decodeCBOR(
            attestationData,
            pointer
        );

        attestationValue.payload = _parsePayload(attestationValue.rawPayload);
        // keccak256 of PCR0 (hash of the enclave image)
        attestationValue.imageHash = keccak256(attestationValue.payload.pcrs[0]);

        return Attestation(tagValue, attestationValue);
    }

    /* solhint-disable code-complexity*/
    function _parsePayload(bytes memory rawPayload) private pure returns (Payload memory) {
        uint256 pointer = 0;
        uint8 majorType;
        uint256 value;
        bytes memory output;

        Payload memory payload;

        (majorType, value, pointer, output) = _decodeCBOR(rawPayload, pointer);

        if (majorType != uint8(MajorType.Map) || value != 9) {
            revert InvalidCOSESign1MessagePayload();
        }

        while (pointer < rawPayload.length) {
            bytes memory field;
            (majorType, value, pointer, field) = _decodeCBOR(rawPayload, pointer);

            (majorType, value, pointer, output) = _decodeCBOR(rawPayload, pointer);

            if (keccak256(field) == FIELD_MODULE_ID) {
                payload.moduleId = string(output);
            } else if (keccak256(field) == FIELD_DIGEST) {
                payload.digest = string(output);
            } else if (keccak256(field) == FIELD_TIMESTAMP) {
                payload.timestamp = value;
            } else if (keccak256(field) == FIELD_PCRS) {
                uint256 pcrsLength = value;
                payload.pcrs = new bytes[](pcrsLength);

                for (uint256 j = 0; j < pcrsLength; j++) {
                    (majorType, value, pointer, output) = _decodeCBOR(rawPayload, pointer);
                    (majorType, value, pointer, output) = _decodeCBOR(rawPayload, pointer);
                    payload.pcrs[j] = output;
                }
            } else if (keccak256(field) == FIELD_CERTIFICATE) {
                payload.certificate = output;
            } else if (keccak256(field) == FIELD_PUBLIC_KEY) {
                payload.publicKey = output;
            } else if (keccak256(field) == FIELD_CABUNDLE) {
                uint256 cabundleLength = value;
                payload.cabundle = new bytes[](cabundleLength);
                for (uint256 j = 0; j < cabundleLength; j++) {
                    (majorType, value, pointer, output) = _decodeCBOR(rawPayload, pointer);
                    payload.cabundle[j] = output;
                }
            } else if (keccak256(field) == FIELD_USER_DATA) {
                payload.userData = output;
            }
        }

        return payload;
    }

    /* solhint-enable code-complexity*/

    function _getToBeSigned(
        bytes memory protectedHeader,
        bytes memory payload
    ) private pure returns (bytes memory) {
        //    Sig_structure = [
        //        "Signature1",
        //        protectedHeader,
        //        external_aad,  // empty in our case
        //        payload
        //    ]

        bytes2 payloadLength = bytes2(
            PrimitiveTypeUtils.uint256ToBytes(PrimitiveTypeUtils.reverseUint256(payload.length))
        );
        payloadLength = bytes2(abi.encodePacked(payloadLength[1], payloadLength[0]));
        // Create the value ToBeSigned by encoding the Sig_structure to a byte string,
        // using the encoding described in Section 14 https://www.rfc-editor.org/rfc/rfc8152#section-14.
        bytes memory toBeSigned = bytes.concat(
            bytes(hex"84"), // 0x84 = CBOR encoded array(4)
            bytes(hex"6a"), // 0x6a = CBOR encoded text(10) for "Signature1"
            bytes(hex"5369676e617475726531"), // "Signature1"
            bytes(hex"44"), // 0x44 = CBOR encoded bytes(4) for protectedHeader
            protectedHeader, // protectedHeader
            bytes(hex"40"), // 0x40 = CBOR encoded bytes(0) for external_aad
            bytes(hex"59"), // 0x59xxxx = CBOR encoded bytes(xxxx) for payload
            payloadLength, // length of the payload (xxxx)
            payload // payload
        );

        return toBeSigned;
    }

    /* solhint-disable code-complexity*/
    // Function to decode CBOR-encoded data
    function _decodeCBOR(
        bytes memory cborData,
        uint256 pointer
    ) private pure returns (uint8, uint256, uint256, bytes memory) {
        uint8 firstByte = uint8(cborData[pointer]);
        bytes memory firstByteBytes = abi.encodePacked(cborData[pointer]);
        pointer++;

        // Decode based on major type
        uint8 majorType = firstByte >> 5;
        uint8 additionalInfo = firstByte & 0x1f;

        uint256 length;
        uint256 lengthBytes;

        if (
            majorType != uint8(MajorType.Tag) &&
            majorType != uint8(MajorType.SingleValue) &&
            additionalInfo >= 24
        ) {
            (length, lengthBytes) = _getLenghtBytes(cborData, pointer, additionalInfo);
        } else {
            length = additionalInfo;
        }

        // Major type 0 - Unsigned Integer
        if (majorType == uint8(MajorType.UnsignedInteger)) {
            pointer = pointer + lengthBytes;
            return (majorType, length, pointer, firstByteBytes);
        }

        // Major type 1 - NegativeInteger
        if (majorType == uint8(MajorType.NegativeInteger)) {
            pointer = pointer + lengthBytes;
            return (majorType, length + 1, pointer, firstByteBytes); // when encoded -> value = -1 - argument
        }

        // Major type 2 - Byte String
        if (majorType == uint8(MajorType.ByteString)) {
            bytes memory byteString = _decodeByteString(cborData, pointer + lengthBytes, length);
            pointer = pointer + length + lengthBytes;
            return (majorType, uint256(byteString.length), pointer, byteString);
        }

        // Major type 3 - Text String
        if (majorType == uint8(MajorType.TextString)) {
            string memory str = _decodeString(cborData, pointer + lengthBytes, length);
            pointer = pointer + length + lengthBytes;
            return (majorType, 0, pointer, bytes(str));
        }

        // Major type 4 - Array
        if (majorType == uint8(MajorType.Array)) {
            return (majorType, length, pointer, firstByteBytes);
        }

        // Major type 5 - Map
        if (majorType == uint8(MajorType.Map)) {
            return (majorType, length, pointer, abi.encodePacked(""));
        }

        // Major type 6 - Tag
        if (majorType == uint8(MajorType.Tag)) {
            uint256 value = additionalInfo;
            return (majorType, value, pointer, firstByteBytes);
        }

        // Major type 7 - Simple Values (null, true, false)
        if (majorType == uint8(MajorType.SingleValue)) {
            uint256 value = _decodeSimpleValue(firstByte);
            return (majorType, value, pointer, firstByteBytes);
        }

        revert UnsupportedCBORType(majorType);
    }

    /* solhint-enable code-complexity*/

    function _getLenghtBytes(
        bytes memory cborData,
        uint256 pointer,
        uint8 additionalInfo
    ) private pure returns (uint256, uint256) {
        uint256 length = additionalInfo;
        uint256 lengthBytes = 1;

        if (length == 24) {
            length = uint256(uint8(cborData[pointer]));
            lengthBytes = 1;
            pointer++;
        } else if (length == 25) {
            length =
                (uint256(uint8(cborData[pointer])) << 8) |
                uint256(uint8(cborData[pointer + 1]));
            lengthBytes = 2;
            pointer += 2;
        } else if (length == 26) {
            length =
                (uint256(uint8(cborData[pointer])) << 24) |
                (uint256(uint8(cborData[pointer + 1])) << 16) |
                (uint256(uint8(cborData[pointer + 2])) << 8) |
                uint256(uint8(cborData[pointer + 3]));
            lengthBytes = 4;
            pointer += 4;
        } else if (length == 27) {
            length =
                (uint256(uint8(cborData[pointer])) << 56) |
                (uint256(uint8(cborData[pointer + 1])) << 48) |
                (uint256(uint8(cborData[pointer + 2])) << 40) |
                (uint256(uint8(cborData[pointer + 3])) << 32) |
                (uint256(uint8(cborData[pointer + 4])) << 24) |
                (uint256(uint8(cborData[pointer + 5])) << 16) |
                (uint256(uint8(cborData[pointer + 6])) << 8) |
                uint256(uint8(cborData[pointer + 7]));
            lengthBytes = 8;
            pointer += 8;
        } else {
            revert UnsupportedIntegerSize(length);
        }

        return (length, lengthBytes);
    }

    // Decode CBOR Byte String (major type 2)
    function _decodeByteString(
        bytes memory cborData,
        uint256 pointer,
        uint256 length
    ) private pure returns (bytes memory) {
        bytes memory byteStr = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            byteStr[i] = cborData[pointer + i];
        }

        return byteStr;
    }

    // Decode CBOR Text String (major type 3)
    function _decodeString(
        bytes memory cborData,
        uint256 pointer,
        uint256 length
    ) private pure returns (string memory) {
        bytes memory strBytes = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            strBytes[i] = cborData[pointer + i];
        }

        return string(strBytes);
    }

    // Decode CBOR Map (major type 5)
    function _decodeMap(
        bytes memory cborData,
        uint256 pointer,
        uint256 length
    ) private pure returns (bytes memory) {
        bytes memory map = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            map[i] = cborData[pointer + i];
        }

        return map;
    }

    // Decode CBOR Simple Value (null, true, false)
    function _decodeSimpleValue(uint8 value) private pure returns (uint256) {
        if (value == 0xf6) {
            // Null
            return 0;
        }
        if (value == 0xf5) {
            // True
            return 1;
        }
        if (value == 0xf4) {
            // False
            return 0;
        }
        revert UnsupportedSimpleValue(value);
    }
}
