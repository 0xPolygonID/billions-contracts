// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import {IAttestationValidator} from "../interfaces/IAttestationValidator.sol";

contract NitroAttestationValidatorWrapper {
    IAttestationValidator private _attestationValidator;

    function setAttestationValidator(IAttestationValidator validator) external {
        _attestationValidator = validator;
    }

    function validateAttestation(
        bytes calldata attestation,
        bool checkCertificatesValidation
    ) external {
        _attestationValidator.validateAttestation(attestation, checkCertificatesValidation);
    }

    function validateAttestationV2(
        bytes calldata protectedHeader,
        bytes calldata rawPayload,
        bytes calldata signature,
        bool checkCertificatesValidation
    ) external {
        _attestationValidator.validateAttestationV2(
            protectedHeader,
            rawPayload,
            signature,
            checkCertificatesValidation
        );
    }

    function parseAttestation(bytes calldata attestation) external view {
        _attestationValidator.parseAttestation(attestation);
    }
}
