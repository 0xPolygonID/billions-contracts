import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import {
  contractsInfo,
  TRANSPARENT_UPGRADEABLE_PROXY_ABI,
  TRANSPARENT_UPGRADEABLE_PROXY_BYTECODE,
} from "../../../helpers/constants";
import IdentityLibModule from "../identityLib/identityLib";
import { NitroAttestationValidatorModule } from "../attestationValidation/attestationLibraries";

/**
 * This is the first module that will be run. It deploys the proxy and the
 * proxy admin, and returns them so that they can be used by other modules.
 */
export const PassportCredentialIssuerProxyFirstImplementationModule = buildModule(
  "PassportCredentialIssuerProxyFirstImplementationModule",
  (m) => {
    // This address is the owner of the ProxyAdmin contract,
    // so it will be the only account that can upgrade the proxy when needed.
    const proxyAdminOwner = m.getAccount(0);

    // This contract is supposed to be deployed to the same address across many networks,
    // so the first implementation address is a dummy contract that does nothing but accepts any calldata.
    // Therefore, it is a mechanism to deploy TransparentUpgradeableProxy contract
    // with constant constructor arguments, so predictable init bytecode and predictable CREATE2 address.
    // Subsequent upgrades are supposed to switch this proxy to the real implementation.

    const proxy = m.contract(
      "TransparentUpgradeableProxy",
      {
        abi: TRANSPARENT_UPGRADEABLE_PROXY_ABI,
        contractName: "TransparentUpgradeableProxy",
        bytecode: TRANSPARENT_UPGRADEABLE_PROXY_BYTECODE,
        sourceName: "",
        linkReferences: {},
      },
      [
        contractsInfo.CREATE2_ADDRESS_ANCHOR.unifiedAddress,
        proxyAdminOwner,
        contractsInfo.PASSPORT_CREDENTIAL_ISSUER.create2Calldata,
      ],
    );

    const proxyAdminAddress = m.readEventArgument(proxy, "AdminChanged", "newAdmin");
    const proxyAdmin = m.contractAt("ProxyAdmin", proxyAdminAddress);
    return { proxyAdmin, proxy };
  },
);

const PassportCredentialIssuerProxyModule = buildModule(
  "PassportCredentialIssuerProxyModule",
  (m) => {
    const proxyAdminOwner = m.getAccount(0);
    const { proxy, proxyAdmin } = m.useModule(
      PassportCredentialIssuerProxyFirstImplementationModule,
    );

    const stateContractAddress = m.getParameter("stateContractAddress");
    const idType = m.getParameter("idType");
    const expirationTime = m.getParameter("expirationTime");
    const templateRoot = m.getParameter("templateRoot");

    const { identityLib } = m.useModule(IdentityLibModule);
    const { nitroAttestationValidator, certificatesValidator } = m.useModule(
      NitroAttestationValidatorModule,
    );

    const newPassportCredentialIssuerImpl = m.contract("PassportCredentialIssuer", [], {
      libraries: {
        IdentityLib: identityLib,
      },
    });

    const initializeData = m.encodeFunctionCall(
      newPassportCredentialIssuerImpl,
      "initialize(uint256,uint256,string[],address[],address,bytes2,address,address)",
      [
        expirationTime,
        templateRoot,
        [],
        [],
        stateContractAddress,
        idType,
        proxyAdminOwner,
        nitroAttestationValidator,
      ],
    );

    m.call(proxyAdmin, "upgradeAndCall", [proxy, newPassportCredentialIssuerImpl, initializeData], {
      from: proxyAdminOwner,
    });

    return {
      identityLib,
      newPassportCredentialIssuerImpl,
      certificatesValidator,
      proxyAdmin,
      proxy,
    };
  },
);

const PassportCredentialIssuerModule = buildModule("PassportCredentialIssuerModule", (m) => {
  const { identityLib, newPassportCredentialIssuerImpl, certificatesValidator, proxy, proxyAdmin } =
    m.useModule(PassportCredentialIssuerProxyModule);

  const passportCredentialIssuer = m.contractAt("PassportCredentialIssuer", proxy);

  return {
    passportCredentialIssuer,
    identityLib,
    newPassportCredentialIssuerImpl,
    certificatesValidator,
    proxy,
    proxyAdmin,
  };
});

export default PassportCredentialIssuerModule;
