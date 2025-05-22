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
import { getChainOfCertificatesRawBytes } from "../../helpers/validateTEE";

const imageHash = "0xededc6be756c1f502dd6be5dfd34aacdc2c59e6518c66dbf8e74a93acff58842";

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
  let credentialProofRevocationNonceZero: any;

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

    // revocation nonce zero
    credentialProofRevocationNonceZero = await generateCredentialProof(
      deployedActors.mockPassport,
      new Date(),
      new Date(),
      0,
    );

    // Set the issuer DID hash
    const { passportCredentialIssuer, owner } = deployedActors;
    const passportCredentialIssuerWithOwner = passportCredentialIssuer.connect(owner);
    const issuerDidHash = baseCredentialProof.publicSignals[6]; // Replace with the actual hash
    const tx = await passportCredentialIssuerWithOwner.setIssuerDIDHash(issuerDidHash);
    await tx.wait();

    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  beforeEach(async () => {
    credentialProof = structuredClone(baseCredentialProof);
    credentialProofCurrentDateExpired = structuredClone(baseCredentialProofCurrentDateExpired);
    credentialProofIssuanceDateExpired = structuredClone(baseCredentialProofIssuanceDateExpired);
    credentialProofRevocationNonceZero = structuredClone(credentialProofRevocationNonceZero);
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  describe("Verify passport", async () => {
    it("Should verify passport successfully", async () => {
      const {
        passportCredentialIssuer,
        certificatesValidatorStub,
        nitroAttestationValidator,
        user1,
        owner,
      } = deployedActors;

      await expect(passportCredentialIssuer.addImageHashToWhitelist(imageHash)).not.to.be.reverted;
      await expect(passportCredentialIssuer.addTransactor(await owner.getAddress())).not.to.be
        .reverted;

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
          user1.getAddress(),
        ),
      )
      // await expect(
      //   passportCredentialIssuer.addSigner(
      //     `0x${bytesToHex(base64ToBytes(jsonAttestationWithUserData.attestation))}`,
      //   ),
      // )
        .to.emit(passportCredentialIssuer, "SignerAdded")
        .withArgs(await user1.getAddress());

      const signedPassportData: PassportDataSigned = {
        linkId: BigInt(credentialProof.publicSignals[2]),
        nullifier: 1n,
      };

      const passportSignatureProof = await packSignedPassportData(
        signedPassportData,
        passportCredentialIssuer,
        user1,
      );

      const credentialPreparedProof = prepareProof(credentialProof.proof);

      const credentialZkProof = packZKProof(
        credentialProof.publicSignals,
        credentialPreparedProof.pi_a,
        credentialPreparedProof.pi_b,
        credentialPreparedProof.pi_c,
      );

      expect(await passportCredentialIssuer.nullifierExists(signedPassportData.nullifier)).to.be
        .false;
      await expect(
        passportCredentialIssuer.verifyPassport(
          { circuitId: "credential_sha256", proof: credentialZkProof },
          passportSignatureProof,
        ),
      ).not.to.be.reverted;
      expect(await passportCredentialIssuer.nullifierExists(signedPassportData.nullifier)).to.be
        .true;

      // Check nullifier
      await expect(
        passportCredentialIssuer.verifyPassport(
          { circuitId: "credential_sha256", proof: credentialZkProof },
          passportSignatureProof,
        ),
      ).to.be.revertedWithCustomError(passportCredentialIssuer, "NullifierAlreadyExists");

      await passportCredentialIssuer.revokeCredential(signedPassportData.nullifier);

      expect(await passportCredentialIssuer.nullifierExists(signedPassportData.nullifier)).to.be
        .false;

      await expect(
        passportCredentialIssuer.verifyPassport(
          { circuitId: "credential_sha256", proof: credentialZkProof },
          passportSignatureProof,
        ),
      ).to.be.revertedWith("Identity trees haven't changed");
    });

    it("Should not verify with passport current date expired", async () => {
      const {
        passportCredentialIssuer,
        certificatesValidatorStub,
        nitroAttestationValidator,
        user1,
        owner,
      } = deployedActors;

      await expect(passportCredentialIssuer.addImageHashToWhitelist(imageHash)).not.to.be.reverted;
      await expect(passportCredentialIssuer.addTransactor(await owner.getAddress())).not.to.be
        .reverted;

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
          user1.getAddress(),
        ),
      )
      // await expect(
      //   passportCredentialIssuer.addSigner(
      //     `0x${bytesToHex(base64ToBytes(jsonAttestationWithUserData.attestation))}`,
      //   ),
      // )
        .to.emit(passportCredentialIssuer, "SignerAdded")
        .withArgs(await user1.getAddress());

      const signedPassportData: PassportDataSigned = {
        linkId: BigInt(credentialProofCurrentDateExpired.publicSignals[2]),
        nullifier: 1n,
      };

      const passportSignatureProof = await packSignedPassportData(
        signedPassportData,
        passportCredentialIssuer,
        user1,
      );

      const credentialPreparedProof = prepareProof(credentialProofCurrentDateExpired.proof);

      const credentialZkProof = packZKProof(
        credentialProofCurrentDateExpired.publicSignals,
        credentialPreparedProof.pi_a,
        credentialPreparedProof.pi_b,
        credentialPreparedProof.pi_c,
      );

      expect(await passportCredentialIssuer.nullifierExists(signedPassportData.nullifier)).to.be
        .false;
      await expect(
        passportCredentialIssuer.verifyPassport(
          { circuitId: "credential_sha256", proof: credentialZkProof },
          passportSignatureProof,
        ),
      )
        .to.be.revertedWithCustomError(passportCredentialIssuer, "CurrentDateExpired")
        .withArgs(currentDateExpiredFormatted);
    });

    it("Should not verify with passport issuance date expired", async () => {
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
          user1.getAddress(),
        ),
      )
      // await expect(
      //   passportCredentialIssuer.addSigner(
      //     `0x${bytesToHex(base64ToBytes(jsonAttestationWithUserData.attestation))}`,
      //   ),
      // )
        .to.emit(passportCredentialIssuer, "SignerAdded")
        .withArgs(await user1.getAddress());

      const signedPassportData: PassportDataSigned = {
        linkId: BigInt(credentialProofIssuanceDateExpired.publicSignals[2]),
        nullifier: 1n,
      };

      const passportSignatureProof = await packSignedPassportData(
        signedPassportData,
        passportCredentialIssuer,
        user1,
      );

      const credentialPreparedProof = prepareProof(credentialProofIssuanceDateExpired.proof);

      const credentialZkProof = packZKProof(
        credentialProofIssuanceDateExpired.publicSignals,
        credentialPreparedProof.pi_a,
        credentialPreparedProof.pi_b,
        credentialPreparedProof.pi_c,
      );

      expect(await passportCredentialIssuer.nullifierExists(signedPassportData.nullifier)).to.be
        .false;
      await expect(
        passportCredentialIssuer.verifyPassport(
          { circuitId: "credential_sha256", proof: credentialZkProof },
          passportSignatureProof,
        ),
      )
        .to.be.revertedWithCustomError(passportCredentialIssuer, "IssuanceDateExpired")
        .withArgs(Math.round(issuanceDateExpired.getTime() / 1000));
    });

    it("Should not verify passport with invalid signer", async () => {
      const {
        passportCredentialIssuer,
        certificatesValidatorStub,
        nitroAttestationValidator,
        user2,
        user1,
        owner,
      } = deployedActors;

      await expect(passportCredentialIssuer.addImageHashToWhitelist(imageHash)).not.to.be.reverted;
      await expect(passportCredentialIssuer.addTransactor(await owner.getAddress())).not.to.be
        .reverted;

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
          user1.getAddress(),
        ),
      )
      // await passportCredentialIssuer.addSigner(
      //   `0x${bytesToHex(base64ToBytes(jsonAttestationWithUserData.attestation))}`,
      // );

      const signedPassportData: PassportDataSigned = {
        linkId: BigInt(credentialProof.publicSignals[2]),
        nullifier: 1n,
      };

      const passportSignatureProof = await packSignedPassportData(
        signedPassportData,
        passportCredentialIssuer,
        user2,
      );

      const credentialPreparedProof = prepareProof(credentialProof.proof);

      const credentialZkProof = packZKProof(
        credentialProof.publicSignals,
        credentialPreparedProof.pi_a,
        credentialPreparedProof.pi_b,
        credentialPreparedProof.pi_c,
      );

      await expect(
        passportCredentialIssuer.verifyPassport(
          { circuitId: "credential_sha256", proof: credentialZkProof },
          passportSignatureProof,
        ),
      )
        .to.revertedWithCustomError(passportCredentialIssuer, "InvalidSignerPassportSignatureProof")
        .withArgs(await user2.getAddress());
    });

    it("Should not verify with passport issuance date in the future", async () => {
      const {
        passportCredentialIssuer,
        nitroAttestationValidator,
        certificatesValidatorStub,
        user1,
        owner,
      } = deployedActors;

      await expect(passportCredentialIssuer.addImageHashToWhitelist(imageHash)).not.to.be.reverted;
      await expect(passportCredentialIssuer.addTransactor(await owner.getAddress())).not.to.be
        .reverted;

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
          user1.getAddress(),
        ),
      )
      // await expect(
      //   passportCredentialIssuer.addSigner(
      //     `0x${bytesToHex(base64ToBytes(jsonAttestationWithUserData.attestation))}`,
      //   ),
      // )
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

      const credentialPreparedProof = prepareProof(baseCredentialProofFutureIssuance.proof);

      const credentialZkProof = packZKProof(
        baseCredentialProofFutureIssuance.publicSignals,
        credentialPreparedProof.pi_a,
        credentialPreparedProof.pi_b,
        credentialPreparedProof.pi_c,
      );

      await expect(
        passportCredentialIssuer.verifyPassport(
          { circuitId: "credential_sha256", proof: credentialZkProof },
          crossChainProofs,
        ),
      )
        .to.be.revertedWithCustomError(passportCredentialIssuer, "IssuanceDateInFuture")
        .withArgs(Math.round(futureIssuanceDate.getTime() / 1000));
    });

    it("Should not verify with passport current date in the future", async () => {
      const {
        passportCredentialIssuer,
        nitroAttestationValidator,
        certificatesValidatorStub,
        user1,
        owner,
      } = deployedActors;

      await expect(passportCredentialIssuer.addImageHashToWhitelist(imageHash)).not.to.be.reverted;
      await expect(passportCredentialIssuer.addTransactor(await owner.getAddress())).not.to.be
        .reverted;

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
          user1.getAddress(),
        ),
      )
      // await expect(
      //   passportCredentialIssuer.addSigner(
      //     `0x${bytesToHex(base64ToBytes(jsonAttestationWithUserData.attestation))}`,
      //   ),
      // )
        .to.emit(passportCredentialIssuer, "SignerAdded")
        .withArgs(await user1.getAddress());

      const futureCurrentDate = new Date();
      // Set current date to 2 day in the future
      futureCurrentDate.setDate(futureCurrentDate.getDate() + 2);

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

      const credentialPreparedProof = prepareProof(baseCredentialProofFutureCurrentDate.proof);

      const credentialZkProof = packZKProof(
        baseCredentialProofFutureCurrentDate.publicSignals,
        credentialPreparedProof.pi_a,
        credentialPreparedProof.pi_b,
        credentialPreparedProof.pi_c,
      );

      await expect(
        passportCredentialIssuer.verifyPassport(
          { circuitId: "credential_sha256", proof: credentialZkProof },
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

    it("Should return an error for unknown issuer", async () => {
      const {
        passportCredentialIssuer,
        nitroAttestationValidator,
        certificatesValidatorStub,
        user1,
        owner,
      } = deployedActors;

      await expect(passportCredentialIssuer.addImageHashToWhitelist(imageHash)).not.to.be.reverted;
      await expect(passportCredentialIssuer.addTransactor(await owner.getAddress())).not.to.be
        .reverted;

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
          user1.getAddress(),
        ),
      )
      // await expect(
      //   passportCredentialIssuer.addSigner(
      //     `0x${bytesToHex(base64ToBytes(jsonAttestationWithUserData.attestation))}`,
      //   ),
      // )
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

      const credentialPreparedProof = prepareProof(credentialProof.proof);

      const credentialZkProof = packZKProof(
        credentialProof.publicSignals,
        credentialPreparedProof.pi_a,
        credentialPreparedProof.pi_b,
        credentialPreparedProof.pi_c,
      );

      // set incorrect issuerDidHash
      const passportCredentialIssuerWithOwner = passportCredentialIssuer.connect(owner);
      const tx = await passportCredentialIssuerWithOwner.setIssuerDIDHash(1);
      await tx.wait();

      await expect(
        passportCredentialIssuer.verifyPassport(
          { circuitId: "credential_sha256", proof: credentialZkProof },
          crossChainProofs,
        ),
      ).to.revertedWithCustomError(passportCredentialIssuer, "InvalidIssuerDidHash");
    });

    it("Should error if revocation nonce is 0", async () => {
      const {
        passportCredentialIssuer,
        nitroAttestationValidator,
        certificatesValidatorStub,
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
          user1.getAddress(),
        ),
      )
      // await expect(
      //   passportCredentialIssuer.addSigner(
      //     `0x${bytesToHex(base64ToBytes(jsonAttestationWithUserData.attestation))}`,
      //   ),
      // )
        .to.emit(passportCredentialIssuer, "SignerAdded")
        .withArgs(await user1.getAddress());

      const signedPassportData: PassportDataSigned = {
        linkId: BigInt(credentialProofRevocationNonceZero.publicSignals[2]),
        nullifier: 1n,
      };

      const crossChainProofs = await packSignedPassportData(
        signedPassportData,
        passportCredentialIssuer,
        user1,
      );

      const credentialPreparedProof = prepareProof(credentialProofRevocationNonceZero.proof);

      const credentialZkProof = packZKProof(
        credentialProofRevocationNonceZero.publicSignals,
        credentialPreparedProof.pi_a,
        credentialPreparedProof.pi_b,
        credentialPreparedProof.pi_c,
      );

      expect(await passportCredentialIssuer.nullifierExists(signedPassportData.nullifier)).to.be
        .false;
      await expect(
        passportCredentialIssuer.verifyPassport(
          { circuitId: "credential_sha256", proof: credentialZkProof },
          crossChainProofs,
        ),
      )
        .to.be.revertedWithCustomError(passportCredentialIssuer, "InvalidRevocationNonce")
        .withArgs(0);
    });
  });
});
