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
const imageHash = "0xc980e59163ce244bb4bb6211f48c7b46f88a4f40943e84eb99bdc41e129bd293";

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
      const { passportCredentialIssuer, user1, owner } = deployedActors;

      await expect(passportCredentialIssuer.addImageHashToWhitelist(imageHash)).not.to.be.reverted;
      await expect(passportCredentialIssuer.addTransactor(await owner.getAddress())).not.to.be
        .reverted;

      await expect(passportCredentialIssuer.addSigner(await user1.getAddress()))
        .to.emit(passportCredentialIssuer, "SignerAdded")
        .withArgs(await user1.getAddress());

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

      await passportCredentialIssuer.cleanNullifier(signedPassportData.nullifier);

      expect(await passportCredentialIssuer.nullifierExists(signedPassportData.nullifier)).to.be
        .false;

      await expect(
        passportCredentialIssuer.submitZKPResponseV2(
          [{ requestId: credentialRequestId, zkProof: credentialZkProof, data: metadatas }],
          crossChainProofs,
        ),
      ).to.be.revertedWith("Identity trees haven't changed");
    });

    it("Should not verify with passport current date expired", async () => {
      const { passportCredentialIssuer, user1, owner } = deployedActors;

      await expect(passportCredentialIssuer.addImageHashToWhitelist(imageHash)).not.to.be.reverted;
      await expect(passportCredentialIssuer.addTransactor(await owner.getAddress())).not.to.be
        .reverted;

      await expect(passportCredentialIssuer.addSigner(await user1.getAddress()))
        .to.emit(passportCredentialIssuer, "SignerAdded")
        .withArgs(await user1.getAddress());

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
      const { passportCredentialIssuer, user1, owner } = deployedActors;

      await expect(passportCredentialIssuer.addImageHashToWhitelist(imageHash)).not.to.be.reverted;
      await passportCredentialIssuer.addTransactor(await owner.getAddress());

      await expect(passportCredentialIssuer.addSigner(await user1.getAddress()))
        .to.emit(passportCredentialIssuer, "SignerAdded")
        .withArgs(await user1.getAddress());

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
      const { passportCredentialIssuer, user2, owner } = deployedActors;

      await expect(passportCredentialIssuer.addImageHashToWhitelist(imageHash)).not.to.be.reverted;
      await expect(passportCredentialIssuer.addTransactor(await owner.getAddress())).not.to.be
        .reverted;

      await passportCredentialIssuer.addSigner(await owner.getAddress());

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

    it("Should not verify with passport issuance date in the future", async () => {
      const { passportCredentialIssuer, user1, owner } = deployedActors;

      await expect(passportCredentialIssuer.addImageHashToWhitelist(imageHash)).not.to.be.reverted;
      await expect(passportCredentialIssuer.addTransactor(await owner.getAddress())).not.to.be
        .reverted;

      await expect(passportCredentialIssuer.addSigner(await user1.getAddress()))
        .to.emit(passportCredentialIssuer, "SignerAdded")
        .withArgs(await user1.getAddress());

      const futureIssuanceDate = new Date();
      futureIssuanceDate.setMinutes(futureIssuanceDate.getMinutes() + 20); // Set issuance date 20 minutes in the future

      const baseCredentialProofFutureIssuance = await generateCredentialProof(
        deployedActors.mockPassport,
        new Date(),
        futureIssuanceDate,
      );

      const signedPassportData: PassportDataSigned = {
        linkId: BigInt(baseCredentialProofFutureIssuance.publicSignals[2]),
        nullifier: 1n,
      };

      const crossChainProofs = await packSignedPassportData(
        signedPassportData,
        passportCredentialIssuer,
        user1,
      );
      const metadatas = "0x";

      const credentialPreparedProof = prepareProof(baseCredentialProofFutureIssuance.proof);

      const credentialZkProof = packZKProof(
        baseCredentialProofFutureIssuance.publicSignals,
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
        .to.be.revertedWithCustomError(passportCredentialIssuer, "IssuanceDateInFuture")
        .withArgs(Math.round(futureIssuanceDate.getTime() / 1000));
    });

    it("Should not verify with passport current date in the future", async () => {
      const { passportCredentialIssuer, user1, owner } = deployedActors;

      await expect(passportCredentialIssuer.addImageHashToWhitelist(imageHash)).not.to.be.reverted;
      await expect(passportCredentialIssuer.addTransactor(await owner.getAddress())).not.to.be
        .reverted;

      await expect(passportCredentialIssuer.addSigner(await user1.getAddress()))
        .to.emit(passportCredentialIssuer, "SignerAdded")
        .withArgs(await user1.getAddress());

      const futureCurrentDate = new Date();
      futureCurrentDate.setDate(futureCurrentDate.getDate() + 1); // Set current date to 1 day in the future

      const baseCredentialProofFutureCurrentDate = await generateCredentialProof(
        deployedActors.mockPassport,
        futureCurrentDate,
      );

      const signedPassportData: PassportDataSigned = {
        linkId: BigInt(baseCredentialProofFutureCurrentDate.publicSignals[2]),
        nullifier: 1n,
      };

      const crossChainProofs = await packSignedPassportData(
        signedPassportData,
        passportCredentialIssuer,
        user1,
      );
      const metadatas = "0x";

      const credentialPreparedProof = prepareProof(baseCredentialProofFutureCurrentDate.proof);

      const credentialZkProof = packZKProof(
        baseCredentialProofFutureCurrentDate.publicSignals,
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
        .to.be.revertedWithCustomError(passportCredentialIssuer, "CurrentDateInFuture")
        .withArgs(
          Math.floor(
            (futureCurrentDate.getFullYear() - 2000) * 10000 +
              (futureCurrentDate.getMonth() + 1) * 100 +
              futureCurrentDate.getDate(),
          ),
        );
    });
  });
});
