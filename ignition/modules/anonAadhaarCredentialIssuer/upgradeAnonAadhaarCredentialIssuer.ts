import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import hre from "hardhat";
import fs from "fs";
import path from "path";
import { AnonAadHaarCredentialIssuerProxyFirstImplementationModule } from "./deployAnonAadhaarCredentialIssuer";
import DeployAnonAadhaarVerifierModule from "./deployAnonAadhaarVerifier";
import IdentityLibModule from "../identityLib/identityLib";



const UpgradeAnonAadHaarCredentialIssuerModule = buildModule(
  "UpgradeAnonAadHaarCredentialIssuerModuleV1_0_1",
  (m) => {
    const proxyAdminOwner = m.getAccount(0);
    const { proxy, proxyAdmin } = m.useModule(AnonAadHaarCredentialIssuerProxyFirstImplementationModule);
    
    const { identityLib } = m.useModule(IdentityLibModule);

    const newAnonAadHaarCredentialIssuerImpl = m.contract("AnonAadHaarCredentialIssuer", [], {
      libraries: {
        IdentityLib: identityLib,
      },
    });

    // As we are working with same proxy the storage is already initialized
    const initializeData = "0x";

    m.call(proxyAdmin, "upgradeAndCall", [proxy, newAnonAadHaarCredentialIssuerImpl, initializeData], {
      from: proxyAdminOwner,
    });

    return {
      proxyAdmin,
      proxy,
    };
  },
);

const UpgradedAnonAadHaarCredentialIssuerModule = buildModule("UpgradedAnonAadHaarCredentialIssuerModule", (m) => {
  const { proxy, proxyAdmin } = m.useModule(UpgradeAnonAadHaarCredentialIssuerModule);

  const anonAadHaarCredentialIssuer = m.contractAt("AnonAadHaarCredentialIssuer", proxy);

  return { anonAadHaarCredentialIssuer, proxy, proxyAdmin };
});

export default UpgradedAnonAadHaarCredentialIssuerModule;