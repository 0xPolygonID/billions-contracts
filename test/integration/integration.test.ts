import { expect } from "chai";
import { deploySystemFixtures } from "../utils/deployment";
import { DeployedActors } from "../utils/types";
import { ethers } from "hardhat";
import {
  DscVerifierId,
  CIRCUIT_CONSTANTS,
} from "../../../passport-circuits/utils/constants/constants";
import { generateCredentialProof, generateDscProof, generateSignatureProof } from "../utils/generateProof";
import { generateRandomFieldElement } from "../utils/utils";
import { TransactionReceipt, ZeroAddress } from "ethers";
import { LeanIMT } from "@openpassport/zk-kit-lean-imt";
import { Poseidon } from '@iden3/js-crypto';

describe("Commitment Registration Tests", function () {
  this.timeout(0);

  let deployedActors: DeployedActors;
  let snapshotId: string;
  let baseDscProof: any;
  let baseSignatureProof: any;
  let baseCredentialProof: any;
  let dscProof: any;
  let signatureProof: any;
  let credentialProof: any;
  let signatureSecret: any;

  before(async () => {
    deployedActors = await deploySystemFixtures();
    signatureSecret = generateRandomFieldElement();
    baseCredentialProof = await generateCredentialProof(
      deployedActors.mockPassport
    );
    baseSignatureProof = await generateSignatureProof(deployedActors.mockPassport);
    baseDscProof = await generateDscProof(deployedActors.mockPassport.dsc);
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  beforeEach(async () => {
    dscProof = structuredClone(baseDscProof);
    signatureProof = structuredClone(baseSignatureProof);
    credentialProof = structuredClone(baseCredentialProof);
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  describe("Register Commitment", () => {
    describe("Initialization", () => {
      it("should have consistent addresses between registry, hub and passport credential issuer", async () => {
        const { hub, registry, passportCredentialIssuer } = deployedActors;

        expect(await registry.hub()).to.equal(hub.target);
        expect(await hub.registry()).to.equal(registry.target);
        expect(await passportCredentialIssuer.getRegistry()).to.equal(
          registry.target
        );
      });
    });

    describe("Register DSC Pubkey", async () => {
      it("Should register DSC key commitment successfully", async () => {
        const { hub, registry } = deployedActors;

        const previousRoot = await registry.getDscKeyCommitmentMerkleRoot();
        const previousSize = await registry.getDscKeyCommitmentTreeSize();
        const tx = await hub.registerDscKeyCommitment(
          DscVerifierId.dsc_sha256_rsa_65537_4096,
          dscProof
        );

        const hashFunction = (a: bigint, b: bigint) => Poseidon.spongeHashX([a, b], 2);
        const imt = new LeanIMT<bigint>(hashFunction);
        await imt.insert(
          BigInt(dscProof.pubSignals[CIRCUIT_CONSTANTS.DSC_TREE_LEAF_INDEX])
        );

        const receipt = (await tx.wait()) as TransactionReceipt;
        const event = receipt?.logs.find(
          (log) =>
            log.topics[0] ===
            registry.interface.getEvent("DscKeyCommitmentRegistered").topicHash
        );
        const eventArgs = event
          ? registry.interface.decodeEventLog(
              "DscKeyCommitmentRegistered",
              event.data,
              event.topics
            )
          : null;

        const blockTimestamp = (await ethers.provider.getBlock(
          receipt.blockNumber
        ))!.timestamp;
        const currentRoot = await registry.getDscKeyCommitmentMerkleRoot();
        const index = await registry.getDscKeyCommitmentIndex(
          dscProof.pubSignals[CIRCUIT_CONSTANTS.DSC_TREE_LEAF_INDEX]
        );

        expect(eventArgs?.commitment).to.equal(
          dscProof.pubSignals[CIRCUIT_CONSTANTS.DSC_TREE_LEAF_INDEX]
        );
        expect(eventArgs?.timestamp).to.equal(blockTimestamp);
        expect(eventArgs?.imtRoot).to.equal(currentRoot);
        expect(eventArgs?.imtIndex).to.equal(index);

        // Check state
        expect(currentRoot).to.not.equal(previousRoot);
        expect(currentRoot).to.be.equal(imt.root);
        expect(await registry.getDscKeyCommitmentTreeSize()).to.equal(
          previousSize + 1n
        );
        expect(
          await registry.getDscKeyCommitmentIndex(
            dscProof.pubSignals[CIRCUIT_CONSTANTS.DSC_TREE_LEAF_INDEX]
          )
        ).to.equal(index);
        expect(
          await registry.isRegisteredDscKeyCommitment(
            dscProof.pubSignals[CIRCUIT_CONSTANTS.DSC_TREE_LEAF_INDEX]
          )
        ).to.equal(true);
      });

      it("Should fail when called by proxy address", async () => {
        const { hubImpl } = deployedActors;
        await expect(
          hubImpl.registerDscKeyCommitment(
            DscVerifierId.dsc_sha256_rsa_65537_4096,
            dscProof
          )
        ).to.be.revertedWithCustomError(hubImpl, "UUPSUnauthorizedCallContext");
      });

      it("Should fail when the verifier is not set", async () => {
        const { hub } = deployedActors;
        await expect(
          hub.registerDscKeyCommitment(
            DscVerifierId.dsc_sha1_rsa_65537_4096,
            dscProof
          )
        ).to.be.revertedWithCustomError(hub, "NO_VERIFIER_SET");
      });

      it("Should fail when the csca root is invalid", async () => {
        const { hub } = deployedActors;
        dscProof.pubSignals[CIRCUIT_CONSTANTS.DSC_CSCA_ROOT_INDEX] =
          generateRandomFieldElement();
        await expect(
          hub.registerDscKeyCommitment(
            DscVerifierId.dsc_sha256_rsa_65537_4096,
            dscProof
          )
        ).to.be.revertedWithCustomError(hub, "INVALID_CSCA_ROOT");
      });

      it("Should fail when the proof is invalid", async () => {
        const { hub } = deployedActors;
        dscProof.a[0] = generateRandomFieldElement();
        await expect(
          hub.registerDscKeyCommitment(
            DscVerifierId.dsc_sha256_rsa_65537_4096,
            dscProof
          )
        ).to.be.revertedWithCustomError(hub, "INVALID_DSC_PROOF");
      });

      it("Should fail when registerDscKeyCommitment is called directly on implementation", async () => {
        const { registryImpl } = deployedActors;
        await expect(
          registryImpl.registerDscKeyCommitment(generateRandomFieldElement())
        ).to.be.revertedWithCustomError(
          registryImpl,
          "UUPSUnauthorizedCallContext"
        );
      });

      it("Should fail when the registerDscKeyCommitment is called by non-hub address", async () => {
        const { registry, dscVerifier, owner } = deployedActors;
        const IdentityVerificationHubImplFactory =
          await ethers.getContractFactory(
            "IdentityVerificationHubImplV1",
            owner
          );
        const hubImpl2 = await IdentityVerificationHubImplFactory.deploy();
        await hubImpl2.waitForDeployment();

        const initializeData = hubImpl2.interface.encodeFunctionData(
          "initialize",
          [
            registry.target,
            [DscVerifierId.dsc_sha256_rsa_65537_4096],
            [dscVerifier.target],
          ]
        );
        const hubFactory = await ethers.getContractFactory(
          "IdentityVerificationHub",
          owner
        );
        const hub2Proxy = await hubFactory.deploy(
          hubImpl2.target,
          initializeData
        );
        await hub2Proxy.waitForDeployment();

        const hub2 = await ethers.getContractAt(
          "IdentityVerificationHubImplV1",
          hub2Proxy.target
        );

        await expect(
          hub2.registerDscKeyCommitment(
            DscVerifierId.dsc_sha256_rsa_65537_4096,
            dscProof
          )
        ).to.be.revertedWithCustomError(registry, "ONLY_HUB_CAN_ACCESS");
      });

      it("should fail registerDscKeyCommitment when hub address is not set", async () => {
        const { hub, registry } = deployedActors;

        await registry.updateHub(ZeroAddress);
        await expect(
          hub.registerDscKeyCommitment(
            DscVerifierId.dsc_sha256_rsa_65537_4096,
            dscProof
          )
        ).to.be.revertedWithCustomError(registry, "HUB_NOT_SET");
      });

      it("should fail when the dsc key commitment is already registered", async () => {
        const { hub, registry } = deployedActors;
        await hub.registerDscKeyCommitment(
          DscVerifierId.dsc_sha256_rsa_65537_4096,
          dscProof
        );
        await expect(
          hub.registerDscKeyCommitment(
            DscVerifierId.dsc_sha256_rsa_65537_4096,
            dscProof
          )
        ).to.be.revertedWithCustomError(registry, "REGISTERED_COMMITMENT");
      });

      it("should fail when getDscKeyCommitmentMerkleRoot is called by non-proxy", async () => {
        const { registryImpl } = deployedActors;
        await expect(
          registryImpl.getDscKeyCommitmentMerkleRoot()
        ).to.be.revertedWithCustomError(
          registryImpl,
          "UUPSUnauthorizedCallContext"
        );
      });

      it("should fail when checkDscKeyCommitmentMerkleRoot is called by non-proxy", async () => {
        const { registryImpl } = deployedActors;
        const root = generateRandomFieldElement();
        await expect(
          registryImpl.checkDscKeyCommitmentMerkleRoot(root)
        ).to.be.revertedWithCustomError(
          registryImpl,
          "UUPSUnauthorizedCallContext"
        );
      });

      it("should fail when getDscKeyCommitmentTreeSize is called by non-proxy", async () => {
        const { registryImpl } = deployedActors;
        await expect(
          registryImpl.getDscKeyCommitmentTreeSize()
        ).to.be.revertedWithCustomError(
          registryImpl,
          "UUPSUnauthorizedCallContext"
        );
      });

      it("should fail when getDscKeyCommitmentIndex is called by non-proxy", async () => {
        const { registryImpl } = deployedActors;
        const commitment = generateRandomFieldElement();
        await expect(
          registryImpl.getDscKeyCommitmentIndex(commitment)
        ).to.be.revertedWithCustomError(
          registryImpl,
          "UUPSUnauthorizedCallContext"
        );
      });

      it("should fail when registerDscKeyCommitment is called by non-proxy address", async () => {
        const { hubImpl } = deployedActors;
        await expect(
          hubImpl.registerDscKeyCommitment(
            DscVerifierId.dsc_sha256_rsa_65537_4096,
            dscProof
          )
        ).to.be.revertedWithCustomError(hubImpl, "UUPSUnauthorizedCallContext");
      });
    });
  });

  describe("Verify passport", async () => {
    it("Should veify passport successfully", async () => {
      const { passportCredentialIssuer } = deployedActors;

      const credentialCircuitId = "credential_sha256";
      const signatureCircuitId = "signature_sha256_sha256_sha256_rsa_65537_4096";  

      await passportCredentialIssuer.verifyPassportCredential(credentialCircuitId, credentialProof, signatureCircuitId, signatureProof);
    });
  });
});
