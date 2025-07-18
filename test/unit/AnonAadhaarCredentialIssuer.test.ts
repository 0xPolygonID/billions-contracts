import { expect } from "chai";
import { deployAnonAadhaarIssuerFixtures } from "../utils/deployment";
import { DeployedActorsAnonAadhaar } from "../utils/types";
import { ethers, ignition } from "hardhat";
import UpgradedAnonAadhaarCredentialIssuerModule from "../../ignition/modules/anonAadhaarCredentialIssuer/upgradeAnonAadhaarCredentialIssuer";
import { contractsInfo } from "../../helpers/constants";

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
      expect(await anonAadhaarIssuer.VERSION()).to.equal(
        contractsInfo.ANONAADHAAR_CREDENTIAL_ISSUER.version,
      );
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

    it("should add a QR version", async () => {
      const { anonAadhaarIssuer } = deployedActors;
      const qrVersion = 1;

      await anonAadhaarIssuer.addQrVersion(qrVersion);

      const exists = await anonAadhaarIssuer.qrVersionSupported(qrVersion);
      expect(exists).to.be.true;
    });

    it("should add multiple QR versions in a batch", async () => {
      const { anonAadhaarIssuer } = deployedActors;
      const qrVersions = [1, 2, 3];

      await anonAadhaarIssuer.addQrVersionBatch(qrVersions);

      for (const qrVersion of qrVersions) {
        const exists = await anonAadhaarIssuer.qrVersionSupported(qrVersion);
        expect(exists).to.be.true;
      }
    });

    it("should remove a QR version", async () => {
      const { anonAadhaarIssuer } = deployedActors;
      const qrVersion = 1;

      await anonAadhaarIssuer.addQrVersion(qrVersion);
      await anonAadhaarIssuer.removeQrVersion(qrVersion);

      const exists = await anonAadhaarIssuer.qrVersionSupported(qrVersion);
      expect(exists).to.be.false;
    });

    it("should revert when removing a non-existent QR version", async () => {
      const { anonAadhaarIssuer } = deployedActors;
      const qrVersion = 1;

      await expect(anonAadhaarIssuer.removeQrVersion(qrVersion)).to.be.revertedWithCustomError(
        anonAadhaarIssuer,
        "UnsupportedQrVersion",
      );
    });

    it("should update anonAadhaar verifier", async () => {
      const { anonAadhaarIssuer, user1 } = deployedActors;
      const anonAadhaarCircuitIds = ["1", "2"];
      const newVerifierAddresses = [await user1.getAddress(), await user1.getAddress()];

      await expect(
        anonAadhaarIssuer.updateAnonAadhaarVerifiers(anonAadhaarCircuitIds, newVerifierAddresses),
      )
        .to.emit(anonAadhaarIssuer, "AnonAadhaarCircuitVerifierUpdated")
        .withArgs(anonAadhaarCircuitIds[0], newVerifierAddresses[0])
        .to.emit(anonAadhaarIssuer, "AnonAadhaarCircuitVerifierUpdated")
        .withArgs(anonAadhaarCircuitIds[1], newVerifierAddresses[1]);

      for (let i = 0; i < anonAadhaarCircuitIds.length; i++) {
        expect(await anonAadhaarIssuer.anonAadhaarVerifiers(anonAadhaarCircuitIds[i])).to.equal(
          newVerifierAddresses[i],
        );
      }
    });
  });

  describe("Upgradeability", () => {
    it("Should be interactable via proxy", async function () {
      const { anonAadhaarIssuer, owner } = deployedActors;

      expect(await anonAadhaarIssuer.connect(owner).VERSION()).to.equal(
        contractsInfo.ANONAADHAAR_CREDENTIAL_ISSUER.version,
      );
    });

    it("Should have upgraded the proxy to new AnonAadhaarCredentialIssuer", async function () {
      const { owner, identityLib, anonAadhaarIssuer, proxyAdmin, nullifierSeed, publicKeyHashes } =
        deployedActors;

      /****************************** Upgrade calling direct to proxyAdmin ****************************/
      const AnonAadhaarCredentialIssuerFactory = await ethers.getContractFactory(
        "AnonAadhaarCredentialIssuer",
        {
          libraries: {
            IdentityLib: identityLib.target,
          },
        },
        owner,
      );
      const newAnonAadhaarCredentialIssuerImpl = await AnonAadhaarCredentialIssuerFactory.deploy();

      const initializeData = "0x";
      await proxyAdmin.upgradeAndCall(
        anonAadhaarIssuer,
        newAnonAadhaarCredentialIssuerImpl,
        initializeData,
      );
      const anonAaadHaarCredentialIssuerUpdated = anonAadhaarIssuer;
      /************************************************************************************************/

      /****************************** Upgrade with ignition module ****************************/
      /*const { anonAadhaarCredentialIssuer: anonAaadHaarCredentialIssuerUpdated, newAnonAadhaarCredentialIssuerImpl } = await ignition.deploy(
        UpgradedAnonAadhaarCredentialIssuerModule,
        {
          parameters: {
            IdentityLibModule: {
              poseidon3ElementAddress: deployedActors.poseidon3.target as string,
              poseidon4ElementAddress: deployedActors.poseidon4.target as string,
              smtLibAddress: deployedActors.smtLib.target as string,
            },
          },
        },
      );*/
      /************************************************************************************************/

      expect(await anonAaadHaarCredentialIssuerUpdated.connect(owner).VERSION()).to.equal(
        contractsInfo.ANONAADHAAR_CREDENTIAL_ISSUER.version,
      );
      expect(await anonAaadHaarCredentialIssuerUpdated.getNullifierSeed()).to.equal(nullifierSeed);

      for (const publicKeyHash of publicKeyHashes) {
        expect(
          await anonAaadHaarCredentialIssuerUpdated.publicKeyHashExists(publicKeyHash),
        ).to.equal(true);
      }

      const implementationSlot =
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
      const implementationAddress = await ethers.provider.getStorage(
        anonAaadHaarCredentialIssuerUpdated.target,
        implementationSlot,
      );
      expect(ethers.zeroPadValue(implementationAddress, 32)).to.equal(
        ethers.zeroPadValue(newAnonAadhaarCredentialIssuerImpl.target.toString(), 32),
      );
    });
  });
});
