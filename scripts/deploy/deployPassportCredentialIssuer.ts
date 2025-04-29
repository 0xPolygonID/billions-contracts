import { ethers, ignition } from "hardhat";
import PassportCredentialIssuerModule from "../../ignition/modules/passportCredentialIssuer/deployPassportCredentialIssuer";
import { contractsInfo } from "../../helpers/constants";

async function main() {
  const passportCredentialIssuerProxy = (
    await ignition.deploy(PassportCredentialIssuerModule, {
      parameters: {
        PassportCredentialIssuerModule: {
          signerAddress: "0xDC3461f9f021dD904C71492EaBd86EaaF6dADbCb",
          stateContractAddress: "0xaea923d71Bc5ED3A622D4DfCF2f9C338889b1c70",
          idType: "0x0112",
          expirationTime: 604800,
          templateRoot:
            "3532467563022391950170321692541635800576371972220969617740093781820662149190",
        },
      },
      strategy: "create2",
    })
  ).proxy;
  await passportCredentialIssuerProxy.waitForDeployment();

  const passportCredentialIssuerAddress = await passportCredentialIssuerProxy.getAddress();

  console.log("PassportCredentialIssuer address:", passportCredentialIssuerAddress);

  const passportCredentialIssuer = await ethers.getContractAt(
    contractsInfo.PASSPORT_CREDENTIAL_ISSUER.name,
    passportCredentialIssuerAddress,
  );
  console.log("Version:", await passportCredentialIssuer.VERSION());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
