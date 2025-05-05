import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import hre from "hardhat";
import fs from "fs";
import path from "path";
import { AnonAadHaarCredentialIssuerProxyModule } from "./deployAnonAadhaarCredentialIssuer";
import DeployAnonAadhaarVerifierModule from "./deployAnonAadhaarVerifier";

const productionPublicKeyHash =
  18063425702624337643644061197836918910810808173893535653269228433734128853484n;
const developmentPublicKeyHash =
  15134874015316324267425466444584014077184337590635665158241104437045239495873n;

export const UpgradeAnonAaadHaarCredentialIssuer = buildModule(
  "UpgradeAnonAaadHaarCredentialIssuerV1_0_0",
  (m) => {
    // Update the version as needed
    const networkName = hre.network.config.chainId;
    const deployedAddressesPath = path.join(
      __dirname,
      `../../deployments/chain-${networkName}/deployed_addresses.json`,
    );
    const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));

    const identityLibAddress = deployedAddresses["AnonAadHaarCredentialIssuerModule#IdentityLib"];
    const identityLib = m.contractAt("IdentityLib", identityLibAddress);

    const proxyAdminOwner = m.getAccount(0);

    const { proxy, proxyAdmin } = m.useModule(AnonAadHaarCredentialIssuerProxyModule);

    const newAnonAadHaarCredentialIssuerImpl = m.contract("AnonAadHaarCredentialIssuer", [], {
      libraries: {
        IdentityLib: identityLib,
      },
    });

    const nullifierSeed = 12345678n;
    const publicKeyHashes = [productionPublicKeyHash];
    const expirationTime = 15776640n;
    const templateRoot =
      13618331910493816144112635202719102044017718006809336112633915446302833345855n;
  
    // TODO (illia-korotia): move to dynamic config [chainId] => [stateContractAddress, idType]
    const stateContractAddress = "0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124";
    const idType = "0x0113";

    const { deployedContract: anonAadhaarVerifier } = m.useModule(DeployAnonAadhaarVerifierModule);

    const initializeData = m.encodeFunctionCall(
      newAnonAadHaarCredentialIssuerImpl,
      "initialize(uint256,uint256[],uint256,uint256,address,address,bytes2,address)",
      [
        nullifierSeed,
        publicKeyHashes,
        expirationTime,
        templateRoot,
        anonAadhaarVerifier,
        stateContractAddress,
        idType,
        proxyAdminOwner,
      ],
    );

    m.call(proxyAdmin, "upgradeAndCall", [proxy, newAnonAadHaarCredentialIssuerImpl, initializeData], {
      from: proxyAdminOwner,
    });

    return {
      proxyAdmin,
      proxy,
    };
  },
);

export default UpgradeAnonAaadHaarCredentialIssuer;
