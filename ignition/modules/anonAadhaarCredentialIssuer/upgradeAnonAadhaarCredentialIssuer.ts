import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { AnonAadhaarCredentialIssuerProxyFirstImplementationModule } from "./deployAnonAadhaarCredentialIssuer";
import IdentityLibModule from "../identityLib/identityLib";
import { contractsInfo } from "../../../helpers/constants";

const version = "V".concat(contractsInfo.ANONAADHAAR_CREDENTIAL_ISSUER.version.replaceAll(".", "_").replaceAll("-", "_"));

const UpgradeAnonAadhaarCredentialIssuerModule = buildModule(
  "UpgradeAnonAadhaarCredentialIssuerModule".concat(version),
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
  "UpgradedAnonAadhaarCredentialIssuerModule".concat(version),
  (m) => {
    const { newAnonAadhaarCredentialIssuerImpl, proxy, proxyAdmin } = m.useModule(UpgradeAnonAadhaarCredentialIssuerModule);

    const anonAadhaarCredentialIssuer = m.contractAt("AnonAadhaarCredentialIssuer", proxy);

    return { anonAadhaarCredentialIssuer, newAnonAadhaarCredentialIssuerImpl, proxy, proxyAdmin };
  },
);

export default UpgradedAnonAadhaarCredentialIssuerModule;
