import { expect } from "chai";
import { deploySystemFixtures } from "../utils/deployment";
import { DeployedActors } from "../utils/types";
import { ethers } from "hardhat";
import { generateCredentialProof } from "../utils/generateProof";
import {
  packSignedPassportData,
  packZKProof,
  PassportDataStruct,
  prepareProof,
} from "../utils/packData";
import {
  byteToHexNibbles,
  getPassportSignatureInfos,
} from "../../../passport-circuits/utils/passports/passport";

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
      const { passportCredentialIssuer, mockPassport, user1 } = deployedActors;

      const { pubKey } = getPassportSignatureInfos(mockPassport);

      const signedPassportData: PassportDataStruct = {
        publicKey: ethers.solidityPackedKeccak256(["string[]"], [pubKey]),
        passportHash: ethers.solidityPackedKeccak256(
          ["uint256[]"],
          [byteToHexNibbles(mockPassport.dg1Hash)],
        ),
        linkIdSignature: BigInt(credentialProof.publicSignals[2]),
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

      expect(
        await passportCredentialIssuer.submitZKPResponseV2(
          [{ requestId: credentialRequestId, zkProof: credentialZkProof, data: metadatas }],
          crossChainProofs,
        ),
      ).not.to.be.reverted;
    });

    it("Should not verify passport with invalid signer", async () => {
      const { passportCredentialIssuer, mockPassport, user2 } = deployedActors;

      const { pubKey } = getPassportSignatureInfos(mockPassport);

      const signedPassportData: PassportDataStruct = {
        publicKey: ethers.solidityPackedKeccak256(["string[]"], [pubKey]),
        passportHash: ethers.solidityPackedKeccak256(
          ["uint256[]"],
          [byteToHexNibbles(mockPassport.dg1Hash)],
        ),
        linkIdSignature: BigInt(credentialProof.publicSignals[2]),
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
        .to.revertedWithCustomError(passportCredentialIssuer, "InvalidSigner")
        .withArgs(await user2.getAddress());
    });
  });
});
