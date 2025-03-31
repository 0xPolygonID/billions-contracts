import { expect } from "chai";
import { deploySystemFixtures } from "../utils/deployment";
import { DeployedActors } from "../utils/types";
import { ethers } from "hardhat";

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
      const {
        passportCredentialIssuer,
        registry,
        signatureVerifier,
        credentialVerifier,
        expirationTime,
        templateRoot,
      } = deployedActors;

      // Check initial state
      expect(await passportCredentialIssuer.getRegistry()).to.equal(registry.target);
      expect(await passportCredentialIssuer.getExpirationTime()).to.equal(expirationTime);
      expect(await passportCredentialIssuer.getTemplateRoot()).to.equal(templateRoot);

      const credentialCircuitId = "credential_sha256";
      expect(await passportCredentialIssuer.credentialVerifiers(credentialCircuitId)).to.equal(
        credentialVerifier.target,
      );
      const signatureCircuitId = "signature_sha1_sha256_sha256_rsa_65537_4096";
      expect(await passportCredentialIssuer.signatureVerifiers(signatureCircuitId)).to.equal(
        signatureVerifier.target,
      );
    });

    it("should not allow direct initialization of hub implementation", async () => {
      const { owner, registry, state, idType, identityLib } = deployedActors;

      const PassportCredentialIssuerImplFactory = await ethers.getContractFactory(
        "PassportCredentialIssuerImplV1",
        {
          libraries: {
            IdentityLib: identityLib.target,
          },
        },
        owner,
      );
      const passportCredentialIssuerImpl = await PassportCredentialIssuerImplFactory.deploy();

      await expect(
        passportCredentialIssuerImpl.initializeIssuer(
          0,
          0,
          registry.target,
          [],
          [],
          [],
          [],
          state.target,
          idType,
        ),
      ).to.be.revertedWithCustomError(passportCredentialIssuerImpl, "InvalidInitialization");
    });

    it("should revert when Credential circuit verifier arrays length mismatch", async () => {
      const { owner, registry, state, idType, identityLib } = deployedActors;

      const PassportCredentialIssuerImplFactory = await ethers.getContractFactory(
        "PassportCredentialIssuerImplV1",
        {
          libraries: {
            IdentityLib: identityLib.target,
          },
        },
        owner,
      );
      const passportCredentialIssuerImpl = await PassportCredentialIssuerImplFactory.deploy();
      await passportCredentialIssuerImpl.waitForDeployment();

      let initializeData = passportCredentialIssuerImpl.interface.encodeFunctionData(
        "initializeIssuer",
        [0, 0, registry.target, ["1"], [], [], [], state.target, idType],
      );
      const passportCredentialIssuerProxyFactory = await ethers.getContractFactory(
        "PassportCredentialIssuer",
        owner,
      );

      await expect(
        passportCredentialIssuerProxyFactory.deploy(
          passportCredentialIssuerImpl.target,
          initializeData,
        ),
      )
        .to.be.revertedWithCustomError(passportCredentialIssuerImpl, "LengthMismatch")
        .withArgs(1, 0);

      initializeData = passportCredentialIssuerImpl.interface.encodeFunctionData(
        "initializeIssuer",
        [0, 0, registry.target, [], [], ["1", "2"], [], state.target, idType],
      );
      await expect(
        passportCredentialIssuerProxyFactory.deploy(
          passportCredentialIssuerImpl.target,
          initializeData,
        ),
      )
        .to.be.revertedWithCustomError(passportCredentialIssuerImpl, "LengthMismatch")
        .withArgs(2, 0);
    });

    it("should not allow initialization after initialized", async () => {
      const { passportCredentialIssuer, registry, state, idType } = deployedActors;

      await expect(
        passportCredentialIssuer.initializeIssuer(
          0,
          0,
          registry.target,
          [],
          [],
          [],
          [],
          state.target,
          idType,
        ),
      ).to.be.revertedWithCustomError(passportCredentialIssuer, "InvalidInitialization");
    });
  });

  describe("Update functions", () => {
    it("should update registry address", async () => {
      const { passportCredentialIssuer, user1 } = deployedActors;
      const newRegistryAddress = await user1.getAddress();

      await expect(passportCredentialIssuer.setRegistry(newRegistryAddress))
        .to.emit(passportCredentialIssuer, "RegistryUpdated")
        .withArgs(newRegistryAddress);

      expect(await passportCredentialIssuer.getRegistry()).to.equal(newRegistryAddress);
    });

    it("should not update registry address if caller is not owner", async () => {
      const { passportCredentialIssuer, user1 } = deployedActors;
      const newRegistryAddress = await user1.getAddress();

      await expect(
        passportCredentialIssuer.connect(user1).setRegistry(newRegistryAddress),
      ).to.be.revertedWithCustomError(passportCredentialIssuer, "OwnableUnauthorizedAccount");
    });

    it("should not update registry address if caller is not proxy", async () => {
      const { passportCredentialIssuerImpl, user1 } = deployedActors;
      const newRegistryAddress = await user1.getAddress();

      await expect(
        passportCredentialIssuerImpl.setRegistry(newRegistryAddress),
      ).to.be.revertedWithCustomError(passportCredentialIssuerImpl, "UUPSUnauthorizedCallContext");
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

    it("should not update expiration time if caller is not proxy", async () => {
      const { passportCredentialIssuerImpl, user1 } = deployedActors;
      const newExpirationTime = 60 * 60;

      await expect(
        passportCredentialIssuerImpl.setExpirationTime(newExpirationTime),
      ).to.be.revertedWithCustomError(passportCredentialIssuerImpl, "UUPSUnauthorizedCallContext");
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

    it("should not update expiration time if caller is not proxy", async () => {
      const { passportCredentialIssuerImpl } = deployedActors;
      const newTemplateRoot = 10;

      await expect(
        passportCredentialIssuerImpl.setTemplateRoot(newTemplateRoot),
      ).to.be.revertedWithCustomError(passportCredentialIssuerImpl, "UUPSUnauthorizedCallContext");
    });


    it("should update credential verifier", async () => {
      const { passportCredentialIssuer, user1 } = deployedActors;
      const credentialCircuitIds = ["1", "2"];
      const newVerifierAddresses = [await user1.getAddress(), await user1.getAddress()];

      await expect(
        passportCredentialIssuer.updateCredentialVerifiers(
          credentialCircuitIds,
          newVerifierAddresses,
        ),
      )
        .to.emit(passportCredentialIssuer, "CredentialCircuitVerifierUpdated")
        .withArgs(credentialCircuitIds[0], newVerifierAddresses[0])
        .to.emit(passportCredentialIssuer, "CredentialCircuitVerifierUpdated")
        .withArgs(credentialCircuitIds[1], newVerifierAddresses[1]);

      for (let i = 0; i < credentialCircuitIds.length; i++) {
        expect(
          await passportCredentialIssuer.credentialVerifiers(credentialCircuitIds[i]),
        ).to.equal(newVerifierAddresses[i]);
      }
    });

    it("should update signature verifier", async () => {
      const { passportCredentialIssuer, user1 } = deployedActors;
      const signatureCircuitIds = ["1", "2"];
      const newVerifierAddresses = [await user1.getAddress(), await user1.getAddress()];

      await expect(
        passportCredentialIssuer.updateSignatureVerifiers(
          signatureCircuitIds,
          newVerifierAddresses,
        ),
      )
        .to.emit(passportCredentialIssuer, "SignatureCircuitVerifierUpdated")
        .withArgs(signatureCircuitIds[0], newVerifierAddresses[0])
        .to.emit(passportCredentialIssuer, "SignatureCircuitVerifierUpdated")
        .withArgs(signatureCircuitIds[1], newVerifierAddresses[1]);

      for (let i = 0; i < signatureCircuitIds.length; i++) {
        expect(await passportCredentialIssuer.signatureVerifiers(signatureCircuitIds[i])).to.equal(
          newVerifierAddresses[i],
        );
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

    it("should not update signature verifier if caller is not owner", async () => {
      const { passportCredentialIssuer, user1 } = deployedActors;
      const signatureCircuitId = "1";
      const newVerifierAddress = await user1.getAddress();

      await expect(
        passportCredentialIssuer
          .connect(user1)
          .updateSignatureVerifiers([signatureCircuitId], [newVerifierAddress]),
      ).to.be.revertedWithCustomError(passportCredentialIssuer, "OwnableUnauthorizedAccount");
    });

    it("should not update credential verifier if caller is not proxy", async () => {
      const { passportCredentialIssuerImpl, user1 } = deployedActors;
      const credentialCircuitId = "1";
      const newVerifierAddress = await user1.getAddress();

      await expect(
        passportCredentialIssuerImpl
          .connect(user1)
          .updateCredentialVerifiers([credentialCircuitId], [newVerifierAddress]),
      ).to.be.revertedWithCustomError(passportCredentialIssuerImpl, "UUPSUnauthorizedCallContext");
    });

    it("should not update signature verifier if caller is not proxy", async () => {
      const { passportCredentialIssuerImpl, user1 } = deployedActors;
      const signatureCircuitId = "1";
      const newVerifierAddress = await user1.getAddress();

      await expect(
        passportCredentialIssuerImpl
          .connect(user1)
          .updateSignatureVerifiers([signatureCircuitId], [newVerifierAddress]),
      ).to.be.revertedWithCustomError(passportCredentialIssuerImpl, "UUPSUnauthorizedCallContext");
    });
  });
});
