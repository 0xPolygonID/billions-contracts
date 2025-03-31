import hre, { ethers, upgrades } from "hardhat";
import { Contract, Signer } from "ethers";
import { PassportData } from "../../../passport-circuits/utils/types";
import { genMockPassportData } from "../../../passport-circuits/utils/passports/genMockPassportData";
import { DscVerifierId } from "../../../passport-circuits/utils/constants/constants";
import { getCscaTreeRoot } from "../../../passport-circuits/utils/trees";
import serialized_csca_tree from "./pubkeys/serialized_csca_tree.json";
import {
  DeployedActors,
  DscVerifier,
  IdentityVerificationHub,
  IdentityVerificationHubImplV1,
  IdentityRegistry,
  IdentityRegistryImplV1,
  SignatureVerifier,
  CredentialVerifier,
} from "./types";
import { poseidonContract } from "circomlibjs";
// Verifier artifacts
import DscVerifierArtifact from "../../artifacts/contracts/verifiers/dsc/Verifier_dsc_sha256_rsa_65537_4096.sol/Verifier_dsc_sha256_rsa_65537_4096.json";
import SignatureVerifierArtifact from "../../artifacts/contracts/verifiers/signature/Verifier_signature_sha256_sha256_sha256_rsa_65537_4096.sol/Verifier_signature_sha256_sha256_sha256_rsa_65537_4096.json";
import CredentialVerifierArtifact from "../../artifacts/contracts/verifiers/credential/Verifier_credential_sha256.sol/Verifier_credential_sha256.json";

import { PassportCredentialIssuer, PassportCredentialIssuerImplV1 } from "../../typechain-types";
import { chainIdInfoMap } from "./constants";

export async function deploySystemFixtures(): Promise<DeployedActors> {
  let identityVerificationHubProxy: IdentityVerificationHub;
  let identityVerificationHubImpl: IdentityVerificationHubImplV1;
  let identityRegistryProxy: IdentityRegistry;
  let identityRegistryImpl: IdentityRegistryImplV1;
  let passportCredentialIssuerProxy: PassportCredentialIssuer;
  let passportCredentialIssuerImpl: PassportCredentialIssuerImplV1;
  let dscVerifier: DscVerifier;
  let signatureVerifier: SignatureVerifier;
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

  const lastName = 'KUZNETSOV';
  const firstName = 'VALERIY';

  mockPassport = genMockPassportData(
    "sha256",
    "sha256",
    "rsa_sha256_65537_4096",
    "UKR",
    '960309',
    '350803',
    'AC1234567',
    lastName,
    firstName
  );

  // Deploy dsc verifier
  const dscVerifierArtifact = DscVerifierArtifact;
  const dscVerifierFactory = await ethers.getContractFactory(
    dscVerifierArtifact.abi,
    dscVerifierArtifact.bytecode,
    owner,
  );
  dscVerifier = await dscVerifierFactory.deploy();
  await dscVerifier.waitForDeployment();

  // Deploy signature verifier
  const signatureVerifierArtifact = SignatureVerifierArtifact;
  const signatureVerifierFactory = await ethers.getContractFactory(
    signatureVerifierArtifact.abi,
    signatureVerifierArtifact.bytecode,
    owner,
  );
  signatureVerifier = await signatureVerifierFactory.deploy();
  await signatureVerifier.waitForDeployment();

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

  // Deploy IdentityRegistryImplV1
  const IdentityRegistryImplFactory = await ethers.getContractFactory(
    "IdentityRegistryImplV1",
    {
      libraries: {
        PoseidonT3: poseidonT3.target,
      },
    },
    owner,
  );
  identityRegistryImpl = await IdentityRegistryImplFactory.deploy();
  await identityRegistryImpl.waitForDeployment();

  // Deploy IdentityVerificationHubImplV1
  const IdentityVerificationHubImplFactory = await ethers.getContractFactory(
    "IdentityVerificationHubImplV1",
    owner,
  );
  identityVerificationHubImpl = await IdentityVerificationHubImplFactory.deploy();
  await identityVerificationHubImpl.waitForDeployment();

  // Deploy registry with temporary hub address
  const temporaryHubAddress = "0x0000000000000000000000000000000000000000";
  const registryInitData = identityRegistryImpl.interface.encodeFunctionData("initialize", [
    temporaryHubAddress,
  ]);
  const registryProxyFactory = await ethers.getContractFactory("IdentityRegistry", owner);
  identityRegistryProxy = await registryProxyFactory.deploy(
    identityRegistryImpl.target,
    registryInitData,
  );
  await identityRegistryProxy.waitForDeployment();

  // Deploy hub with deployed registry and verifiers
  const initializeData = identityVerificationHubImpl.interface.encodeFunctionData("initialize", [
    identityRegistryProxy.target,
    [DscVerifierId.dsc_sha256_rsa_65537_4096],
    [dscVerifier.target],
  ]);
  const hubFactory = await ethers.getContractFactory("IdentityVerificationHub", owner);
  identityVerificationHubProxy = await hubFactory.deploy(
    identityVerificationHubImpl.target,
    initializeData,
  );
  await identityVerificationHubProxy.waitForDeployment();

  // Get contracts with implementation ABI and update hub address
  const registryContract = (await ethers.getContractAt(
    "IdentityRegistryImplV1",
    identityRegistryProxy.target,
  )) as IdentityRegistryImplV1;
  const updateHubTx = await registryContract.updateHub(identityVerificationHubProxy.target);
  await updateHubTx.wait();

  const hubContract = (await ethers.getContractAt(
    "IdentityVerificationHubImplV1",
    identityVerificationHubProxy.target,
  )) as IdentityVerificationHubImplV1;

  // Initialize roots
  const csca_root = getCscaTreeRoot(serialized_csca_tree);
  await registryContract.updateCscaRoot(csca_root, { from: owner });

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
  const templateRoot = BigInt("11355012832755671330307538002239263753806804904003813746452342893352381210514");
  const passportCredentialIssuerInitData =
    passportCredentialIssuerImpl.interface.encodeFunctionData("initializeIssuer", [
      expirationTime,
      templateRoot,
      registryContract.target,
      ["credential_sha256"],
      [credentialVerifier.target],
      ["signature_sha256_sha256_sha256_rsa_65537_4096"],
      [signatureVerifier.target],
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

  return {
    hub: hubContract,
    hubImpl: identityVerificationHubImpl,
    registry: registryContract,
    registryImpl: identityRegistryImpl,
    dscVerifier,
    signatureVerifier,
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
  smtpAddress: string,
  poseidonUtil3lAddress: string,
  poseidonUtil4lAddress: string,
): Promise<Contract> {
  const Identity = await ethers.getContractFactory("IdentityLib", {
    libraries: {
      SmtLib: smtpAddress,
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
