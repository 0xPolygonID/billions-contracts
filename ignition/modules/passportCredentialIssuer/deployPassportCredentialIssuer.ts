import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import {
  contractsInfo,
  TRANSPARENT_UPGRADEABLE_PROXY_ABI,
  TRANSPARENT_UPGRADEABLE_PROXY_BYTECODE,
} from "../../../helpers/constants";

/**
 * This is the first module that will be run. It deploys the proxy and the
 * proxy admin, and returns them so that they can be used by other modules.
 */
export const PassportCredentialIssuerProxyModule = buildModule(
  "PassportCredentialIssuerProxyModule",
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

/**
 * This is the second module that will be run, and it is also the only module exported from this file.
 * It creates a contract instance for the Demo contract using the proxy from the previous module.
 */
export const PassportCredentialIssuerModule = buildModule("PassportCredentialIssuerModule", (m) => {
  // Get the proxy and proxy admin from the previous module.
  const { proxy, proxyAdmin } = m.useModule(PassportCredentialIssuerProxyModule);

  // Here we're using m.contractAt(...) a bit differently than we did above.
  // While we're still using it to create a contract instance, we're now telling Hardhat Ignition
  // to treat the contract at the proxy address as an instance of the Demo contract.
  // This allows us to interact with the underlying Demo contract via the proxy from within tests and scripts.
  const passportCredentialIssuer = m.contractAt(
    contractsInfo.PASSPORT_CREDENTIAL_ISSUER.name,
    proxy,
  );

  const smtLibAddress = m.contractAt("SmtLib", "0x682364078e26C1626abD2B95109D2019E241F0F6");
  const poseidonUtil3lAddress = m.contractAt(
    "PoseidonUnit3L",
    "0x5Bc89782d5eBF62663Df7Ce5fb4bc7408926A240",
  );
  const poseidonUtil4lAddress = m.contractAt(
    "PoseidonUnit4L",
    "0x0695cF2c6dfc438a4E40508741888198A6ccacC2",
  );

  m.contract("IdentityLib", [], {
    libraries: {
      SmtLib: smtLibAddress,
      PoseidonUnit3L: poseidonUtil3lAddress,
      PoseidonUnit4L: poseidonUtil4lAddress,
    },
  });

  // Return the contract instance, along with the original proxy and proxyAdmin contracts
  // so that they can be used by other modules, or in tests and scripts.
  return { passportCredentialIssuer, proxy, proxyAdmin };
});

export default PassportCredentialIssuerModule;