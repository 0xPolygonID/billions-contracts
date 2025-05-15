import hre, { ethers, upgrades } from "hardhat";
import { Contract, Signer } from "ethers";
import { PassportData, genMockPassportData } from "passport-utils";
import {
  DeployedActors,
  CredentialVerifier,
  DeployedActorsAnonAadhaar,
  AnonAadhaarVerifier,
} from "./types";
import { poseidonContract } from "circomlibjs";
// Verifier artifacts
import CredentialVerifierArtifact from "../../artifacts/contracts/verifiers/credential/Verifier_credential_sha256.sol/Verifier_credential_sha256.json";
import AnonAadhaarlVerifierArtifact from "../../artifacts/contracts/verifiers/anonAadhaarV1/Verifier_anon_aadhaar_v1.sol/Verifier_anon_aadhaar_v1.json";

import {
  PassportCredentialIssuer,
  PassportCredentialIssuerImplV1,
  AnonAadhaarCredentialIssuerImplV1,
} from "../../typechain-types";
import { chainIdInfoMap } from "./constants";

export async function deploySystemFixtures(): Promise<DeployedActors> {
  let passportCredentialIssuerProxy: PassportCredentialIssuer;
  let passportCredentialIssuerImpl: PassportCredentialIssuerImplV1;
  let credentialVerifier: CredentialVerifier;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let mockPassport: PassportData;

  [owner, user1, user2] = await ethers.getSigners();

  const newBalance = "0x" + ethers.parseEther("10000").toString(16);

  await ethers.provider.send("hardhat_setBalance", [await owner.getAddress(), newBalance]);
  await ethers.provider.send("hardhat_setBalance", [await user1.getAddress(), newBalance]);
  await ethers.provider.send("hardhat_setBalance", [await user2.getAddress(), newBalance]);

  const lastName = "KUZNETSOV";
  const firstName = "VALERIY";

  mockPassport = genMockPassportData(
    "sha256",
    "sha256",
    "rsa_sha256_65537_4096",
    "UKR",
    "960309",
    "350803",
    "AC1234567",
    lastName,
    firstName,
  );

  // Deploy credential verifier
  const credentialVerifierArtifact = CredentialVerifierArtifact;
  const credentialVerifierFactory = await ethers.getContractFactory(
    credentialVerifierArtifact.abi,
    credentialVerifierArtifact.bytecode,
    owner,
  );
  credentialVerifier = await credentialVerifierFactory.deploy();
  await credentialVerifier.waitForDeployment();

  // Deploy PoseidonT3
  const poseidonT3 = await deployPoseidon(3);
  await poseidonT3.waitForDeployment();

  const [poseidon3Elements, poseidon4Elements] = await deployPoseidons([3, 4]);
  const stContracts = await deployStateWithLibraries();
  const identityLib = await deployIdentityLib(
    stContracts.smtLib.target as string,
    poseidon3Elements.target as string,
    poseidon4Elements.target as string,
  );

  // Deploy PassportCredentialIssuerImplV1
  const PassportCredentialIssuerImplFactory = await ethers.getContractFactory(
    "PassportCredentialIssuerImplV1",
    {
      libraries: {
        IdentityLib: identityLib.target,
      },
    },
    owner,
  );
  passportCredentialIssuerImpl = await PassportCredentialIssuerImplFactory.deploy();
  await passportCredentialIssuerImpl.waitForDeployment();

  const expirationTime = BigInt(60 * 60 * 24 * 7); // 1 week
  const maxExpirationTime = BigInt(15 * 60); // 15 minutes
  const templateRoot = BigInt(
    "20928513831198457326281890226858421791230183718399181538736627412475062693938",
  );
  const passportCredentialIssuerInitData =
    passportCredentialIssuerImpl.interface.encodeFunctionData("initializeIssuer", [
      expirationTime,
      maxExpirationTime,
      templateRoot,
      ["credential_sha256"],
      [credentialVerifier.target],
      stContracts.state.target,
      stContracts.defaultIdType,
    ]);
  const passportCredentialIssuerProxyFactory = await ethers.getContractFactory(
    "PassportCredentialIssuer",
    owner,
  );
  passportCredentialIssuerProxy = await passportCredentialIssuerProxyFactory.deploy(
    passportCredentialIssuerImpl.target,
    passportCredentialIssuerInitData,
  );
  await passportCredentialIssuerProxy.waitForDeployment();

  const passportCredentialIssuerContract = (await ethers.getContractAt(
    "PassportCredentialIssuerImplV1",
    passportCredentialIssuerProxy.target,
  )) as PassportCredentialIssuerImplV1;

  const certificatesLib = await deployCertificatesLib();
  const nitroAttestationValidator = await deployNitroAttestationValidator(
    await certificatesLib.getAddress(),
  );
  await passportCredentialIssuerContract.setAttestationValidator(nitroAttestationValidator);

  return {
    credentialVerifier,
    owner,
    user1,
    user2,
    mockPassport,
    passportCredentialIssuer: passportCredentialIssuerContract,
    passportCredentialIssuerImpl: passportCredentialIssuerImpl,
    state: stContracts.state,
    identityLib,
    idType: stContracts.defaultIdType,
    expirationTime,
    templateRoot,
  };
}

