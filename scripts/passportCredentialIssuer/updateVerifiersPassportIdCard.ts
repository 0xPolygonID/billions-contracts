import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";

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

  console.log("PassportCredentialIssuer address:", passportCredentialIssuerAddress);
  console.log("Version:", await passportCredentialIssuer.VERSION());
  const idcardCircuitIds: string[] = [];
  const idcardVerifierAddresses: string[] = [];

  const deploymentKey = "DeployIdCardVerifiers";

  if (!deploymentKey) {
    console.error("Please specify the deployment key.");
    return;
  }

  for (const [key, value] of Object.entries(deployedAddresses)) {
    if (key.includes(`${deploymentKey}#Verifier_idcard`)) {
      idcardCircuitIds.push(key.replace(`${deploymentKey}#Verifier_`, ""));
      idcardVerifierAddresses.push(value as string);
    }
  }

  if (idcardCircuitIds.length > 0) {
    console.log(
      `Updating credential verifiers for ${idcardCircuitIds.length} circuits in PassportCredentialIssuer...`,
    );
    console.log(idcardCircuitIds, idcardVerifierAddresses);
    await passportCredentialIssuer.updateCredentialVerifiers(
      idcardCircuitIds,
      idcardVerifierAddresses,
      {
        gasPrice: 50000000000,
        gasLimit: 10000000,
      },
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
