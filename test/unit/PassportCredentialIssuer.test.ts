import { expect } from "chai";
import { deploySystemFixtures } from "../utils/deployment";
import { DeployedActors } from "../utils/types";
import { ethers, ignition } from "hardhat";
import UpgradedPassportCredentialIssuerModule from "../../ignition/modules/passportCredentialIssuer/upgradePassportCredentialIssuer";

describe("Unit Tests for PassportCredentialIssuer", () => {
  let deployedActors: DeployedActors;
  let snapshotId: string;

  before(async () => {
    deployedActors = await deploySystemFixtures();
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  describe("Initialization", () => {
    it("should initialize Passport Credential Issuer with correct parameters", async () => {
      const { passportCredentialIssuer, credentialVerifier, expirationTime, templateRoot, user1 } =
        deployedActors;

      // Check initial state
      expect(await passportCredentialIssuer.getExpirationTime()).to.equal(expirationTime);
      expect(await passportCredentialIssuer.getTemplateRoot()).to.equal(templateRoot);

      const credentialCircuitId = "credential_sha256";
      expect(await passportCredentialIssuer.credentialVerifiers(credentialCircuitId)).to.equal(
        credentialVerifier.target,
      );

      expect(await passportCredentialIssuer.getSigners()).to.deep.equal([await user1.getAddress()]);

      expect(
        await passportCredentialIssuer.credentialCircuitIdToRequestIds(credentialCircuitId),
      ).to.equal(1);
      expect(await passportCredentialIssuer.credentialRequestIdToCircuitIds(1)).to.equal(
        credentialCircuitId,
      );
    });

    it("should not allow direct initialization of PassportCredentialIssuer implementation", async () => {
      const { owner, state, idType, identityLib } = deployedActors;

      const PassportCredentialIssuerFactory = await ethers.getContractFactory(
        "PassportCredentialIssuer",
        {
          libraries: {
            IdentityLib: identityLib.target,
          },
        },
        owner,
      );
      const passportCredentialIssuer = await PassportCredentialIssuerFactory.deploy();

      await expect(
        passportCredentialIssuer.initialize(
          0,
          0,
          [],
          [],
          [],
          state.target,
          idType,
          await owner.getAddress(),
        ),
      ).to.be.revertedWithCustomError(passportCredentialIssuer, "InvalidInitialization");
    });
    
    it("should not allow initialization after initialized", async () => {
      const { passportCredentialIssuer, state, idType, owner } = deployedActors;

      await expect(
        passportCredentialIssuer.initialize(
          0,
          0,
          [],
          [],
          [],
          state.target,
          idType,
          await owner.getAddress(),
        ),
      ).to.be.revertedWithCustomError(passportCredentialIssuer, "InvalidInitialization");
    });
  });

  describe("Update functions", () => {
    it("should add signers", async () => {
      const { passportCredentialIssuer, user1, user2 } = deployedActors;

      await expect(passportCredentialIssuer.addSigners([await user2.getAddress()]))
        .to.emit(passportCredentialIssuer, "SignerAdded")
        .withArgs(await user2.getAddress());

      expect(await passportCredentialIssuer.getSigners()).to.deep.equal([
        await user1.getAddress(),
        await user2.getAddress(),
      ]);
    });

    it("should not add signer if caller is not owner", async () => {
      const { passportCredentialIssuer, user1, user2 } = deployedActors;

      await expect(
        passportCredentialIssuer.connect(user1).addSigners([await user2.getAddress()]),
      ).to.be.revertedWithCustomError(passportCredentialIssuer, "OwnableUnauthorizedAccount");
    });

    it("should update expiration time", async () => {
      const { passportCredentialIssuer, user1 } = deployedActors;
      const newExpirationTime = 60 * 60;

      await expect(passportCredentialIssuer.setExpirationTime(newExpirationTime))
        .to.emit(passportCredentialIssuer, "ExpirationTimeUpdated")
        .withArgs(newExpirationTime);

      expect(await passportCredentialIssuer.getExpirationTime()).to.equal(newExpirationTime);
    });

    it("should not update expiration time if caller is not owner", async () => {
      const { passportCredentialIssuer, user1 } = deployedActors;
      const newExpirationTime = 60 * 60;

      await expect(
        passportCredentialIssuer.connect(user1).setExpirationTime(newExpirationTime),
      ).to.be.revertedWithCustomError(passportCredentialIssuer, "OwnableUnauthorizedAccount");
    });

    it("should update template root time", async () => {
      const { passportCredentialIssuer } = deployedActors;
      const newTemplateRoot = 10;

      await expect(passportCredentialIssuer.setTemplateRoot(newTemplateRoot))
        .to.emit(passportCredentialIssuer, "TemplateRootUpdated")
        .withArgs(newTemplateRoot);

      expect(await passportCredentialIssuer.getTemplateRoot()).to.equal(newTemplateRoot);
    });

    it("should not update template root if caller is not owner", async () => {
      const { passportCredentialIssuer, user1 } = deployedActors;
      const newTemplateRoot = 10;

      await expect(
        passportCredentialIssuer.connect(user1).setTemplateRoot(newTemplateRoot),
      ).to.be.revertedWithCustomError(passportCredentialIssuer, "OwnableUnauthorizedAccount");
    });

    it("should update credential verifier", async () => {
      const { passportCredentialIssuer, user1 } = deployedActors;
      const credentialCircuitIds = ["1", "2"];
      const newVerifierAddresses = [await user1.getAddress(), await user1.getAddress()];

      const lastRequestId = 1;

      await expect(
        passportCredentialIssuer.updateCredentialVerifiers(
          credentialCircuitIds,
          newVerifierAddresses,
        ),
      )
        .to.emit(passportCredentialIssuer, "CredentialCircuitVerifierUpdated")
        .withArgs(credentialCircuitIds[0], newVerifierAddresses[0], lastRequestId + 1)
        .to.emit(passportCredentialIssuer, "CredentialCircuitVerifierUpdated")
        .withArgs(credentialCircuitIds[1], newVerifierAddresses[1], lastRequestId + 2);

      for (let i = 0; i < credentialCircuitIds.length; i++) {
        expect(
          await passportCredentialIssuer.credentialVerifiers(credentialCircuitIds[i]),
        ).to.equal(newVerifierAddresses[i]);
        expect(
          await passportCredentialIssuer.credentialCircuitIdToRequestIds(credentialCircuitIds[i]),
        ).to.equal(lastRequestId + i + 1);
        expect(
          await passportCredentialIssuer.credentialRequestIdToCircuitIds(lastRequestId + i + 1),
        ).to.equal(credentialCircuitIds[i]);
      }
    });

    it("should not update credential verifier if caller is not owner", async () => {
      const { passportCredentialIssuer, user1 } = deployedActors;
      const credentialCircuitId = "1";
      const newVerifierAddress = await user1.getAddress();

      await expect(
        passportCredentialIssuer
          .connect(user1)
          .updateCredentialVerifiers([credentialCircuitId], [newVerifierAddress]),
      ).to.be.revertedWithCustomError(passportCredentialIssuer, "OwnableUnauthorizedAccount");
    });
  });

  describe("View functions", () => {
    it("should return correct signer addresses", async () => {
      const { passportCredentialIssuer, user1 } = deployedActors;
      expect(await passportCredentialIssuer.getSigners()).to.deep.equal([await user1.getAddress()]);
    });


    it("should return correct credential circuit verifier address", async () => {
      const { passportCredentialIssuer, credentialVerifier } = deployedActors;
      const credentialCircuitId = "credential_sha256";
      expect(await passportCredentialIssuer.credentialVerifiers(credentialCircuitId)).to.equal(
        credentialVerifier.target,
      );
    });
  });

  describe("Upgradeability", function () {
    it("Should be interactable via proxy", async function () {
      const { passportCredentialIssuer, owner } = deployedActors;

      expect(await passportCredentialIssuer.connect(owner).VERSION()).to.equal("1.0.0");
    });

    it("Should have upgraded the proxy to new PassportCredentialIssuer", async function () {
      const { owner, passportCredentialIssuer: pa } = deployedActors;

      //console.log(await pa.getTemplateRoot());
      // First upgrade works
      const { passportCredentialIssuer } = await ignition.deploy(UpgradedPassportCredentialIssuerModule,
        {
          parameters: {
            PassportCredentialIssuerProxyModule: {
              stateContractAddress: deployedActors.state.target as string,
              idType: deployedActors.idType,
              expirationTime: deployedActors.expirationTime,
              templateRoot: deployedActors.templateRoot,
            },
            IdentityLibModule: {
              poseidon3ElementAddress: deployedActors.poseidon3.target as string,
              poseidon4ElementAddress: deployedActors.poseidon4.target as string,
              smtLibAddress: deployedActors.smtLib.target as string,
            }, 
          },
        },
      );
      // console.log(await passportCredentialIssuer.getTemplateRoot());

      expect(await passportCredentialIssuer.connect(owner).VERSION()).to.equal("1.0.0");
    });
  });
});
