import { expect } from "chai";
import { deployAnonAadhaarIssuerFixtures } from "../utils/deployment";
import { DeployedActorsAnonAadhaar } from "../utils/types";
import { ethers, ignition } from "hardhat";
import UpgradedAnonAadHaarCredentialIssuerModule from "../../ignition/modules/anonAadhaarCredentialIssuer/upgradeAnonAadhaarCredentialIssuer";

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
    it("should initialize AnonAadhaarCredentialIssuer with correct parameters", async () => {
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

  describe("Upgradeability", () => {
    it("Should be interactable via proxy", async function () {
      const { anonAadhaarIssuer, owner } = deployedActors;

      expect(await anonAadhaarIssuer.connect(owner).VERSION()).to.equal("1.0.0");
    });

    it("Should have upgraded the proxy to new AnonAadHaarCredentialIssuer", async function () {
      const { owner, nullifierSeed, publicKeyHashes } = deployedActors;

      const { anonAadHaarCredentialIssuer, newAnonAadHaarCredentialIssuerImpl } = await ignition.deploy(
        UpgradedAnonAadHaarCredentialIssuerModule,
        {
          parameters: {
            IdentityLibModule: {
              poseidon3ElementAddress: deployedActors.poseidon3.target as string,
              poseidon4ElementAddress: deployedActors.poseidon4.target as string,
              smtLibAddress: deployedActors.smtLib.target as string,
            },
          },
        },
      );

      expect(await anonAadHaarCredentialIssuer.connect(owner).VERSION()).to.equal("1.0.0");
      const implementationSlot =
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
      const implementationAddress = await ethers.provider.getStorage(
        anonAadHaarCredentialIssuer.target,
        implementationSlot,
      );
      expect(ethers.zeroPadValue(implementationAddress, 32)).to.equal(
        ethers.zeroPadValue(newAnonAadHaarCredentialIssuerImpl.target.toString(), 32),
      );
    });
  });
});
