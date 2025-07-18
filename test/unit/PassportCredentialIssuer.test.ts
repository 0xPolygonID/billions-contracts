import { expect } from "chai";
import { deploySystemFixtures } from "../utils/deployment";
import { DeployedActors } from "../utils/types";
import { ethers } from "hardhat";
import jsonAttestationWithUserData from "../data/TEEAttestationWithUserData.json";
import { base64ToBytes, bytesToHex } from "@0xpolygonid/js-sdk";
import { contractsInfo } from "../../helpers/constants";
import { getChainOfCertificatesRawBytes } from "../../helpers/validateTEE";

const imageHash = "0xededc6be756c1f502dd6be5dfd34aacdc2c59e6518c66dbf8e74a93acff58842";
const imageHash2 = "0xb46a627218ca4511d9d55c64181dcdd465c3c44822ee1610c4fab0e7a5ba9997";

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
      const { passportCredentialIssuer, credentialVerifier, expirationTime, templateRoot } =
        deployedActors;

      // Check initial state
      expect(await passportCredentialIssuer.getExpirationTime()).to.equal(expirationTime);
      expect(await passportCredentialIssuer.getTemplateRoot()).to.equal(templateRoot);

      const credentialCircuitId = "credential_sha256";
      expect(await passportCredentialIssuer.credentialVerifiers(credentialCircuitId)).to.equal(
        credentialVerifier.target,
      );
    });

    it("should not allow direct initialization of PassportCredentialIssuer implementation", async () => {
      const { owner, state, idType, identityLib } = deployedActors;

      const PassportCredentialIssuerFactory = await ethers.getContractFactory(
        contractsInfo.PASSPORT_CREDENTIAL_ISSUER.name,
        {
          libraries: {
            IdentityLib: identityLib.target,
          },
        },
        owner,
      );
      const passportCredentialIssuer = await PassportCredentialIssuerFactory.deploy();

      await expect(
        passportCredentialIssuer.initializeIssuer(
          0,
          0,
          0,
          [],
          [],
          [state.target, idType],
          await owner.getAddress(),
          await owner.getAddress(),
        ),
      ).to.be.revertedWithCustomError(passportCredentialIssuer, "InvalidInitialization");
    });

    it("should not allow initialization after initialized", async () => {
      const { passportCredentialIssuer, state, idType, owner } = deployedActors;

      await expect(
        passportCredentialIssuer.initializeIssuer(
          0,
          0,
          0,
          [],
          [],
          [state.target, idType],
          await owner.getAddress(),
          await owner.getAddress(),
        ),
      ).to.be.revertedWithCustomError(passportCredentialIssuer, "InvalidInitialization");
    });
  });

  describe("Update functions", () => {
    it("adding imageHash to whitelisted enclave image hashes", async function () {
      const { passportCredentialIssuer } = deployedActors;
      await expect(passportCredentialIssuer.addImageHashToWhitelist(imageHash)).not.to.be.reverted;
      await expect(passportCredentialIssuer.addImageHashToWhitelist(imageHash2)).not.to.be.reverted;
      expect(await passportCredentialIssuer.isWhitelistedImageHash(imageHash)).to.equal(true);
      expect(await passportCredentialIssuer.isWhitelistedImageHash(imageHash2)).to.equal(true);
    });

    it("add signer for non whitelisted enclave imageHash", async function () {
      const {
        passportCredentialIssuer,
        certificatesValidatorStub,
        nitroAttestationValidator,
        owner,
      } = deployedActors;

      const certificates = await getChainOfCertificatesRawBytes(
        JSON.stringify(jsonAttestationWithUserData),
      );

      // disable the chain of certificates validation
      await nitroAttestationValidator.setCertificatesValidator(
        await certificatesValidatorStub.getAddress(),
      );

      for (let i = 0; i < certificates.length - 1; i++) {
        await certificatesValidatorStub.addCertificateVerification(
          `0x${certificates[i]}`,
          `0x${certificates[i + 1]}`,
        );
      }
      await passportCredentialIssuer.addTransactor(await owner.getAddress());

      // await expect(
      //   passportCredentialIssuer.addSigner(
      //     `0x${bytesToHex(base64ToBytes(jsonAttestationWithUserData.attestation))}`,
      //   ),
      // )
      //   .to.revertedWithCustomError(passportCredentialIssuer, "ImageHashIsNotWhitelisted")
      //   .withArgs(imageHash);
    }).timeout(160000);

    it.skip("add signer for whitelisted enclave imageHash", async function () {
      const {
        passportCredentialIssuer,
        certificatesValidatorStub,
        nitroAttestationValidator,
        user1,
        owner,
      } = deployedActors;

      await expect(passportCredentialIssuer.addImageHashToWhitelist(imageHash)).not.to.be.reverted;
      await passportCredentialIssuer.addTransactor(await owner.getAddress());

      const certificates = await getChainOfCertificatesRawBytes(
        JSON.stringify(jsonAttestationWithUserData),
      );

      // disable the chain of certificates validation
      await nitroAttestationValidator.setCertificatesValidator(
        await certificatesValidatorStub.getAddress(),
      );

      for (let i = 0; i < certificates.length - 1; i++) {
        await certificatesValidatorStub.addCertificateVerification(
          `0x${certificates[i]}`,
          `0x${certificates[i + 1]}`,
        );
      }

      await expect(
        passportCredentialIssuer.addSigner(
          `0x${bytesToHex(base64ToBytes(jsonAttestationWithUserData.attestation))}`,
        ),
      )
        .to.emit(passportCredentialIssuer, "SignerAdded")
        .withArgs(await user1.getAddress());
    }).timeout(160000);

    it("add transactor to contract", async function () {
      const { passportCredentialIssuer, owner } = deployedActors;

      await expect(passportCredentialIssuer.addTransactor(owner))
        .to.emit(passportCredentialIssuer, "TransactorAdded")
        .withArgs(await owner.getAddress());

      expect(await passportCredentialIssuer.getTransactors()).to.deep.equal([
        await owner.getAddress(),
      ]);
    });

    it("should not add signer if caller is not a transactor", async () => {
      const { passportCredentialIssuer, user1 } = deployedActors;

      await expect(
        passportCredentialIssuer
          .connect(user1)
          // .addSigner(`0x${bytesToHex(base64ToBytes(jsonAttestationWithUserData.attestation))}`),
          .addSigner(user1.getAddress()),
      )
        .to.be.revertedWithCustomError(passportCredentialIssuer, "InvalidTransactor")
        .withArgs(await user1.getAddress());
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
      expect(await passportCredentialIssuer.getSigners()).to.deep.equal([]);
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

      expect(await passportCredentialIssuer.connect(owner).VERSION()).to.equal(
        contractsInfo.PASSPORT_CREDENTIAL_ISSUER.version,
      );
    });

    it("Should have upgraded the proxy to new PassportCredentialIssuer", async function () {
      const { owner, identityLib, passportCredentialIssuer, proxyAdmin } = deployedActors;

      const imageHash = "0xc980e59163ce244bb4bb6211f48c7b46f88a4f40943e84eb99bdc41e129bd293";
      await passportCredentialIssuer.addImageHashToWhitelist(imageHash);

      expect(await passportCredentialIssuer.isWhitelistedImageHash(imageHash)).to.equal(true);

      /****************************** Upgrade calling direct to proxyAdmin ****************************/
      const PassportCredentialIssuerFactory = await ethers.getContractFactory(
        contractsInfo.PASSPORT_CREDENTIAL_ISSUER.name,
        {
          libraries: {
            IdentityLib: identityLib.target,
          },
        },
        owner,
      );
      const newPassportCredentialIssuerImpl = await PassportCredentialIssuerFactory.deploy();

      const initializeData = "0x";
      await proxyAdmin.upgradeAndCall(
        passportCredentialIssuer,
        newPassportCredentialIssuerImpl,
        initializeData,
      );
      const passportCredentialIssuerUpdated = passportCredentialIssuer;
      /************************************************************************************************/

      /****************************** Upgrade with ignition module ****************************/
      /*const {
        passportCredentialIssuer: passportCredentialIssuerUpdated,
        newPassportCredentialIssuerImpl,
      } = await ignition.deploy(UpgradedPassportCredentialIssuerModule, {
        parameters: {
          IdentityLibModule: {
            poseidon3ElementAddress: deployedActors.poseidon3.target as string,
            poseidon4ElementAddress: deployedActors.poseidon4.target as string,
            smtLibAddress: deployedActors.smtLib.target as string,
          },
        },
      });*/
      /************************************************************************************************/

      expect(await passportCredentialIssuerUpdated.connect(owner).VERSION()).to.equal(
        contractsInfo.PASSPORT_CREDENTIAL_ISSUER.version,
      );
      expect(await passportCredentialIssuerUpdated.isWhitelistedImageHash(imageHash)).to.equal(
        true,
      );

      const implementationSlot =
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
      const implementationAddress = await ethers.provider.getStorage(
        passportCredentialIssuerUpdated.target,
        implementationSlot,
      );
      expect(ethers.zeroPadValue(implementationAddress, 32)).to.equal(
        ethers.zeroPadValue(newPassportCredentialIssuerImpl.target.toString(), 32),
      );
    });
  });
});
