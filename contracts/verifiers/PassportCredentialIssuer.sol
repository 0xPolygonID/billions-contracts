// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {ProxyRoot} from "../upgradeable/ProxyRoot.sol";

/**
 * @title PassportCredentialIssuer
 * @notice Acts as an upgradeable proxy for the passport credential issuer.
 * @dev Inherits from ProxyRoot to delegate calls to an implementation contract.
 * The constructor initializes the proxy using the provided implementation address and initialization data.
 */
contract PassportCredentialIssuer is ProxyRoot {
    /**
     * @notice Creates a new instance of the PassportCredentialIssuer proxy.
     * @param _logic The address of the initial implementation contract that contains the passport credential issuer logic.
     * @param _data The initialization data passed to the implementation during deployment.
     */
    constructor(address _logic, bytes memory _data) ProxyRoot(_logic, _data) {}
}
