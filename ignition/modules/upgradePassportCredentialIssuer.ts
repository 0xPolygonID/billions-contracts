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

  const passportCredentialIssuerProxyAddress =
    deployedAddresses["DeployPassportCredentialIssuer#PassportCredentialIssuer"];
  if (!passportCredentialIssuerProxyAddress) {
    throw new Error("PassportCredentialIssuer proxy address not found in deployed_addresses.json");
  }

  const identityLibAddress = deployedAddresses["DeployPassportCredentialIssuer#IdentityLib"];
  const identityLib = m.contractAt("IdentityLib", identityLibAddress);

  const newPassportCredentialIssuerImpl = m.contract("PassportCredentialIssuerImplV1", [], {
    libraries: {
      IdentityLib: identityLib,
    },
    id: "PassportCredentialIssuerImplV1_v1_0_1",
  });

  const passportCredentialIssuerProxy = m.contractAt(
    "PassportCredentialIssuerImplV1",
    passportCredentialIssuerProxyAddress,
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
