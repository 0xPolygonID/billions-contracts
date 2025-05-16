import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import {
  contractsInfo,
  TRANSPARENT_UPGRADEABLE_PROXY_ABI,
  TRANSPARENT_UPGRADEABLE_PROXY_BYTECODE,
} from "../../../helpers/constants";
import IdentityLibModule from "../identityLib/identityLib";
import DeployAnonAadhaarVerifierModule from "./deployAnonAadhaarVerifier";

const productionPublicKeyHash =
  18063425702624337643644061197836918910810808173893535653269228433734128853484n;
const developmentPublicKeyHash =
  15134874015316324267425466444584014077184337590635665158241104437045239495873n;

/**
 * This is the first module that will be run. It deploys the proxy and the
 * proxy admin, and returns them so that they can be used by other modules.
 */
export const AnonAadHaarCredentialIssuerProxyFirstImplementationModule = buildModule(
  "AnonAadHaarCredentialIssuerProxyFirstImplementationModule",
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
        contractsInfo.ANONAADHAAR_CREDENTIAL_ISSUER.create2Calldata,
      ],
    );

    const proxyAdminAddress = m.readEventArgument(proxy, "AdminChanged", "newAdmin");
    const proxyAdmin = m.contractAt("ProxyAdmin", proxyAdminAddress);
    return { proxyAdmin, proxy };
  },
);

const AnonAadHaarCredentialIssuerProxyModule = buildModule(
  "AnonAadHaarCredentialIssuerProxyModule",
  (m) => {
    const proxyAdminOwner = m.getAccount(0);
    const { proxy, proxyAdmin } = m.useModule(
      AnonAadHaarCredentialIssuerProxyFirstImplementationModule,
    );

    const stateContractAddress = m.getParameter("stateContractAddress");
    const idType = m.getParameter("idType");
    const expirationTime = m.getParameter("expirationTime");
    const templateRoot = m.getParameter("templateRoot");
    const nullifierSeed = m.getParameter("nullifierSeed");
    const publicKeyHashes = m.getParameter("publicKeyHashes");
    const supportedQrVersions = m.getParameter("supportedQrVersions");

    const { identityLib } = m.useModule(IdentityLibModule);

    const newAnonAadHaarCredentialIssuerImpl = m.contract("AnonAadHaarCredentialIssuer", [], {
      libraries: {
        IdentityLib: identityLib,
      },
    });

    const { deployedContract: anonAadhaarVerifier } = m.useModule(DeployAnonAadhaarVerifierModule);

    const initializeData = m.encodeFunctionCall(
      newAnonAadHaarCredentialIssuerImpl,
      "initializeIssuer",
      [
        nullifierSeed,
        publicKeyHashes,
        supportedQrVersions,
        expirationTime,
        templateRoot,
        anonAadhaarVerifier,
        [stateContractAddress, idType],
        proxyAdminOwner,
      ],
    );

    m.call(
      proxyAdmin,
      "upgradeAndCall",
      [proxy, newAnonAadHaarCredentialIssuerImpl, initializeData],
      {
        from: proxyAdminOwner,
      },
    );

    return { identityLib, newAnonAadHaarCredentialIssuerImpl, proxyAdmin, proxy };
  },
);

const AnonAadHaarCredentialIssuerModule = buildModule("AnonAadHaarCredentialIssuerModule", (m) => {
  const { identityLib, newAnonAadHaarCredentialIssuerImpl, proxy, proxyAdmin } = m.useModule(
    AnonAadHaarCredentialIssuerProxyModule,
  );

  const anonAadHaarCredentialIssuer = m.contractAt("AnonAadHaarCredentialIssuer", proxy);

  return {
    anonAadHaarCredentialIssuer,
    identityLib,
    newAnonAadHaarCredentialIssuerImpl,
    proxy,
    proxyAdmin,
  };
});

export default AnonAadHaarCredentialIssuerModule;
