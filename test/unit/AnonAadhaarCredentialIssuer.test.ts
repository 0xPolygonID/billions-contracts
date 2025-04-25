import { expect } from "chai";
import { deployAnonAadhaarIssuerFixtures } from "../utils/deployment";
import { DeployedActorsAnonAadhaar } from "../utils/types";
import { ethers } from "hardhat";

describe("Unit Tests for AnonAadhaarCredentialIssuerImplV1", () => {
  let deployedActors: DeployedActorsAnonAadhaar;
  let snapshotId: string;

  before(async () => {
    deployedActors = await deployAnonAadhaarIssuerFixtures();
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  describe("Initialization", () => {
    it("should initialize AnonAadhaarCredentialIssuerImplV1 with correct parameters", async () => {
      const { anonAadhaarIssuer, templateRoot, expirationTime, nullifierSeed } = deployedActors;
      expect(await anonAadhaarIssuer.VERSION()).to.equal("1.0.0");
      // Check initial state
      expect(await anonAadhaarIssuer.getExpirationTime()).to.equal(expirationTime);
      expect(await anonAadhaarIssuer.getTemplateRoot()).to.equal(templateRoot);
      expect(await anonAadhaarIssuer.getNullifierSeed()).to.equal(nullifierSeed);
    });
  });

  describe("Update functions", () => {
    it("should update template root time", async () => {
      const { anonAadhaarIssuer } = deployedActors;
      const newTemplateRoot = 10;

      await expect(anonAadhaarIssuer.setTemplateRoot(newTemplateRoot))
        .to.emit(anonAadhaarIssuer, "TemplateRootUpdated")
        .withArgs(newTemplateRoot);

      expect(await anonAadhaarIssuer.getTemplateRoot()).to.equal(newTemplateRoot);
    });

    it("should add public key hash", async () => {
      const { anonAadhaarIssuer } = deployedActors;
      const publicKeyHash = 5;

      await expect(anonAadhaarIssuer.addPublicKeyHash(publicKeyHash))
        .to.emit(anonAadhaarIssuer, "PublicKeyHashAdded")
        .withArgs(publicKeyHash);

      expect(await anonAadhaarIssuer.publicKeyHashExists(publicKeyHash)).to.equal(true);
    });

    it("should add public key hashes batch", async () => {
      const { anonAadhaarIssuer } = deployedActors;
      const publicKeyHash1 = 5;
      const publicKeyHash2 = 10;

      await expect(anonAadhaarIssuer.addPublicKeyHashesBatch([publicKeyHash1, publicKeyHash2]))
        .to.emit(anonAadhaarIssuer, "PublicKeyHashAdded")
        .withArgs(publicKeyHash1)
        .to.emit(anonAadhaarIssuer, "PublicKeyHashAdded")
        .withArgs(publicKeyHash2);

      expect(await anonAadhaarIssuer.publicKeyHashExists(publicKeyHash1)).to.equal(true);
      expect(await anonAadhaarIssuer.publicKeyHashExists(publicKeyHash2)).to.equal(true);
    });
  });

  describe("Upgradeabilitiy", () => {
    it("should preserve state after upgrade and update VERSION", async () => {
      const { anonAadhaarIssuer, owner, identityLib } = deployedActors;

      const AnonAadhaarIssuerV2Factory = await ethers.getContractFactory(
        "testUpgradedAnonAadhaarCredentialIssuerImplV1",
        {
          libraries: {
            IdentityLib: identityLib.target,
          },
        },
        owner,
      );
      const anonAadhaarIssuerV2Implementation = await AnonAadhaarIssuerV2Factory.deploy();
      await anonAadhaarIssuerV2Implementation.waitForDeployment();

      const anonAadhaarIssuerAsImpl = await ethers.getContractAt(
        "testUpgradedAnonAadhaarCredentialIssuerImplV1",
        anonAadhaarIssuer.target,
      );

      await anonAadhaarIssuerAsImpl
        .connect(owner)
        .upgradeToAndCall(
          anonAadhaarIssuerV2Implementation.target,
          AnonAadhaarIssuerV2Factory.interface.encodeFunctionData("initialize(bool)", [true]),
        );

      const anonAadhaarIssuerV2 = await ethers.getContractAt(
        "testUpgradedAnonAadhaarCredentialIssuerImplV1",
        anonAadhaarIssuer.target,
      );

      // Check if upgrade was successful and version function was added
      expect(await anonAadhaarIssuerV2.version()).to.equal("1.0.1");

      const implementationSlot =
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
      const implementationAddress = await ethers.provider.getStorage(
        anonAadhaarIssuer.target,
        implementationSlot,
      );
      expect(ethers.zeroPadValue(implementationAddress, 32)).to.equal(
        ethers.zeroPadValue(anonAadhaarIssuerV2Implementation.target.toString(), 32),
      );
    });

    it("should not allow non-proxy to upgrade implementation", async () => {
      const { anonAadhaarIssuer, anonAadhaarIssuerImpl, identityLib, owner } = deployedActors;

      const AnonAadhaarIssuerV2Factory = await ethers.getContractFactory(
        "testUpgradedAnonAadhaarCredentialIssuerImplV1",
        {
          libraries: {
            IdentityLib: identityLib.target,
          },
        },
        owner,
      );
      const anonAadhaarIssuerV2Implementation = await AnonAadhaarIssuerV2Factory.deploy();
      await anonAadhaarIssuerV2Implementation.waitForDeployment();

      const anonAadhaarIssuerAsImpl = await ethers.getContractAt(
        "testUpgradedAnonAadhaarCredentialIssuerImplV1",
        anonAadhaarIssuer.target,
      );

      await expect(
        anonAadhaarIssuerImpl
          .connect(owner)
          .upgradeToAndCall(
            anonAadhaarIssuerV2Implementation.target,
            AnonAadhaarIssuerV2Factory.interface.encodeFunctionData("initialize(bool)", [true]),
          ),
      ).to.be.revertedWithCustomError(anonAadhaarIssuerAsImpl, "UUPSUnauthorizedCallContext");
    });

    it("should not allow non-owner to upgrade implementation", async () => {
      const { anonAadhaarIssuer, owner, user1, identityLib } = deployedActors;

      const AnonAadhaarIssuerV2Factory = await ethers.getContractFactory(
        "testUpgradedAnonAadhaarCredentialIssuerImplV1",
        {
          libraries: {
            IdentityLib: identityLib.target,
          },
        },
        owner,
      );
      const anonAadhaarIssuerV2Implementation = await AnonAadhaarIssuerV2Factory.deploy();
      await anonAadhaarIssuerV2Implementation.waitForDeployment();

      const anonAadhaarIssuerAsImpl = await ethers.getContractAt(
        "testUpgradedAnonAadhaarCredentialIssuerImplV1",
        anonAadhaarIssuer.target,
      );

      await expect(
        anonAadhaarIssuerAsImpl
          .connect(user1)
          .upgradeToAndCall(
            anonAadhaarIssuerV2Implementation.target,
            AnonAadhaarIssuerV2Factory.interface.encodeFunctionData("initialize(bool)", [true]),
          ),
      ).to.be.revertedWithCustomError(anonAadhaarIssuerAsImpl, "OwnableUnauthorizedAccount");
    });

    it("should not allow implementation contract to be initialized directly", async () => {
      const { anonAadhaarIssuer, owner, identityLib } = deployedActors;

      const AnonAadhaarIssuerV2Factory = await ethers.getContractFactory(
        "testUpgradedAnonAadhaarCredentialIssuerImplV1",
        {
          libraries: {
            IdentityLib: identityLib.target,
          },
        },
        owner,
      );
      const anonAadhaarIssuerV2Implementation = await AnonAadhaarIssuerV2Factory.deploy();
      await anonAadhaarIssuerV2Implementation.waitForDeployment();

      await expect(
        anonAadhaarIssuerV2Implementation.initialize(true),
      ).to.be.revertedWithCustomError(anonAadhaarIssuer, "InvalidInitialization");
    });

    it("should not allow direct calls to implementation contract", async () => {
      const { owner, identityLib } = deployedActors;

      const AnonAadhaarIssuerV2Factory = await ethers.getContractFactory(
        "testUpgradedAnonAadhaarCredentialIssuerImplV1",
        {
          libraries: {
            IdentityLib: identityLib.target,
          },
        },
        owner,
      );
      const anonAadhaarIssuerV2Implementation = await AnonAadhaarIssuerV2Factory.deploy();
      await anonAadhaarIssuerV2Implementation.waitForDeployment();

      await expect(anonAadhaarIssuerV2Implementation.isTest()).to.be.revertedWithCustomError(
        anonAadhaarIssuerV2Implementation,
        "UUPSUnauthorizedCallContext",
      );
    });
  });
});
