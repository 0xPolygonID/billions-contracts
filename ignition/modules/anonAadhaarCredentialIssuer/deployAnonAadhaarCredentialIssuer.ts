import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import DeployAnonAadhaarVerifierModule from "./deployAnonAadhaarVerifier";

const productionPublicKeyHash =
  18063425702624337643644061197836918910810808173893535653269228433734128853484n;
const developmentPublicKeyHash =
  15134874015316324267425466444584014077184337590635665158241104437045239495873n;

export default buildModule("DeployAnonAadhaarCredentialIssuer", (m) => {
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
  const anonAadhaarCredentialIssuerImpl = m.contract("AnonAadhaarCredentialIssuerImplV1", [], {
    libraries: {
      IdentityLib: identityLib,
    },
  });

  const nullifierSeed = 12345678n;
  const publicKeyHashes = [productionPublicKeyHash];
  const expirationTime = 15776640n;
  const templateRoot =
    13618331910493816144112635202719102044017718006809336112633915446302833345855n;

  // TODO (illia-korotia): move to dynamic config [chainId] => [stateContractAddress, idType]
  const stateContractAddress = "0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124";
  const idType = "0x0113";

  const { deployedContract: anonAadhaarVerifier } = m.useModule(DeployAnonAadhaarVerifierModule);

  const initializeData = m.encodeFunctionCall(
    anonAadhaarCredentialIssuerImpl,
    "initialize(uint256,uint256[],uint256,uint256,address,address,bytes2)",
    [
      nullifierSeed,
      publicKeyHashes,
      expirationTime,
      templateRoot,
      anonAadhaarVerifier,
      stateContractAddress,
      idType,
    ],
  );

  const anonAadhaarCredentialIssuer = m.contract("AnonAadhaarCredentialIssuer", [
    anonAadhaarCredentialIssuerImpl,
    initializeData,
  ]);

  return {
    anonAadhaarCredentialIssuer,
    anonAadhaarCredentialIssuerImpl,
  };
});
