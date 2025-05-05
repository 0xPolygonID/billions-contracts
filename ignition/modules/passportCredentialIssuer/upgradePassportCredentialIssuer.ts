import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import PassportCredentialIssuerModule, { PassportCredentialIssuerProxyFirstImplementationModule } from "./deployPassportCredentialIssuer";
import IdentityLibModule from "../identityLib/identityLib";

export const UpgradePassportCredentialIssuerModule = buildModule(
  "UpgradePassportCredentialIssuerModule",
  (m) => {
    const stateContractAddress = m.getParameter("stateContractAddress");
    const idType = m.getParameter("idType");
    const expirationTime = m.getParameter("expirationTime");
    const templateRoot = m.getParameter("templateRoot");
    const identityLibAddress = m.getParameter("identityLibAddress");
    
    // const { identityLib } = m.useModule(IdentityLibModule);
    const identityLib = m.contractAt("IdentityLib", identityLibAddress);

    const proxyAdminOwner = m.getAccount(0);

    const { proxy, proxyAdmin } = m.useModule(PassportCredentialIssuerProxyFirstImplementationModule);

    const newPassportCredentialIssuerImpl = m.contract("PassportCredentialIssuer", [], {
      libraries: {
        IdentityLib: identityLib,
      },
    });

    const initializeData = m.encodeFunctionCall(
      newPassportCredentialIssuerImpl,
      "initialize(uint256,uint256,string[],address[],address[],address,bytes2,address)",
      [expirationTime, templateRoot, [], [], [], stateContractAddress, idType, proxyAdminOwner],
    ); 

    m.call(proxyAdmin, "upgradeAndCall", [proxy, newPassportCredentialIssuerImpl, initializeData], {
      from: proxyAdminOwner,
    });

    return {
      proxyAdmin,
      proxy,
    };
  },
);

const UpgradedPassportCredentialIssuerModule = buildModule("UpgradedPassportCredentialIssuerModule", (m) => {
  const { proxy } = m.useModule(UpgradePassportCredentialIssuerModule);

  const passportCredentialIssuer = m.contractAt("PassportCredentialIssuer", proxy);

  return { passportCredentialIssuer };
});

export default UpgradedPassportCredentialIssuerModule;
