import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import hre from "hardhat";
import fs from "fs";
import path from "path";

export default buildModule("UpgradeAnonAadhaarCredentialIssuer", (m) => {
  const networkName = hre.network.config.chainId;

  const deployedAddressesPath = path.join(
    __dirname,
    `../deployments/chain-${networkName}/deployed_addresses.json`,
  );
  const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));

  // Update the key as needed with latest proxy futureId reference in deployed_addresses.json for AnonAadhaarCredentialIssuerImplV1
  const passportCredentialIssuerProxyAddress =
    deployedAddresses["UpgradeAnonAadhaarCredentialIssuer#AnonAadhaarCredentialIssuerImplV1"];
  if (!passportCredentialIssuerProxyAddress) {
    throw new Error(
      "AnonAadhaarCredentialIssuer proxy address not found in deployed_addresses.json",
    );
  }

  const identityLibAddress = deployedAddresses["UpgradeAnonAadhaarCredentialIssuer#IdentityLib"];
  const identityLib = m.contractAt("IdentityLib", identityLibAddress);

  const newAnonAadhaarCredentialIssuerImpl = m.contract("AnonAadhaarCredentialIssuerImplV1", [], {
    libraries: {
      IdentityLib: identityLib,
    },
    id: "AnonAadhaarCredentialIssuerImplV1_v1_0_1", // Update the version as needed
  });

  const passportCredentialIssuerProxy = m.contractAt(
    "AnonAadhaarCredentialIssuerImplV1",
    passportCredentialIssuerProxyAddress,
    { id: "AnonAadhaarCredentialIssuer_v1_0_1" },
  );

  m.call(passportCredentialIssuerProxy, "upgradeToAndCall", [
    newAnonAadhaarCredentialIssuerImpl,
    "0x",
  ]);

  return {
    newAnonAadhaarCredentialIssuerImpl,
    passportCredentialIssuerProxy,
  };
});