async function deployPoseidon(nInputs: number) {
  const abi = poseidonContract.generateABI(nInputs);
  const bytecode = poseidonContract.createCode(nInputs);

  const Poseidon = await ethers.getContractFactory(abi, bytecode);
  const poseidon = await Poseidon.deploy();
  await poseidon.waitForDeployment();
  return poseidon;
}

export async function deployPoseidons(poseidonSizeParams: number[]): Promise<Contract[]> {
  poseidonSizeParams.forEach((size) => {
    if (![1, 2, 3, 4, 5, 6].includes(size)) {
      throw new Error(
        `Poseidon should be integer in a range 1..6. Poseidon size provided: ${size}`,
      );
    }
  });

  const result: any = [];

  for (const size of poseidonSizeParams) {
    const p = await deployPoseidon(size);
    result.push(p);
  }

  return result;
}

async function deploySmtLib(poseidon2Address: string, poseidon3Address: string): Promise<Contract> {
  const smtLib = await ethers.deployContract("SmtLib", {
    libraries: {
      PoseidonUnit2L: poseidon2Address,
      PoseidonUnit3L: poseidon3Address,
    },
  });

  await smtLib.waitForDeployment();
  console.log(`SmtLib deployed to:  ${await smtLib.getAddress()}`);

  return smtLib;
}

export async function deployNitroAttestationValidator(
  certificatesLibAddress: string,
): Promise<Contract> {
  const [owner] = await ethers.getSigners();
  const NitroAttestationValidatorFactory = await ethers.getContractFactory(
    "NitroAttestationValidator",
    {
      libraries: {
        CertificatesLib: certificatesLibAddress,
      },
    },
  );

  const NitroAttestationValidator = await upgrades.deployProxy(
    NitroAttestationValidatorFactory,
    [await owner.getAddress()],
    {
      unsafeAllow: ["external-library-linking"],
    },
  );
  await NitroAttestationValidator.waitForDeployment();
  console.log(
    `NitroAttestationValidator deployed to: ${await NitroAttestationValidator.getAddress()}`,
  );

  return NitroAttestationValidator;
}

export async function deployContractWrapper(contractName: string): Promise<Contract> {
  const ContractWrapper = await ethers.getContractFactory(contractName);
  const contractWrapper = await ContractWrapper.deploy();
  console.log(`${contractName} deployed to:`, await contractWrapper.getAddress());
  return contractWrapper;
}

export async function deployCertificatesValidator(certificatesLib: any): Promise<Contract> {
  const [owner] = await ethers.getSigners();
  const CertificatesValidatorFactory = await ethers.getContractFactory("CertificatesValidator", {
    libraries: {
      CertificatesLib: await certificatesLib.getAddress(),
    },
  });

  const CertificatesValidator = await upgrades.deployProxy(
    CertificatesValidatorFactory,
    [await owner.getAddress()],
    {
      unsafeAllow: ["external-library-linking"],
    },
  );
  await CertificatesValidator.waitForDeployment();
  console.log(`CertificatesValidator deployed to: ${await CertificatesValidator.getAddress()}`);

  return CertificatesValidator;
}

