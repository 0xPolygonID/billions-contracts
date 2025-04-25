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

describe("Commitment Registration Tests", function () {
  this.timeout(0);

  let deployedActors: DeployedActors;
  let snapshotId: string;
  let baseCredentialProof: any;
  let credentialProof: any;
  let baseCredentialProofCurrentDateExpired: any;
  let credentialProofCurrentDateExpired: any;
  let baseCredentialProofIssuanceDateExpired: any;
  let credentialProofIssuanceDateExpired: any;
  let currentDateExpiredFormatted: number;
  let issuanceDateExpired: Date;

  before(async () => {
    deployedActors = await deploySystemFixtures();

    baseCredentialProof = await generateCredentialProof(deployedActors.mockPassport);
    const currentDateExpired = new Date();
    currentDateExpired.setDate(currentDateExpired.getDate() - 10);
    baseCredentialProofCurrentDateExpired = await generateCredentialProof(
      deployedActors.mockPassport,
      currentDateExpired,
    );
    currentDateExpiredFormatted = Math.floor(
      (currentDateExpired.getFullYear() - 2000) * 10000 +
        (currentDateExpired.getMonth() + 1) * 100 +
        currentDateExpired.getDate(),
    );

    issuanceDateExpired = new Date();
    issuanceDateExpired.setDate(issuanceDateExpired.getDate() - 370);
    baseCredentialProofIssuanceDateExpired = await generateCredentialProof(
      deployedActors.mockPassport,
      new Date(),
      issuanceDateExpired,
    );

    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  beforeEach(async () => {
    credentialProof = structuredClone(baseCredentialProof);
    credentialProofCurrentDateExpired = structuredClone(baseCredentialProofCurrentDateExpired);
    credentialProofIssuanceDateExpired = structuredClone(baseCredentialProofIssuanceDateExpired);
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  describe("Verify passport", async () => {
    it("Should verify passport successfully", async () => {
      const { passportCredentialIssuer, user1 } = deployedActors;

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
      await expect(
        passportCredentialIssuer.submitZKPResponseV2(
          [{ requestId: credentialRequestId, zkProof: credentialZkProof, data: metadatas }],
          crossChainProofs,
        ),
      ).not.to.be.reverted;
      expect(await passportCredentialIssuer.nullifierExists(signedPassportData.nullifier)).to.be
        .true;

      // Check nullifier
      await expect(
        passportCredentialIssuer.submitZKPResponseV2(
          [{ requestId: credentialRequestId, zkProof: credentialZkProof, data: metadatas }],
          crossChainProofs,
        ),
      ).to.be.revertedWithCustomError(passportCredentialIssuer, "NullifierAlreadyExists");
    });

    it("Should not verify with passport current date expired", async () => {
      const { passportCredentialIssuer, user1 } = deployedActors;

      const signedPassportData: PassportDataSigned = {
        linkId: BigInt(credentialProofCurrentDateExpired.publicSignals[2]),
        nullifier: 1n,
      };

      const crossChainProofs = await packSignedPassportData(
        signedPassportData,
        passportCredentialIssuer,
        user1,
      );
      const metadatas = "0x";

      const credentialPreparedProof = prepareProof(credentialProofCurrentDateExpired.proof);

      const credentialZkProof = packZKProof(
        credentialProofCurrentDateExpired.publicSignals,
        credentialPreparedProof.pi_a,
        credentialPreparedProof.pi_b,
        credentialPreparedProof.pi_c,
      );

      const credentialRequestId =
        await passportCredentialIssuer.credentialCircuitIdToRequestIds("credential_sha256");

      expect(await passportCredentialIssuer.nullifierExists(signedPassportData.nullifier)).to.be
        .false;
      await expect(
        passportCredentialIssuer.submitZKPResponseV2(
          [{ requestId: credentialRequestId, zkProof: credentialZkProof, data: metadatas }],
          crossChainProofs,
        ),
      )
        .to.be.revertedWithCustomError(passportCredentialIssuer, "CurrentDateExpired")
        .withArgs(currentDateExpiredFormatted);
    });

    it("Should not verify with passport issuance date expired", async () => {
      const { passportCredentialIssuer, user1 } = deployedActors;

      const signedPassportData: PassportDataSigned = {
        linkId: BigInt(credentialProofIssuanceDateExpired.publicSignals[2]),
        nullifier: 1n,
      };

      const crossChainProofs = await packSignedPassportData(
        signedPassportData,
        passportCredentialIssuer,
        user1,
      );
      const metadatas = "0x";

      const credentialPreparedProof = prepareProof(credentialProofIssuanceDateExpired.proof);

      const credentialZkProof = packZKProof(
        credentialProofIssuanceDateExpired.publicSignals,
        credentialPreparedProof.pi_a,
        credentialPreparedProof.pi_b,
        credentialPreparedProof.pi_c,
      );

      const credentialRequestId =
        await passportCredentialIssuer.credentialCircuitIdToRequestIds("credential_sha256");

      expect(await passportCredentialIssuer.nullifierExists(signedPassportData.nullifier)).to.be
        .false;
      await expect(
        passportCredentialIssuer.submitZKPResponseV2(
          [{ requestId: credentialRequestId, zkProof: credentialZkProof, data: metadatas }],
          crossChainProofs,
        ),
      )
        .to.be.revertedWithCustomError(passportCredentialIssuer, "IssuanceDateExpired")
        .withArgs(Math.round(issuanceDateExpired.getTime() / 1000));
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
