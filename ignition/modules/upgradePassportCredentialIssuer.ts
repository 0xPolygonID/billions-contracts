import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import hre from "hardhat";
import fs from "fs";
import path from "path";

export default buildModule("UpgradePassportCredentialIssuer", (m) => {
  const networkName = hre.network.config.chainId;

  const deployedAddressesPath = path.join(
    __dirname,
    `../deployments/chain-${networkName}/deployed_addresses.json`,
  );
  const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));

  // Update the key as needed with latest proxy futureId reference in deployed_addresses.json for PassportCredentialIssuerImplV1
  const passportCredentialIssuerProxyAddress =
    deployedAddresses["UpgradePassportCredentialIssuer#PassportCredentialIssuerImplV1"];
  if (!passportCredentialIssuerProxyAddress) {
    throw new Error("PassportCredentialIssuer proxy address not found in deployed_addresses.json");
  }

  const identityLibAddress = deployedAddresses["UpgradePassportCredentialIssuer#IdentityLib"];
  const identityLib = m.contractAt("IdentityLib", identityLibAddress);

  const newPassportCredentialIssuerImpl = m.contract("PassportCredentialIssuerImplV1", [], {
    libraries: {
      IdentityLib: identityLib,
    },
    id: "PassportCredentialIssuerImplV1_v1_0_3", // Update the version as needed
  });

  const passportCredentialIssuerProxy = m.contractAt(
    "PassportCredentialIssuerImplV1",
    passportCredentialIssuerProxyAddress,
    { id: "PassportCredentialIssuer_v1_0_3" }
  );

  m.call(passportCredentialIssuerProxy, "upgradeToAndCall", [
    newPassportCredentialIssuerImpl,
    "0x",
  ]);

  return {
    newPassportCredentialIssuerImpl,
    passportCredentialIssuerProxy,
  };
});