export async function deployCertificatesLib(): Promise<Contract> {
  const certificatesLib = await ethers.deployContract("CertificatesLib");
  await certificatesLib.waitForDeployment();
  console.log(`CertificatesLib deployed to:  ${await certificatesLib.getAddress()}`);

  return certificatesLib;
}

export async function deployCertificatesLibWrapper(): Promise<Contract> {
  const certificatesLib = await deployCertificatesLib();
  const CertificatesLibWrapperFactory = await ethers.getContractFactory("CertificatesLibWrapper", {
    libraries: {
      CertificatesLib: await certificatesLib.getAddress(),
    },
  });

  const CertificatesLibWrapper = await CertificatesLibWrapperFactory.deploy();
  await CertificatesLibWrapper.waitForDeployment();
  console.log(`CertificatesLibWrapper deployed to: ${await CertificatesLibWrapper.getAddress()}`);

  return CertificatesLibWrapper;
}

export async function getChainId() {
  return parseInt(await hre.network.provider.send("eth_chainId"), 16);
}

async function getDefaultIdType(): Promise<{
  defaultIdType: string;
  chainId: number;
}> {
  const chainId = await getChainId();
  const defaultIdType = chainIdInfoMap.get(chainId)?.idType;
  if (!defaultIdType) {
    throw new Error(`Failed to find defaultIdType in Map for chainId ${chainId}`);
  }
  return { defaultIdType, chainId };
}

async function deployGroth16VerifierStateTransition(): Promise<Contract> {
  const owner = (await ethers.getSigners())[0];

  console.log("deploying Groth16VerifierStateTransition...");

  const g16Verifier = await ethers.deployContract("Groth16VerifierStateTransition");

  await g16Verifier.waitForDeployment();
  console.log(
    `Groth16VerifierStateTransition contract deployed to address ${await g16Verifier.getAddress()} from ${await owner.getAddress()}`,
  );

  return g16Verifier;
}

async function deployStateLib(): Promise<Contract> {
  const stateLib = await ethers.deployContract("StateLib");
  await stateLib.waitForDeployment();
  console.log(`StateLib deployed to:  ${await stateLib.getAddress()}`);

  return stateLib;
}

async function deployStateCrossChainLib(
  StateCrossChainLibName = "StateCrossChainLib",
): Promise<Contract> {
  const stateCrossChainLib = await ethers.deployContract(StateCrossChainLibName);
  await stateCrossChainLib.waitForDeployment();
  console.log(`StateCrossChainLib deployed to:  ${await stateCrossChainLib.getAddress()}`);

  return stateCrossChainLib;
}

async function deployCrossChainProofValidator(
  contractName = "CrossChainProofValidator",
  domainName = "StateInfo",
  signatureVersion = "1",
): Promise<Contract> {
  const chainId = await getChainId();
  const oracleSigningAddress = chainIdInfoMap.get(chainId)?.oracleSigningAddress;

  const crossChainProofValidator = await ethers.deployContract(contractName, [
    domainName,
    signatureVersion,
    oracleSigningAddress,
  ]);
  await crossChainProofValidator.waitForDeployment();
  console.log(`${contractName} deployed to: ${await crossChainProofValidator.getAddress()}`);
  return crossChainProofValidator;
}

async function deployIdentityLib(
  smtLibAddress: string,
  poseidonUtil3lAddress: string,
  poseidonUtil4lAddress: string,
): Promise<Contract> {
  const Identity = await ethers.getContractFactory("IdentityLib", {
    libraries: {
      SmtLib: smtLibAddress,
      PoseidonUnit3L: poseidonUtil3lAddress,
      PoseidonUnit4L: poseidonUtil4lAddress,
    },
  });
  const il = await Identity.deploy();
  await il.waitForDeployment();
  console.log(`IdentityLib deployed to: ${await il.getAddress()}`);

  return il;
}

