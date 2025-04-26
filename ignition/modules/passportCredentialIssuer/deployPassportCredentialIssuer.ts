import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { artifacts, ethers } from "hardhat";
import { contractsInfo, TRANSPARENT_UPGRADEABLE_PROXY_ABI, TRANSPARENT_UPGRADEABLE_PROXY_BYTECODE } from "../../../helpers/constants";

function getPassportCredentialIssuerInitializeData() {
  const passportCredentialIssuerArtifact = artifacts.readArtifactSync(
    "PassportCredentialIssuerImplV1",
  );
  return new ethers.Interface(passportCredentialIssuerArtifact.abi);
}

const PassportCredentialIssuerProxyModule = buildModule("PassportCredentialIssuerProxyModule", (m) => {
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
});

export const PassportCredentialIssuerModule = buildModule("PassportCredentialIssuerModule", (m) => {
  // Get the proxy and proxy admin from the previous module.
  const { proxy, proxyAdmin } = m.useModule(PassportCredentialIssuerProxyModule);

  const smtLibAddress = m.contractAt("SmtLib", "0x682364078e26C1626abD2B95109D2019E241F0F6");
  const poseidonUtil3lAddress = m.contractAt(
    "PoseidonUnit3L",
    "0x5Bc89782d5eBF62663Df7Ce5fb4bc7408926A240",
  );
  const poseidonUtil4lAddress = m.contractAt(
    "PoseidonUnit4L",
    "0x0695cF2c6dfc438a4E40508741888198A6ccacC2",
  );

  const identityLib = m.contract("IdentityLib", [], {
    libraries: {
      SmtLib: smtLibAddress,
      PoseidonUnit3L: poseidonUtil3lAddress,
      PoseidonUnit4L: poseidonUtil4lAddress,
    },
  });
  const passportCredentialIssuerImpl = m.contract("PassportCredentialIssuerImplV1", [], {
    libraries: {
      IdentityLib: identityLib,
    },
  });

  const passportCredentialIssuerInterface = getPassportCredentialIssuerInitializeData();

  const signerAddress = "0xDC3461f9f021dD904C71492EaBd86EaaF6dADbCb"; //m.getAccount(0);

  const stateContractAddress = "0x3C9acB2205Aa72A05F6D77d708b5Cf85FCa3a896"; //"0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124"; // "<StateContractAddress>"; // Replace with actual state contract address
  const idType = "0x01B2"; // "0x0113";
  const expirationTime = BigInt(60 * 60 * 24 * 7); // 1 week
  const templateRoot = BigInt(
    "3532467563022391950170321692541635800576371972220969617740093781820662149190",
  );
  const initializeData = passportCredentialIssuerInterface.encodeFunctionData("initializeIssuer", [
    expirationTime,
    templateRoot,
    [],
    [],
    [signerAddress],
    stateContractAddress,
    idType,
  ]);

  const passportCredentialIssuer = m.contract("PassportCredentialIssuer", [
    passportCredentialIssuerImpl,
    initializeData,
  ]);


});
