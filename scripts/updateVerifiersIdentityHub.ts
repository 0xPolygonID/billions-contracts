import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { DscVerifierId } from "passport-utils";

async function main() {
  const identityVerificationHubAddress = "0x4D2Fd6b401ee809342CDbc8730d220ea44eC7a2C";
  const identityVerificationHub = await ethers.getContractAt(
    "IdentityVerificationHubImplV1",
    identityVerificationHubAddress,
  );
  const deployment = "chain-80002";

  if (!deployment) {
    console.error("Please specify the deployment name.");
    return;
  }

  const deployedAddressesPath = path.join(
    __dirname,
    `../ignition/deployments/${deployment}/deployed_addresses.json`,
  );
  const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));

  const dscCircuitIds: number[] = [];
  const dscVerifierAddresses: string[] = [];

  for (const [key, value] of Object.entries(deployedAddresses)) {
    if (key.includes("DeployAllVerifiers#Verifier_dsc")) {
      dscCircuitIds.push(
        DscVerifierId[
          key.replace("DeployAllVerifiers#Verifier_", "") as keyof typeof DscVerifierId
        ],
      );
      dscVerifierAddresses.push(value as string);
    }
  }

  if (dscCircuitIds.length > 0) {
    await identityVerificationHub.batchUpdateDscCircuitVerifiers(
      dscCircuitIds,
      dscVerifierAddresses,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
