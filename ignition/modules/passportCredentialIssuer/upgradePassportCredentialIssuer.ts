import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import hre from "hardhat";
import fs from "fs";
import path from "path";
import { PassportCredentialIssuerProxyModule } from "./deployPassportCredentialIssuer";

export const UpgradePassportCredentialIssuer = buildModule(
  "UpgradePassportCredentialIssuerV1_0_0",
  (m) => {
    // Update the version as needed
    const networkName = hre.network.config.chainId;
    const deployedAddressesPath = path.join(
      __dirname,
      `../../deployments/chain-${networkName}/deployed_addresses.json`,
    );
    const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));

    const identityLibAddress = deployedAddresses["PassportCredentialIssuerModule#IdentityLib"];
    const identityLib = m.contractAt("IdentityLib", identityLibAddress);

    const proxyAdminOwner = m.getAccount(0);

    const { proxy, proxyAdmin } = m.useModule(PassportCredentialIssuerProxyModule);

    const newPassportCredentialIssuerImpl = m.contract("PassportCredentialIssuer", [], {
      libraries: {
        IdentityLib: identityLib,
      },
    });

    const signerAddress = "0xDC3461f9f021dD904C71492EaBd86EaaF6dADbCb"; //m.getAccount(0);

    const stateContractAddress = "0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124"; //"0x3C9acB2205Aa72A05F6D77d708b5Cf85FCa3a896"; //"0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124"; // "<StateContractAddress>"; // Replace with actual state contract address
    const idType = "0x0113"; //"0x01B2"; // "0x0113";
    const expirationTime = BigInt(60 * 60 * 24 * 7); // 1 week
    const templateRoot = BigInt(
      "3532467563022391950170321692541635800576371972220969617740093781820662149190",
    );

    const initializeData = m.encodeFunctionCall(
      newPassportCredentialIssuerImpl,
      "initialize(uint256,uint256,string[],address[],address[],address,bytes2,address)",
      [
        expirationTime,
        templateRoot,
        [],
        [],
        [signerAddress],
        stateContractAddress,
        idType,
        proxyAdminOwner,
      ],
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
