import hre, { ethers, ignition, upgrades } from "hardhat";
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

import { AnonAadhaarCredentialIssuerImplV1, PassportCredentialIssuer } from "../../typechain-types";
import { chainIdInfoMap } from "./constants";
import {
  contractsInfo,
  TRANSPARENT_UPGRADEABLE_PROXY_ABI,
  TRANSPARENT_UPGRADEABLE_PROXY_BYTECODE,
} from "../../helpers/constants";
import Create2AddressAnchorModule from "../../ignition/modules/create2AddressAnchor/create2AddressAnchor";
import { buildModule } from "@nomicfoundation/ignition-core";

const PassportCredentialIssuerProxyModule = buildModule(
  "PassportCredentialIssuerProxyModule",
  (m) => {
    const { create2AddressAnchor } = m.useModule(Create2AddressAnchorModule);

    const proxyAdminOwner = m.getAccount(0);

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
        create2AddressAnchor,
        proxyAdminOwner,
        contractsInfo.PASSPORT_CREDENTIAL_ISSUER.create2Calldata,
      ],
    );

    const proxyAdminAddress = m.readEventArgument(proxy, "AdminChanged", "newAdmin");
    const proxyAdmin = m.contractAt("ProxyAdmin", proxyAdminAddress);
    return { proxyAdmin, proxy };
  },
);

const PassportCredentialIssuerModule = buildModule("PassportCredentialIssuerModule", (m) => {
  const { proxy, proxyAdmin } = m.useModule(PassportCredentialIssuerProxyModule);

  const passportCredentialIssuer = m.contractAt(
    contractsInfo.PASSPORT_CREDENTIAL_ISSUER.name,
    proxy,
  );

  return { passportCredentialIssuer, proxy, proxyAdmin };
});

const UpgradePassportCredentialIssuerModule = buildModule(
  "UpgradePassportCredentialIssuerModule",
  (m) => {
    const identityLibAddress = m.getParameter("identityLibAddress");
    const stateContractAddress = m.getParameter("stateContractAddress");
    const credentialVerifierAddress = m.getParameter("credentialVerifierAddress");
    const signerAddress = m.getParameter("signerAddress");
    const circuitId = m.getParameter("circuitId");
    const idType = m.getParameter("idType");

    const identityLib = m.contractAt("IdentityLib", identityLibAddress);

    const proxyAdminOwner = m.getAccount(0);

    const { proxy, proxyAdmin } = m.useModule(PassportCredentialIssuerProxyModule);

    const newPassportCredentialIssuerImpl = m.contract("PassportCredentialIssuer", [], {
      libraries: {
        IdentityLib: identityLib,
      },
    });

    const expirationTime = BigInt(60 * 60 * 24 * 7); // 1 week
    const templateRoot = BigInt(
      "3532467563022391950170321692541635800576371972220969617740093781820662149190",
    );

    const initializeData = m.encodeFunctionCall(
      newPassportCredentialIssuerImpl,
      "initialize(uint256,uint256,string[],address[],address[],address,bytes2,address)",
      [
        expirationTime,
        templateRoot,
        [circuitId],
        [credentialVerifierAddress],
        [signerAddress],
        stateContractAddress,
        idType,
        proxyAdminOwner,
      ],
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

export async function deploySystemFixtures(): Promise<DeployedActors> {
  let passportCredentialIssuer: any;
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

  const expirationTime = BigInt(60 * 60 * 24 * 7); // 1 week
  const templateRoot = BigInt(
    "3532467563022391950170321692541635800576371972220969617740093781820662149190",
  );

  passportCredentialIssuer = (await ignition.deploy(PassportCredentialIssuerModule)).proxy;
  await passportCredentialIssuer.waitForDeployment();

  const passportCredentialIssuerAddress = await passportCredentialIssuer.getAddress();

  console.log(
    `PassportCredentialIssuer (create2AddressAnchor implementation) contract deployed to address ${passportCredentialIssuerAddress} from ${await owner.getAddress()}`,
  );

  passportCredentialIssuer = (
    await ignition.deploy(UpgradePassportCredentialIssuerModule, {
      parameters: {
        UpgradePassportCredentialIssuerModule: {
          identityLibAddress: identityLib.target as string,
          stateContractAddress: stContracts.state.target as string,
          idType: stContracts.defaultIdType,
          credentialVerifierAddress: credentialVerifier.target as string,
          circuitId: "credential_sha256",
          signerAddress: await user1.getAddress(),
        },
      },
    })
  ).proxy;

  await passportCredentialIssuer.waitForDeployment();

  passportCredentialIssuer = (await ethers.getContractAt(
    "PassportCredentialIssuer",
    await passportCredentialIssuer.getAddress(),
  )) as PassportCredentialIssuer;

  console.log(
    `PassportCredentialIssuer (proxy upgraded) contract deployed to address ${await passportCredentialIssuer.getAddress()} from ${await owner.getAddress()}`,
  );

  return {
    credentialVerifier,
    owner,
    user1,
    user2,
    mockPassport,
    passportCredentialIssuer: passportCredentialIssuer,
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
    18063425702624337643644061197836918910810808173893535653269228433734128853484n, // prod (?)
    15134874015316324267425466444584014077184337590635665158241104437045239495873n,
  ],
  templateRoot: bigint = 13618331910493816144112635202719102044017718006809336112633915446302833345855n,
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
    "initialize(uint256,uint256[],uint256,uint256,address,address,bytes2)",
    [
      nullifierSeed,
      publicKeyHashes,
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
