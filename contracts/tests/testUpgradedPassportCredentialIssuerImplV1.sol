// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {PassportCredentialIssuerImplV1} from "../verifiers/PassportCredentialIssuerImplV1.sol";

abstract contract UpgradedPassportCredentialIssuerImplV1 {
    bool internal _isTest;
}

/**
 * @title PassportCredentialIssuerImplV1
 * @notice Implementation contract for the Passport Credential Issuer.
 * @dev Provides functions for registering commitments and verifying groth16 proofs and inclusion proofs.
 */
contract testUpgradedPassportCredentialIssuerImplV1 is
    PassportCredentialIssuerImplV1,
    UpgradedPassportCredentialIssuerImplV1
{
    // ====================================================
    // Events
    // ====================================================

    /**
     * @notice Emitted when the passport credential issuer is initialized.
     */
    event TestPassportCredentialIssuerInitialized();

    // ====================================================
    // Constructor
    // ====================================================

    /**
     * @notice Constructor that disables initializers.
     * @dev Prevents direct initialization of the implementation contract.
     */
    constructor() {
        _disableInitializers();
    }

    // ====================================================
    // Initializer
    // ====================================================

    /**
     * @notice Initializes the passport credential issuer implementation.
     * @dev Sets the registry, credential and signature verifiers.
     * @param isTestInput Boolean value which shows it is test or not
     */
    function initialize(bool isTestInput) external reinitializer(3) {
        __ImplRoot_init();
        _isTest = isTestInput;
        emit TestPassportCredentialIssuerInitialized();
    }

    // ====================================================
    // External View Functions
    // ====================================================

    function isTest() external view virtual onlyProxy returns (bool) {
        return _isTest;
    }
}
