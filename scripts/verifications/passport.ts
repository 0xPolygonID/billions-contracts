import { verifyContract } from "../../helpers/utils";
import path from "path";
import fs from "fs";
import hre from "hardhat";
import { contractsInfo } from "../../helpers/constants";

async function main() {
    const networkName = hre.network.config.chainId;
    const deployedAddressesPath = path.join(
        __dirname,
        `../../ignition/deployments/chain-${networkName}/deployed_addresses.json`,
      );
      const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));
    
      const version = "V".concat(contractsInfo.PASSPORT_CREDENTIAL_ISSUER.version.replaceAll(".", "_").replaceAll("-", "_"));
      const passportCredentialIssuerAddress =
        deployedAddresses[
            `UpgradePassportCredentialIssuerModule${version}#PassportCredentialIssuer`
        ];
  await verifyContract(passportCredentialIssuerAddress, {
    constructorArgsImplementation: [],
    libraries: {},
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
