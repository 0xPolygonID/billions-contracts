import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { deployCertificatesLib, deployCertificatesValidator, deployNitroAttestationValidator } from "../test/utils/deployment";

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

  const certificatesLib = await deployCertificatesLib();
  const certificatesValidator = await deployCertificatesValidator(certificatesLib);
  const nitroAttestationValidator = await deployNitroAttestationValidator(await certificatesLib.getAddress());
  
  await nitroAttestationValidator.setCertificatesValidator(
    await certificatesValidator.getAddress(),
  );

  await passportCredentialIssuer.setAttestationValidator(nitroAttestationValidator);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
