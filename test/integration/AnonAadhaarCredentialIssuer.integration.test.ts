import { expect } from "chai";
import { deployAnonAadhaarIssuerFixtures } from "../utils/deployment";
import { DeployedActorsAnonAadhaar } from "../utils/types";
import { ethers } from "hardhat";
import { packZKProof, prepareProof } from "../utils/packData";
import scope from "./assets/anonAadhaarProof.json";

describe("Anon aadhaar credential issuer", function () {
  this.timeout(0);

  let deployedActors: DeployedActorsAnonAadhaar;
  let snapshotId: string;
  let anonAadhaarProof: any;

  before(async () => {
    deployedActors = await deployAnonAadhaarIssuerFixtures();

    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  beforeEach(async () => {
    anonAadhaarProof = structuredClone(scope);
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  describe("Verify anon aadhaar", async () => {
    it("Should verify passport successfully", async () => {
      const { anonAadhaarIssuer, user1 } = deployedActors;

      const metadatas = "0x";

      const credentialPreparedProof = prepareProof(anonAadhaarProof.proof);

      const credentialZkProof = packZKProof(
        anonAadhaarProof.pub_signals,
        credentialPreparedProof.pi_a,
        credentialPreparedProof.pi_b,
        credentialPreparedProof.pi_c,
      );

      expect(
        await anonAadhaarIssuer.submitZKPResponseV2(
          [{ requestId: 0, zkProof: credentialZkProof, data: metadatas }],
          "0x",
        ),
      ).not.to.be.reverted;

      // Get proof from the contract
      const proof = anonAadhaarIssuer.getClaimProof(anonAadhaarProof.pub_signals[2]);
      expect((await proof).existence).to.be.equal(true);

      // Check nullifier
      await expect(
        anonAadhaarIssuer.submitZKPResponseV2(
          [{ requestId: 0, zkProof: credentialZkProof, data: metadatas }],
          "0x",
        ),
      ).to.be.revertedWithCustomError(anonAadhaarIssuer, "NullifierAlreadyExists");
    });
  });
});
