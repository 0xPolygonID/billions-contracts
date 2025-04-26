import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import hre, { artifacts, ethers } from "hardhat";
import fs from "fs";
import path from "path";

function getPassportCredentialIssuerInitializeData() {
  const passportCredentialIssuerArtifact = artifacts.readArtifactSync("PassportCredentialIssuer");
  return new ethers.Interface(passportCredentialIssuerArtifact.abi);
}

export default buildModule("UpgradePassportCredentialIssuer", (m) => {
  const networkName = hre.network.config.chainId;
  const deployedAddressesPath = path.join(
    __dirname,
    `../../deployments/chain-${networkName}/deployed_addresses.json`,
  );
  const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));

  // Update the key as needed with latest proxy futureId reference in deployed_addresses.json for PassportCredentialIssuer
  const passportCredentialIssuerProxyAdminAddress =
    deployedAddresses["PassportCredentialIssuerProxyModule#ProxyAdmin"];
  if (!passportCredentialIssuerProxyAdminAddress) {
    throw new Error(
      "PassportCredentialIssuer proxy admin address not found in deployed_addresses.json",
    );
  }

  const passportCredentialIssuerProxyAddress =
    deployedAddresses["PassportCredentialIssuerProxyModule#TransparentUpgradeableProxy"];
  if (!passportCredentialIssuerProxyAddress) {
    throw new Error("PassportCredentialIssuer proxy address not found in deployed_addresses.json");
  }

  const identityLibAddress = deployedAddresses["PassportCredentialIssuerModule#IdentityLib"];
  const identityLib = m.contractAt("IdentityLib", identityLibAddress);

  const newPassportCredentialIssuerImpl = m.contract("PassportCredentialIssuer", [], {
    libraries: {
      IdentityLib: identityLib,
    },
    id: "PassportCredentialIssuer_v1_0_0", // Update the version as needed
  });

  const passportCredentialIssuerProxyAdmin = m.contractAt(
    "ProxyAdmin",
    passportCredentialIssuerProxyAdminAddress,
    { id: "PassportCredentialIssuerProxyAdmin_v1_0_0" },
  );

  const passportCredentialIssuerInterface = getPassportCredentialIssuerInitializeData();

  const signerAddress = "0xDC3461f9f021dD904C71492EaBd86EaaF6dADbCb"; //m.getAccount(0);

  const stateContractAddress = "0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124"; //"0x3C9acB2205Aa72A05F6D77d708b5Cf85FCa3a896"; //"0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124"; // "<StateContractAddress>"; // Replace with actual state contract address
  const idType = "0x0113"; //"0x01B2"; // "0x0113";
  const expirationTime = BigInt(60 * 60 * 24 * 7); // 1 week
  const templateRoot = BigInt(
    "3532467563022391950170321692541635800576371972220969617740093781820662149190",
  );

  //const implementationOwner = m.staticCall(passportCredentialIssuerProxyAdmin, "owner", []);
  //const implementationOwner = m.getAccount(0);
  const implementationOwner = "0xcabaE40A68BCB419c8d9A3ab5EAEf63810c2d4f4";
  const initializeData = passportCredentialIssuerInterface.encodeFunctionData("initializeIssuer", [
    expirationTime,
    templateRoot,
    [],
    [],
    [signerAddress],
    stateContractAddress,
    idType,
    implementationOwner,
  ]);

  m.call(passportCredentialIssuerProxyAdmin, "upgradeAndCall", [
    passportCredentialIssuerProxyAddress,
    newPassportCredentialIssuerImpl,
    initializeData,
  ]);

  return {
    newPassportCredentialIssuerImpl,
    passportCredentialIssuerProxyAdmin,
  };
});
