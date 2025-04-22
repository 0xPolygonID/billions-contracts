// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import  {AnonAadhaarCredentialIssuerImplV1 } from "../verifiers/AnonAadhaarCredentialIssuerImplV1.sol";

abstract contract UpgradedAnonAadhaarCredentialIssuerImplV1 {
    bool internal _isTest;
}

/**
 * @title PassportCredentialIssuerImplV1
 * @notice Implementation contract for the Passport Credential Issuer.
 * @dev Provides functions for registering commitments and verifying groth16 proofs and inclusion proofs.
 */
contract testUpgradedAnonAadhaarCredentialIssuerImplV1 is
    AnonAadhaarCredentialIssuerImplV1,
    UpgradedAnonAadhaarCredentialIssuerImplV1
{

    // ====================================================
    // Events
    // ====================================================

    /**
     * @notice Emitted when the passport credential issuer is initialized.
     */
    event TestAnonAadhaarCredentialIssuerInitialized();

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
        emit TestAnonAadhaarCredentialIssuerInitialized();
    }

    // ====================================================
    // External View Functions
    // ====================================================

    function isTest() external view virtual onlyProxy returns (bool) {
        return _isTest;
    }

    /**
     * @notice Returns the version of the contract.
     * @dev Overrides the base contract's version function.
     */
    function version() public view override returns (string memory) {
        return "1.0.1";
    }
}
