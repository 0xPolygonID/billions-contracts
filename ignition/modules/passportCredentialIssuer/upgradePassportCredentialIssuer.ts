import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { PassportCredentialIssuerProxyFirstImplementationModule } from "./deployPassportCredentialIssuer";
import IdentityLibModule from "../identityLib/identityLib";

const UpgradePassportCredentialIssuerModule = buildModule(
  "UpgradePassportCredentialIssuerModuleV1_0_2",
  (m) => {
    const proxyAdminOwner = m.getAccount(0);
    const { proxy, proxyAdmin } = m.useModule(PassportCredentialIssuerProxyFirstImplementationModule);
    
    const { identityLib } = m.useModule(IdentityLibModule);

    const newPassportCredentialIssuerImpl = m.contract("PassportCredentialIssuer", [], {
      libraries: {
        IdentityLib: identityLib,
      },
    });

    // As we are working with same proxy the storage is already initialized
    const initializeData = "0x";

    m.call(proxyAdmin, "upgradeAndCall", [proxy, newPassportCredentialIssuerImpl, initializeData], {
      from: proxyAdminOwner,
    });

    return {
      newPassportCredentialIssuerImpl,
      proxyAdmin,
      proxy,
    };
  },
);

const UpgradedPassportCredentialIssuerModule = buildModule("UpgradedPassportCredentialIssuerModule", (m) => {
  const { newPassportCredentialIssuerImpl, proxy, proxyAdmin } = m.useModule(UpgradePassportCredentialIssuerModule);

  const passportCredentialIssuer = m.contractAt("PassportCredentialIssuer", proxy);

  return { passportCredentialIssuer, newPassportCredentialIssuerImpl, proxy, proxyAdmin };
});

export default UpgradedPassportCredentialIssuerModule;
