import { ethers, ignition } from "hardhat";
import UpgradedPassportCredentialIssuerAtModule from "../../ignition/modules/passportCredentialIssuer/upgradePassportCredentialIssuerAt";
import { contractsInfo } from "../../helpers/constants";
import { verifyContract } from "../../helpers/utils";

async function main() {
  const [signer] = await ethers.getSigners();

  // Replace with your values
  const proxyAddress = "0xF9A2332Ce5D8de57269A77B2835A17630858066c";
  const proxyAdminAddress = "0x018668d7fFf6FE895fBB420d45dFCdE52B752368";
  const deploymentId = undefined; // Set this if you want to use a specific deployment ID

  const version = "V".concat(
    contractsInfo.PASSPORT_CREDENTIAL_ISSUER.version.replaceAll(".", "_").replaceAll("-", "_"),
  );

  const parameters: any = {
    IdentityLibModule: {
      poseidon3ElementAddress: "0x5Bc89782d5eBF62663Df7Ce5fb4bc7408926A240",
      poseidon4ElementAddress: "0x0695cF2c6dfc438a4E40508741888198A6ccacC2",
      smtLibAddress: "0x682364078e26C1626abD2B95109D2019E241F0F6",
    },
  };
  parameters["UpgradePassportCredentialIssuerAtModule".concat(version)] = {
    proxyAddress: proxyAddress,
    proxyAdminAddress: proxyAdminAddress,
  };

  console.log(parameters);
  const { newPassportCredentialIssuerImpl } = await ignition.deploy(
    UpgradedPassportCredentialIssuerAtModule,
    {
      defaultSender: signer.address,
      parameters: parameters,
      deploymentId: deploymentId,
    },
  );

  await verifyContract(newPassportCredentialIssuerImpl.target, {
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
