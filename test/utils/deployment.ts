import hre, { ethers, ignition, upgrades } from "hardhat";
import { Contract, Signer } from "ethers";
import { PassportData, genMockPassportData } from "passport-utils";
import {
  DeployedActors,
  CredentialVerifier,
  DeployedActorsAnonAadhaar,
  AnonAadhaarVerifier,
} from "./types";
// Verifier artifacts
import CredentialVerifierArtifact from "../../artifacts/contracts/verifiers/credential/Verifier_credential_sha256.sol/Verifier_credential_sha256.json";
import AnonAadhaarlVerifierArtifact from "../../artifacts/contracts/verifiers/anonAadhaarV1/Verifier_anon_aadhaar_v1.sol/Verifier_anon_aadhaar_v1.json";

import { chainIdInfoMap } from "./constants";
import {
  CREATEX_FACTORY_ADDRESS,
  SIGNED_SERIALISED_TRANSACTION_GAS_LIMIT_25000000,
} from "../../helpers/constants";
import Create2AddressAnchorModule from "../../ignition/modules/create2AddressAnchor/create2AddressAnchor";
import PassportCredentialIssuerModule from "../../ignition/modules/passportCredentialIssuer/deployPassportCredentialIssuer";
import {
  Poseidon1Module,
  Poseidon2Module,
  Poseidon3Module,
  Poseidon4Module,
  SmtLibModule,
} from "../../ignition/modules/identityLib/libraries";
import AnonAadhaarCredentialIssuerModule from "../../ignition/modules/anonAadhaarCredentialIssuer/deployAnonAadhaarCredentialIssuer";
import { CertificatesLibModule } from "../../ignition/modules/attestationValidation/attestationLibraries";

export async function deploySystemFixtures(): Promise<DeployedActors> {
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

  await deployCreate2Contracts();

  const stContracts = await deployStateWithLibraries();

  const expirationTime = BigInt(60 * 60 * 24 * 7); // 1 week
  const maxFutureTime = BigInt(15 * 60); // 15 minutes
  const templateRoot = BigInt(
    "20928513831198457326281890226858421791230183718399181538736627412475062693938",
  );

  const { poseidon: poseidon4Elements } = await ignition.deploy(Poseidon4Module);
  poseidon4Elements.waitForDeployment();
  console.log(`Poseidon4 deployed to: ${await poseidon4Elements.getAddress()}`);

  const {
    identityLib,
    passportCredentialIssuer,
    newPassportCredentialIssuerImpl,
    certificatesValidator,
    certificatesLib,
    nitroAttestationValidator,
    proxyAdmin,
  } = await ignition.deploy(PassportCredentialIssuerModule, {
    parameters: {
      PassportCredentialIssuerProxyModule: {
        stateContractAddress: stContracts.state.target as string,
        idType: stContracts.defaultIdType,
        expirationTime: expirationTime,
        maxFutureTime: maxFutureTime,
        templateRoot: templateRoot,
      },
      IdentityLibModule: {
        poseidon3ElementAddress: await stContracts.poseidon3.getAddress(),
        poseidon4ElementAddress: await poseidon4Elements.getAddress(),
        smtLibAddress: await stContracts.smtLib.getAddress(),
      },
    },
  });

  console.log("PassportCredentialIssuer deployed address:", passportCredentialIssuer.target);
  console.log(
    "PassportCredentialIssuer implementation address:",
    newPassportCredentialIssuerImpl.target,
  );

  await passportCredentialIssuer.addTransactor(await owner.getAddress());
  //await passportCredentialIssuer.addSigner(await user1.getAddress());
  await passportCredentialIssuer.updateCredentialVerifiers(
    ["credential_sha256"],
    [credentialVerifier.target as string],
  );

  const certificatesValidatorStubFactory = await ethers.getContractFactory(
    "CertificatesValidatorStub",
    {
      libraries: {
        CertificatesLib: await certificatesLib.getAddress(),
      },
    },
  );
  const certificatesValidatorStub = await certificatesValidatorStubFactory.deploy();

  return {
    credentialVerifier,
    owner,
    user1,
    user2,
    mockPassport,
    passportCredentialIssuer: passportCredentialIssuer,
    certificatesValidator,
    certificatesValidatorStub,
    nitroAttestationValidator,
    proxyAdmin,
    state: stContracts.state,
    identityLib,
    idType: stContracts.defaultIdType,
    expirationTime,
    maxFutureTime,
    templateRoot,
    poseidon3: stContracts.poseidon3,
    poseidon4: poseidon4Elements,
    smtLib: stContracts.smtLib,
  };
}

