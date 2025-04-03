import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const passportCredentialIssuerAddress = "0xadd74D74A1C527E3d6B03ADdd25783CC40e90FAb";
  const passportCredentialIssuer = await ethers.getContractAt(
    "PassportCredentialIssuerImplV1",
    passportCredentialIssuerAddress,
  );
  const deployment = "";

  if (!deployment) {
    console.error("Please specify the deployment name.");
    return;
  }

  const deployedAddressesPath = path.join(
    __dirname,
    `../ignition/deployments/${deployment}/deployed_addresses.json`,
  );
  const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));

  const credentialCircuitIds: string[] = [];
  const credentialVerifierAddresses: string[] = [];

  const signatureCircuitIds: string[] = [];
  const signatureVerifierAddresses: string[] = [];

  for (const [key, value] of Object.entries(deployedAddresses)) {
    if (key.includes("DeployAllVerifiers#Verifier_credential")) {
      credentialCircuitIds.push(key.replace("DeployAllVerifiers#Verifier_", ""));
      credentialVerifierAddresses.push(value as string);
    }
    if (key.includes("DeployAllVerifiers#Verifier_signature")) {
      signatureCircuitIds.push(key.replace("DeployAllVerifiers#Verifier_", ""));
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
