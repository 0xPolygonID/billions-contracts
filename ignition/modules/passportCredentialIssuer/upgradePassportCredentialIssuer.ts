import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { PassportCredentialIssuerProxyFirstImplementationModule } from "./deployPassportCredentialIssuer";
import IdentityLibModule from "../identityLib/identityLib";
import { contractsInfo } from "../../../helpers/constants";

const version = "V".concat(contractsInfo.PASSPORT_CREDENTIAL_ISSUER.version.replaceAll(".", "_").replaceAll("-", "_"));

const UpgradePassportCredentialIssuerModule = buildModule(
  "UpgradePassportCredentialIssuerModule".concat(version),
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

const UpgradedPassportCredentialIssuerModule = buildModule("UpgradedPassportCredentialIssuerModule".concat(version), (m) => {
  const { newPassportCredentialIssuerImpl, proxy, proxyAdmin } = m.useModule(UpgradePassportCredentialIssuerModule);

  const passportCredentialIssuer = m.contractAt("PassportCredentialIssuer", proxy);

  return { passportCredentialIssuer, newPassportCredentialIssuerImpl, proxy, proxyAdmin };
});

export default UpgradedPassportCredentialIssuerModule;