async function deployCreate2Contracts() {
  const [owner] = await ethers.getSigners();

  const provider = ethers.provider;

  const nonce = await provider.getTransactionCount(
    "0xeD456e05CaAb11d66C4c797dD6c1D6f9A7F352b5",
    "latest",
  );

  if (nonce == 0) {
    await owner.sendTransaction({
      to: "0xeD456e05CaAb11d66C4c797dD6c1D6f9A7F352b5",
      value: ethers.parseEther("100.0"),
    });

    const txResponse = await provider.broadcastTransaction(
      SIGNED_SERIALISED_TRANSACTION_GAS_LIMIT_25000000,
    );

    await txResponse.wait();

    const bytecode = await provider.getCode(CREATEX_FACTORY_ADDRESS);
    if (bytecode === "0x") {
      throw Error(`CreateX should've been deployed to ${CREATEX_FACTORY_ADDRESS} but it wasn't`);
    } else {
      console.log(`CreateX deployed to: ${CREATEX_FACTORY_ADDRESS}`);
    }

    const { create2AddressAnchor } = await ignition.deploy(Create2AddressAnchorModule, {
      strategy: "create2",
      defaultSender: await owner.getAddress(),
    });

    const contractAddress = await create2AddressAnchor.getAddress();
    console.log(`Create2AddressAnchor deployed to: ${contractAddress}`);
  }
}

export async function deployContractWrapper(contractName: string): Promise<Contract> {
  const ContractWrapper = await ethers.getContractFactory(contractName);
  const contractWrapper = await ContractWrapper.deploy();
  console.log(`${contractName} deployed to:`, await contractWrapper.getAddress());
  return contractWrapper;
}

export async function deployCertificatesLibWrapper(): Promise<Contract> {
  const { certificatesLib } = await ignition.deploy(CertificatesLibModule);
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

export async function deployIdentityLib(
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
  const { poseidon: poseidon1Elements } = await ignition.deploy(Poseidon1Module);
  poseidon1Elements.waitForDeployment();
  console.log(`Poseidon1 deployed to: ${await poseidon1Elements.getAddress()}`);

  const { poseidon: poseidon2Elements } = await ignition.deploy(Poseidon2Module);

  poseidon2Elements.waitForDeployment();
  console.log(`Poseidon2 deployed to: ${await poseidon2Elements.getAddress()}`);

  const { poseidon: poseidon3Elements } = await ignition.deploy(Poseidon3Module);
  poseidon3Elements.waitForDeployment();
  console.log(`Poseidon3 deployed to: ${await poseidon3Elements.getAddress()}`);

  const { smtLib } = await ignition.deploy(SmtLibModule, {
    parameters: {
      SmtLibModule: {
        poseidon2ElementAddress: await poseidon2Elements.getAddress(),
        poseidon3ElementAddress: await poseidon3Elements.getAddress(),
      },
    },
  });

  smtLib.waitForDeployment();
  console.log(`SmtLib deployed to: ${await smtLib.getAddress()}`);

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

  await deployCreate2Contracts();

  const { poseidon: poseidon4Elements } = await ignition.deploy(Poseidon4Module);

  poseidon4Elements.waitForDeployment();
  console.log(`Poseidon4 deployed to: ${await poseidon4Elements.getAddress()}`);

  const stContracts = await deployStateWithLibraries();

  const nullifierSeed = 12345678n;
  const expirationTime = 15776640n;

  const {
    identityLib,
    anonAadhaarCredentialIssuer,
    newAnonAadhaarCredentialIssuerImpl,
    proxyAdmin,
  } = await ignition.deploy(AnonAadhaarCredentialIssuerModule, {
    parameters: {
      AnonAadhaarCredentialIssuerProxyModule: {
        stateContractAddress: stContracts.state.target as string,
        idType: stContracts.defaultIdType,
        expirationTime: expirationTime,
        templateRoot: templateRoot,
        nullifierSeed: nullifierSeed,
        publicKeyHashes: publicKeyHashes,
        supportedQrVersions: supportedQrVersions,
      },
      IdentityLibModule: {
        poseidon3ElementAddress: await stContracts.poseidon3.getAddress(),
        poseidon4ElementAddress: await poseidon4Elements.getAddress(),
        smtLibAddress: await stContracts.smtLib.getAddress(),
      },
    },
  });

  console.log("AnonAadhaarCredentialIssuer deployed address:", anonAadhaarCredentialIssuer.target);
  console.log(
    "AnonAadhaarCredentialIssuer implementation address:",
    newAnonAadhaarCredentialIssuerImpl.target,
  );

  // set issuerDidHas
  const updateIssuerTx = await anonAadhaarCredentialIssuer.setIssuerDidHash(
    "12146166192964646439780403715116050536535442384123009131510511003232108502337",
  );
  await updateIssuerTx.wait();

  return {
    owner,
    user1,
    user2,
    anonAadhaarIssuer: anonAadhaarCredentialIssuer,
    proxyAdmin,
    anonAadhaarVerifier: anonAadhaarVerifier,
    state: stContracts.state,
    identityLib,
    idType: stContracts.defaultIdType,
    expirationTime,
    templateRoot,
    nullifierSeed,
    publicKeyHashes,
    supportedQrVersions,
    poseidon3: stContracts.poseidon3,
    poseidon4: poseidon4Elements,
    smtLib: stContracts.smtLib,
  };
}
