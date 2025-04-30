import { ethers, ignition } from "hardhat";
import PassportCredentialIssuerModule from "../../ignition/modules/passportCredentialIssuer/deployPassportCredentialIssuer";
import { contractsInfo } from "../../helpers/constants";
import { deployIdentityLib } from "../../test/utils/deployment";

async function main() {
  /*const identityLib = await deployIdentityLib(
    contractsInfo.SMT_LIB.unifiedAddress,
    contractsInfo.POSEIDON_3.unifiedAddress,
    contractsInfo.POSEIDON_4.unifiedAddress,
  );*/

  const passportCredentialIssuerProxy = (
    await ignition.deploy(PassportCredentialIssuerModule, {
      parameters: {
        // Localhost
        /* PassportCredentialIssuerModule: {
          identityLibAddress: await identityLib.getAddress(),
          stateContractAddress: "0xaea923d71Bc5ED3A622D4DfCF2f9C338889b1c70",
          idType: "0x0112",
          expirationTime: 604800,
          templateRoot:
            "3532467563022391950170321692541635800576371972220969617740093781820662149190",
        }, */
        // Polygon Amoy
        PassportCredentialIssuerModule: {
          identityLibAddress: "", //await identityLib.getAddress(),
          stateContractAddress: "0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124",
          idType: "0x0113",
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
