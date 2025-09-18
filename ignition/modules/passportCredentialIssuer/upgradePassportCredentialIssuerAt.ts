import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import IdentityLibModule from "../identityLib/identityLib";
import { contractsInfo } from "../../../helpers/constants";

const version = "V".concat(contractsInfo.PASSPORT_CREDENTIAL_ISSUER.version.replaceAll(".", "_").replaceAll("-", "_"));

const UpgradePassportCredentialIssuerAtModule = buildModule(
  "UpgradePassportCredentialIssuerAtModule".concat(version),
  (m) => {
    const proxyAdminOwner = m.getAccount(0);
    const proxyAddress = m.getParameter("proxyAddress");
    const proxyAdminAddress = m.getParameter("proxyAdminAddress");
    const proxy = m.contractAt(contractsInfo.PASSPORT_CREDENTIAL_ISSUER.name, proxyAddress, {
      id: "Proxy",
    });
    const proxyAdmin = m.contractAt("ProxyAdmin", proxyAdminAddress);

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

const UpgradedPassportCredentialIssuerAtModule = buildModule("UpgradedPassportCredentialIssuerAtModule", (m) => {
  const { newPassportCredentialIssuerImpl, proxy, proxyAdmin } = m.useModule(UpgradePassportCredentialIssuerAtModule);

  const passportCredentialIssuer = m.contractAt("PassportCredentialIssuer", proxy);

  return { passportCredentialIssuer, newPassportCredentialIssuerImpl, proxy, proxyAdmin };
});

export default UpgradedPassportCredentialIssuerAtModule;