export async function deployStateWithLibraries(supportedIdTypes: string[] = []): Promise<{
  state: Contract;
  stateLib: Contract;
  stateCrossChainLib: Contract;
  crossChainProofValidator: Contract;
  smtLib: Contract;
  poseidon1: Contract;
  poseidon2: Contract;
  poseidon3: Contract;
  groth16verifier: Contract;
  defaultIdType;
}> {
  const [poseidon1Elements, poseidon2Elements, poseidon3Elements] = await deployPoseidons([
    1, 2, 3,
  ]);

  const smtLib = await deploySmtLib(
    await poseidon2Elements.getAddress(),
    await poseidon3Elements.getAddress(),
  );

  const {
    state,
    stateLib,
    stateCrossChainLib,
    crossChainProofValidator,
    groth16VerifierStateTransition,
    defaultIdType,
  } = await deployState(
    supportedIdTypes,
    await smtLib.getAddress(),
    await poseidon1Elements.getAddress(),
  );

  return {
    state,
    stateLib: stateLib!,
    stateCrossChainLib: stateCrossChainLib!,
    crossChainProofValidator: crossChainProofValidator!,
    defaultIdType,
    smtLib,
    poseidon1: poseidon1Elements,
    poseidon2: poseidon2Elements,
    poseidon3: poseidon3Elements,
    groth16verifier: groth16VerifierStateTransition!,
  };
}

async function deployState(
  supportedIdTypes: string[] = [],
  smtLibAddress: string,
  poseidon1Address: string,
): Promise<{
  state: Contract;
  stateLib: Contract | null;
  stateCrossChainLib: Contract | null;
  crossChainProofValidator: Contract | null;
  groth16VerifierStateTransition: Contract | null;
  defaultIdType;
}> {
  console.log("======== State: deploy started ========");

  const { defaultIdType, chainId } = await getDefaultIdType();
  console.log(`found defaultIdType ${defaultIdType} for chainId ${chainId}`);

  const owner = (await ethers.getSigners())[0];

  let state;

  const groth16VerifierStateTransition = await deployGroth16VerifierStateTransition();

  console.log("deploying StateLib...");
  const stateLib = await deployStateLib();

  console.log("deploying StateCrossChainLib...");
  const stateCrossChainLib = await deployStateCrossChainLib("StateCrossChainLib");

  console.log("deploying CrossChainProofValidator...");
  const crossChainProofValidator = await deployCrossChainProofValidator();

  console.log("deploying State...");

  const StateFactory = await ethers.getContractFactory("State", {
    libraries: {
      StateLib: await stateLib.getAddress(),
      SmtLib: smtLibAddress,
      PoseidonUnit1L: poseidon1Address,
      StateCrossChainLib: await stateCrossChainLib.getAddress(),
    },
  });

  state = await upgrades.deployProxy(
    StateFactory,
    [
      await groth16VerifierStateTransition.getAddress(),
      defaultIdType,
      await owner.getAddress(),
      await crossChainProofValidator.getAddress(),
    ],
    {
      unsafeAllow: ["external-library-linking"],
    },
  );

  await state.waitForDeployment();
  console.log(
    `State contract deployed to address ${await state.getAddress()} from ${await owner.getAddress()}`,
  );

  if (supportedIdTypes.length) {
    supportedIdTypes = [...new Set(supportedIdTypes)];
    for (const idType of supportedIdTypes) {
      const tx = await state.setSupportedIdType(idType, true);
      await tx.wait();
      console.log(`Added id type ${idType}`);
    }
  }
  console.log("======== State: deploy completed ========");

  return {
    state,
    stateLib,
    stateCrossChainLib,
    crossChainProofValidator,
    groth16VerifierStateTransition,
    defaultIdType,
  };
}

