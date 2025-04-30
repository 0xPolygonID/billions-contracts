import hre from "hardhat";
import fs from "fs";
import path from "path";
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { PassportCredentialIssuerProxyModule } from "./deployPassportCredentialIssuer";

export const UpgradePassportCredentialIssuer = buildModule(
  "UpgradePassportCredentialIssuerV1_0_1",
  (m) => {
    // Update the version as needed
    const networkName = hre.network.config.chainId;

    const deployedAddressesPath = path.join(
      __dirname,
      `../deployments/chain-${networkName}/deployed_addresses.json`,
    );
    const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));
    const identityLibAddress = deployedAddresses["PassportCredentialIssuerModule#IdentityLib"];
    
    const stateContractAddress = m.getParameter("stateContractAddress");
    const idType = m.getParameter("idType");
    const expirationTime = m.getParameter("expirationTime");
    const templateRoot = m.getParameter("templateRoot");

    const identityLib = m.contractAt("IdentityLib", identityLibAddress);

    const proxyAdminOwner = m.getAccount(0);

    const { proxy, proxyAdmin } = m.useModule(PassportCredentialIssuerProxyModule);

    const newPassportCredentialIssuerImpl = m.contract("PassportCredentialIssuer", [], {
      libraries: {
        IdentityLib: identityLib,
      },
    });

    const initializeData = m.encodeFunctionCall(
      newPassportCredentialIssuerImpl,
      "initialize(uint256,uint256,string[],address[],address[],address,bytes2,address)",
      [expirationTime, templateRoot, [], [], [], stateContractAddress, idType, proxyAdminOwner],
    );

    m.call(proxyAdmin, "upgradeAndCall", [proxy, newPassportCredentialIssuerImpl, initializeData], {
      from: proxyAdminOwner,
    });

    return {
      proxyAdmin,
      proxy,
    };
  },
);

export default UpgradePassportCredentialIssuer;
