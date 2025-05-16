import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { AnonAadhaarCredentialIssuerProxyFirstImplementationModule } from "./deployAnonAadhaarCredentialIssuer";
import IdentityLibModule from "../identityLib/identityLib";

const UpgradeAnonAadhaarCredentialIssuerModule = buildModule(
  "UpgradeAnonAadhaarCredentialIssuerModuleV1_0_1",
  (m) => {
    const proxyAdminOwner = m.getAccount(0);
    const { proxy, proxyAdmin } = m.useModule(
      AnonAadhaarCredentialIssuerProxyFirstImplementationModule,
    );

    const { identityLib } = m.useModule(IdentityLibModule);

    const newAnonAadhaarCredentialIssuerImpl = m.contract("AnonAadhaarCredentialIssuer", [], {
      libraries: {
        IdentityLib: identityLib,
      },
    });

    // As we are working with same proxy the storage is already initialized
    const initializeData = "0x";

    m.call(
      proxyAdmin,
      "upgradeAndCall",
      [proxy, newAnonAadhaarCredentialIssuerImpl, initializeData],
      {
        from: proxyAdminOwner,
      },
    );

    return {
      newAnonAadhaarCredentialIssuerImpl,
      proxyAdmin,
      proxy,
    };
  },
);

const UpgradedAnonAadhaarCredentialIssuerModule = buildModule(
  "UpgradedAnonAadhaarCredentialIssuerModule",
  (m) => {
    const { newAnonAadhaarCredentialIssuerImpl, proxy, proxyAdmin } = m.useModule(UpgradeAnonAadhaarCredentialIssuerModule);

    const anonAadhaarCredentialIssuer = m.contractAt("AnonAadhaarCredentialIssuer", proxy);

    return { anonAadhaarCredentialIssuer, newAnonAadhaarCredentialIssuerImpl, proxy, proxyAdmin };
  },
);

export default UpgradedAnonAadhaarCredentialIssuerModule;