export async function deployAnonAadhaarIssuerFixtures(
  publicKeyHashes: bigint[] = [
    18063425702624337643644061197836918910810808173893535653269228433734128853484n,
    15134874015316324267425466444584014077184337590635665158241104437045239495873n,
  ],
  supportedQrVersions: bigint[] = [382n, 384n], // v2 and v4
  templateRoot: bigint = 5086122537745747254581491345739247223240245653900608092926314604019374578867n,
): Promise<DeployedActorsAnonAadhaar> {
  let [owner, user1, user2] = await ethers.getSigners();

  const newBalance = "0x" + ethers.parseEther("10000").toString(16);

  await ethers.provider.send("hardhat_setBalance", [await owner.getAddress(), newBalance]);
  await ethers.provider.send("hardhat_setBalance", [await user1.getAddress(), newBalance]);
  await ethers.provider.send("hardhat_setBalance", [await user2.getAddress(), newBalance]);

  // Deploy credential verifier
  const anonAadhaarVerifierArtifact = AnonAadhaarlVerifierArtifact;
  const anonAadhaarVerifierFactory = await ethers.getContractFactory(
    anonAadhaarVerifierArtifact.abi,
    anonAadhaarVerifierArtifact.bytecode,
    owner,
  );
  const anonAadhaarVerifier: AnonAadhaarVerifier = await anonAadhaarVerifierFactory.deploy();
  await anonAadhaarVerifier.waitForDeployment();

  const [poseidon3Elements, poseidon4Elements] = await deployPoseidons([3, 4]);
  const stContracts = await deployStateWithLibraries();
  const identityLib = await deployIdentityLib(
    stContracts.smtLib.target as string,
    poseidon3Elements.target as string,
    poseidon4Elements.target as string,
  );

  // Deploy AnonAadhaarCredentialIssuerImplV1
  const AnonAadhaarIssuerImplFactory = await ethers.getContractFactory(
    "AnonAadhaarCredentialIssuerImplV1",
    {
      libraries: {
        IdentityLib: identityLib.target,
      },
    },
    owner,
  );
  const anonAadhaarIssuerImpl = await AnonAadhaarIssuerImplFactory.deploy();
  await anonAadhaarIssuerImpl.waitForDeployment();

  const nullifierSeed = 12345678n;
  const expirationTime = 15776640n;

  const anonAadhaarIssuerInitData = anonAadhaarIssuerImpl.interface.encodeFunctionData(
    "initialize(uint256,uint256[],uint256[],uint256,uint256,address,address,bytes2)",
    [
      nullifierSeed,
      publicKeyHashes,
      supportedQrVersions,
      expirationTime,
      templateRoot,
      await anonAadhaarVerifier.getAddress(),
      await stContracts.state.getAddress(),
      stContracts.defaultIdType,
    ],
  );
  const anonAadhaarIssuerProxyFactory = await ethers.getContractFactory(
    "AnonAadhaarCredentialIssuer",
    owner,
  );

  const anonAadhaarIssuerProxy = await anonAadhaarIssuerProxyFactory.deploy(
    anonAadhaarIssuerImpl.target,
    anonAadhaarIssuerInitData,
  );
  await anonAadhaarIssuerProxy.waitForDeployment();

  const anonAadhaarIssuerContract = (await ethers.getContractAt(
    "AnonAadhaarCredentialIssuerImplV1",
    anonAadhaarIssuerProxy.target,
  )) as AnonAadhaarCredentialIssuerImplV1;

  // set issuerDidHas
  const updateIssuerTx = await anonAadhaarIssuerContract.setIssuerDidHash(
    "12146166192964646439780403715116050536535442384123009131510511003232108502337",
  );
  await updateIssuerTx.wait();

  return {
    owner,
    user1,
    user2,
    anonAadhaarIssuer: anonAadhaarIssuerContract,
    anonAadhaarIssuerImpl: anonAadhaarIssuerImpl,
    anonAadhaarVerifier: anonAadhaarVerifier,
    state: stContracts.state,
    identityLib,
    idType: stContracts.defaultIdType,
    expirationTime,
    templateRoot,
    nullifierSeed,
  };
}
