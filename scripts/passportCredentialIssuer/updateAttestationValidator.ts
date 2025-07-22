import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { contractsInfo } from "../../helpers/constants";

async function main() {
  const networkName = hre.network.config.chainId;

  const deployedAddressesPath = path.join(
    __dirname,
    `../../ignition/deployments/chain-${networkName}/deployed_addresses.json`,
  );
  const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));

  const passportCredentialIssuerAddress =
    deployedAddresses[
      "PassportCredentialIssuerProxyFirstImplementationModule#TransparentUpgradeableProxy"
    ];

  const passportCredentialIssuer = await ethers.getContractAt(
    "PassportCredentialIssuer",
    passportCredentialIssuerAddress,
  );

  const versionAttestationValidator = "V".concat(
    contractsInfo.NITRO_ATTESTATION_VALIDATOR.version.replaceAll(".", "_").replaceAll("-", "_"),
  );

  const attestationValidatorAddress =
    deployedAddresses[
      `NitroAttestationValidatorModule${versionAttestationValidator}#NitroAttestationValidator`
    ];

  console.log("PassportCredentialIssuer address:", passportCredentialIssuerAddress);
  console.log("Version:", await passportCredentialIssuer.VERSION());

  const tx = await passportCredentialIssuer.setAttestationValidator(attestationValidatorAddress);
  await tx.wait();
  console.log(
    `Attestation validator set to ${attestationValidatorAddress} in PassportCredentialIssuer`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
