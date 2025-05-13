// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

/**
 * @title Circuit Constants Library
 * @notice This library defines constants representing indices used to access public signals
 *         of various circuits.
 * @dev These indices map directly to specific data fields in the corresponding circuits proofs.
 */
library CircuitConstants {
    // ---------------------------
    // CREDENTIAL Circuit Constants
    // ---------------------------

    /**
     * @notice Index to access the hashIndex in the credential circuit public signals.
     */
    uint256 constant CREDENTIAL_HASH_INDEX_INDEX = 0;
    /**
     * @notice Index to access the hashValue in the credential circuit public signals.
     */
    uint256 constant CREDENTIAL_HASH_VALUE_INDEX = 1;
    /**
     * @notice Index to access the linkId in the credential circuit public signals.
     */
    uint256 constant CREDENTIAL_LINK_ID_INDEX = 2;
    /**
     * @notice Index to access the currentDate in the credential circuit public signals.
     */
    uint256 constant CREDENTIAL_CURRENT_DATE_INDEX = 3;
    /**
     * @notice Index to access the issuanceDate in the credential circuit public signals.
     */
    uint256 constant CREDENTIAL_ISSUANCE_DATE_INDEX = 4;
    /**
     * @notice Index to access the templateRoot in the credential circuit public signals.
     */
    uint256 constant CREDENTIAL_TEMPLATE_ROOT_INDEX = 5;
    /**
     * @notice Index to access the issuer in the credential circuit public signals.
     */
    uint256 constant CREDENTIAL_ISSUER_INDEX = 6;
    /**
     * @notice Index to access the revocationNonce in the credential circuit public signals.
     */
    uint256 constant CREDENTIAL_REVOCATION_NONCE_INDEX = 7;
}
