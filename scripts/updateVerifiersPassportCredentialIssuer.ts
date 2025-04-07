import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const networkName = hre.network.config.chainId;

  const deployedAddressesPath = path.join(
    __dirname,
    `../ignition/deployments/chain-${networkName}/deployed_addresses.json`,
  );
  const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));

  const passportCredentialIssuerAddress = deployedAddresses["DeployPassportCredentialIssuer#PassportCredentialIssuer"];

  const passportCredentialIssuer = await ethers.getContractAt(
    "PassportCredentialIssuerImplV1",
    passportCredentialIssuerAddress,
  );

  const credentialCircuitIds: string[] = [];
  const credentialVerifierAddresses: string[] = [];

  const signatureCircuitIds: string[] = [];
  const signatureVerifierAddresses: string[] = [];

  const deploymentKey = "";

  if (!deploymentKey) {
    console.error("Please specify the deployment key.");
    return;
  }

  for (const [key, value] of Object.entries(deployedAddresses)) {
    if (key.includes(`${deploymentKey}#Verifier_credential`)) {
      credentialCircuitIds.push(key.replace(`${deploymentKey}#Verifier_`, ""));
      credentialVerifierAddresses.push(value as string);
    }
    if (key.includes(`${deploymentKey}#Verifier_signature`)) {
      signatureCircuitIds.push(key.replace(`${deploymentKey}#Verifier_`, ""));
      signatureVerifierAddresses.push(value as string);
    }
  }

  if (credentialCircuitIds.length > 0) {
    await passportCredentialIssuer.updateCredentialVerifiers(
      credentialCircuitIds,
      credentialVerifierAddresses,
    );
  }
  if (signatureCircuitIds.length > 0) {
    await passportCredentialIssuer.updateSignatureVerifiers(
      signatureCircuitIds,
      signatureVerifierAddresses,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
