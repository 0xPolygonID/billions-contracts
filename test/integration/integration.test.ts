import { expect } from "chai";
import { deploySystemFixtures } from "../utils/deployment";
import { DeployedActors } from "../utils/types";
import { ethers } from "hardhat";
import { generateCredentialProof } from "../utils/generateProof";
import {
  packSignedPassportData,
  packZKProof,
  PassportDataSigned,
  prepareProof,
} from "../utils/packData";
import { base64ToBytes, bytesToHex } from "@0xpolygonid/js-sdk";
import jsonAttestationWithUserData from "../data/TEEAttestationWithUserData.json";

const imageHash = "0xb46a627218ca4511d9d55c64181dcdd465c3c44822ee1610c4fab0e7a5ba9997";

describe("Commitment Registration Tests", function () {
  this.timeout(0);

  let deployedActors: DeployedActors;
  let snapshotId: string;
  let baseCredentialProof: any;
  let credentialProof: any;

  before(async () => {
    deployedActors = await deploySystemFixtures();

    baseCredentialProof = await generateCredentialProof(deployedActors.mockPassport);
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  beforeEach(async () => {
    credentialProof = structuredClone(baseCredentialProof);
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  describe("Verify passport", async () => {
    it("Should verify passport successfully", async () => {
      const { passportCredentialIssuer, user1 } = deployedActors;

      await expect(passportCredentialIssuer.addImageHashToWhitelist(imageHash)).not.to.be.reverted;

      await passportCredentialIssuer.addSigner(
        `0x${bytesToHex(base64ToBytes(jsonAttestationWithUserData.attestation))}`,
      );

      const signedPassportData: PassportDataSigned = {
        linkId: BigInt(credentialProof.publicSignals[2]),
        nullifier: 1n,
      };

      const crossChainProofs = await packSignedPassportData(
        signedPassportData,
        passportCredentialIssuer,
        user1,
      );
      const metadatas = "0x";

      const credentialPreparedProof = prepareProof(credentialProof.proof);

      const credentialZkProof = packZKProof(
        credentialProof.publicSignals,
        credentialPreparedProof.pi_a,
        credentialPreparedProof.pi_b,
        credentialPreparedProof.pi_c,
      );

      const credentialRequestId =
        await passportCredentialIssuer.credentialCircuitIdToRequestIds("credential_sha256");

      expect(await passportCredentialIssuer.nullifierExists(signedPassportData.nullifier)).to.be
        .false;
      expect(
        await passportCredentialIssuer.submitZKPResponseV2(
          [{ requestId: credentialRequestId, zkProof: credentialZkProof, data: metadatas }],
          crossChainProofs,
        ),
      ).not.to.be.reverted;
      expect(await passportCredentialIssuer.nullifierExists(signedPassportData.nullifier)).to.be
        .true;
    });

    it("Should not verify passport with invalid signer", async () => {
      const { passportCredentialIssuer, user2 } = deployedActors;

      const signedPassportData: PassportDataSigned = {
        linkId: BigInt(credentialProof.publicSignals[2]),
        nullifier: 1n,
      };

      const crossChainProofs = await packSignedPassportData(
        signedPassportData,
        passportCredentialIssuer,
        user2,
      );
      const metadatas = "0x";

      const credentialPreparedProof = prepareProof(credentialProof.proof);

      const credentialZkProof = packZKProof(
        credentialProof.publicSignals,
        credentialPreparedProof.pi_a,
        credentialPreparedProof.pi_b,
        credentialPreparedProof.pi_c,
      );

      const credentialRequestId =
        await passportCredentialIssuer.credentialCircuitIdToRequestIds("credential_sha256");

      await expect(
        passportCredentialIssuer.submitZKPResponseV2(
          [{ requestId: credentialRequestId, zkProof: credentialZkProof, data: metadatas }],
          crossChainProofs,
        ),
      )
        .to.revertedWithCustomError(passportCredentialIssuer, "InvalidSignerPassportSignatureProof")
        .withArgs(await user2.getAddress());
    });
  });
});
