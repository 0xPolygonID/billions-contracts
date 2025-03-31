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

  describe("View functions", () => {
    it("should return correct registry address", async () => {
      const { passportCredentialIssuer, registry } = deployedActors;
      expect(await passportCredentialIssuer.getRegistry()).to.equal(registry.target);
    });

    it("should not return when view function is called by non-proxy", async () => {
      const { passportCredentialIssuerImpl } = deployedActors;
      await expect(passportCredentialIssuerImpl.getRegistry()).to.be.revertedWithCustomError(
        passportCredentialIssuerImpl,
        "UUPSUnauthorizedCallContext",
      );
    });

    it("should return correct credential circuit verifier address", async () => {
      const { passportCredentialIssuer, credentialVerifier } = deployedActors;
      const credentialCircuitId = "credential_sha256";
      expect(await passportCredentialIssuer.credentialVerifiers(credentialCircuitId)).to.equal(
        credentialVerifier.target,
      );
    });

    it("should not return when view function is called by non-proxy", async () => {
      const { passportCredentialIssuerImpl } = deployedActors;
      const credentialCircuitId = "credential_sha256";
      await expect(
        passportCredentialIssuerImpl.credentialVerifiers(credentialCircuitId),
      ).to.be.revertedWithCustomError(passportCredentialIssuerImpl, "UUPSUnauthorizedCallContext");
    });

    it("should return correct signature circuit verifier address", async () => {
      const { passportCredentialIssuer, signatureVerifier } = deployedActors;
      const signatureCircuitId = "signature_sha1_sha256_sha256_rsa_65537_4096";
      expect(await passportCredentialIssuer.signatureVerifiers(signatureCircuitId)).to.equal(
        signatureVerifier.target,
      );
    });

    it("should not return when view function is called by non-proxy", async () => {
      const { passportCredentialIssuerImpl } = deployedActors;
      const signatureCircuitId = "signature_sha1_sha256_sha256_rsa_65537_4096";
      await expect(
        passportCredentialIssuerImpl.signatureVerifiers(signatureCircuitId),
      ).to.be.revertedWithCustomError(passportCredentialIssuerImpl, "UUPSUnauthorizedCallContext");
    });
  });

  describe("Upgradeabilitiy", () => {
    it("should preserve state after upgrade", async () => {
      const { passportCredentialIssuer, owner, identityLib } = deployedActors;

      const credentialCircuitId = "credential_sha256";
      const registryAddressBefore = await passportCredentialIssuer.getRegistry();
      const credentialVerifierAddressBefore =
        await passportCredentialIssuer.credentialVerifiers(credentialCircuitId);

      const PassportIssuerCredentialV2Factory = await ethers.getContractFactory(
        "testUpgradedPassportCredentialIssuerImplV1",
        {
          libraries: {
            IdentityLib: identityLib.target,
          },
        },
        owner,
      );
      const passportCredentialIssuerV2Implementation =
        await PassportIssuerCredentialV2Factory.deploy();
      await passportCredentialIssuerV2Implementation.waitForDeployment();

      const passportCredentialIssuerAsImpl = await ethers.getContractAt(
        "testUpgradedPassportCredentialIssuerImplV1",
        passportCredentialIssuer.target,
      );

      await passportCredentialIssuerAsImpl
        .connect(owner)
        .upgradeToAndCall(
          passportCredentialIssuerV2Implementation.target,
          PassportIssuerCredentialV2Factory.interface.encodeFunctionData("initialize(bool)", [
            true,
          ]),
        );

      const passportCredentialIssuerV2 = await ethers.getContractAt(
        "testUpgradedPassportCredentialIssuerImplV1",
        passportCredentialIssuer.target,
      );

      expect(await passportCredentialIssuerV2.isTest()).to.equal(true);

      expect(await passportCredentialIssuerV2.getRegistry()).to.equal(registryAddressBefore);
      expect(await passportCredentialIssuerV2.credentialVerifiers(credentialCircuitId)).to.equal(
        credentialVerifierAddressBefore,
      );

      const implementationSlot =
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
      const implementationAddress = await ethers.provider.getStorage(
        passportCredentialIssuer.target,
        implementationSlot,
      );
      expect(ethers.zeroPadValue(implementationAddress, 32)).to.equal(
        ethers.zeroPadValue(passportCredentialIssuerV2Implementation.target.toString(), 32),
      );
    });

    it("should not allow non-proxy to upgrade implementation", async () => {
      const { passportCredentialIssuer, passportCredentialIssuerImpl, identityLib, owner } =
        deployedActors;

      const PassportCredentialIssuerV2Factory = await ethers.getContractFactory(
        "testUpgradedPassportCredentialIssuerImplV1",
        {
          libraries: {
            IdentityLib: identityLib.target,
          },
        },
        owner,
      );
      const passportCredentialIssuerV2Implementation =
        await PassportCredentialIssuerV2Factory.deploy();
      await passportCredentialIssuerV2Implementation.waitForDeployment();

      const passportCredentialIssuerAsImpl = await ethers.getContractAt(
        "testUpgradedPassportCredentialIssuerImplV1",
        passportCredentialIssuer.target,
      );

      await expect(
        passportCredentialIssuerImpl
          .connect(owner)
          .upgradeToAndCall(
            passportCredentialIssuerV2Implementation.target,
            PassportCredentialIssuerV2Factory.interface.encodeFunctionData("initialize(bool)", [
              true,
            ]),
          ),
      ).to.be.revertedWithCustomError(
        passportCredentialIssuerAsImpl,
        "UUPSUnauthorizedCallContext",
      );
    });

    it("should not allow non-owner to upgrade implementation", async () => {
      const { passportCredentialIssuer, owner, user1, identityLib } = deployedActors;

      const PassportCredentialIssuerV2Factory = await ethers.getContractFactory(
        "testUpgradedPassportCredentialIssuerImplV1",
        {
          libraries: {
            IdentityLib: identityLib.target,
          },
        },
        owner,
      );
      const passportCredentialIssuerV2Implementation =
        await PassportCredentialIssuerV2Factory.deploy();
      await passportCredentialIssuerV2Implementation.waitForDeployment();

      const passportCredentialIssuerAsImpl = await ethers.getContractAt(
        "testUpgradedPassportCredentialIssuerImplV1",
        passportCredentialIssuer.target,
      );

      await expect(
        passportCredentialIssuerAsImpl
          .connect(user1)
          .upgradeToAndCall(
            passportCredentialIssuerV2Implementation.target,
            PassportCredentialIssuerV2Factory.interface.encodeFunctionData("initialize(bool)", [
              true,
            ]),
          ),
      ).to.be.revertedWithCustomError(passportCredentialIssuerAsImpl, "OwnableUnauthorizedAccount");
    });

    it("should not allow implementation contract to be initialized directly", async () => {
      const { passportCredentialIssuer, owner, identityLib } = deployedActors;

      const PassportCredentialIssuerV2Factory = await ethers.getContractFactory(
        "testUpgradedPassportCredentialIssuerImplV1",
        {
          libraries: {
            IdentityLib: identityLib.target,
          },
        },
        owner,
      );
      const passportCredentialIssuerV2Implementation =
        await PassportCredentialIssuerV2Factory.deploy();
      await passportCredentialIssuerV2Implementation.waitForDeployment();

      await expect(
        passportCredentialIssuerV2Implementation.initialize(true),
      ).to.be.revertedWithCustomError(passportCredentialIssuer, "InvalidInitialization");
    });

    it("should not allow direct calls to implementation contract", async () => {
      const { owner, identityLib } = deployedActors;

      const PassportCredentialIssuerV2Factory = await ethers.getContractFactory(
        "testUpgradedPassportCredentialIssuerImplV1",
        {
          libraries: {
            IdentityLib: identityLib.target,
          },
        },
        owner,
      );
      const passportCredentialIssuerV2Implementation =
        await PassportCredentialIssuerV2Factory.deploy();
      await passportCredentialIssuerV2Implementation.waitForDeployment();

      await expect(passportCredentialIssuerV2Implementation.isTest()).to.be.revertedWithCustomError(
        passportCredentialIssuerV2Implementation,
        "UUPSUnauthorizedCallContext",
      );
    });
  });
});
