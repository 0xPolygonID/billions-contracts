// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.27;

import {CertificatesValidator} from "../validators/CertificatesValidator.sol";

contract CertificatesValidatorStub is CertificatesValidator {
    function validateChainOfCertificates(
        bytes[] calldata certificates
    ) external view override returns (bool) {
        // This is a stub implementation for testing purposes
        // In a real implementation, you would validate the chain of certificates
    }
}
