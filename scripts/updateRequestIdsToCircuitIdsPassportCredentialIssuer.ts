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

  const credentialRequestIds = [1];
  const credentialCircuitIds = ["credential_sha256"]
  
  const signatureRequestIds = [2];
  const signatureCircuitIds = ["signature_sha256_sha256_sha256_rsa_65537_4096"];

  await passportCredentialIssuer.updateCredentialRequestIdToCircuitId(credentialRequestIds, credentialCircuitIds);
  await passportCredentialIssuer.updateSignatureRequestIdToCircuitId(signatureRequestIds, signatureCircuitIds);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
