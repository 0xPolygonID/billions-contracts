import { expect } from "chai";
import jsonAttestation from "../data/TEEAttestationWithUserData.json";
import jsonAttestationExpired from "../data/TEEAttestationExpired.json";
import jsonAttestationClaim from "../data/TEEAttestationClaim.json";
import { getChainOfCertificatesRawBytes, validateAttestation } from "../../helpers/validateTEE";
import { base64ToBytes, bytesToHex } from "@0xpolygonid/js-sdk";
import { deployContractWrapper } from "../utils/deployment";
import { ignition } from "hardhat";
import { NitroAttestationValidatorModule } from "../../ignition/modules/attestationValidation/attestationLibraries";

describe("Validation of TEE attestations", function () {
  let nitroAttestationValidator: any;
  let nitroAttestationValidatorWrapper: any;
  let certificatesValidator: any;

  before(async function () {
    ({ nitroAttestationValidator, certificatesValidator } = await ignition.deploy(NitroAttestationValidatorModule));

    nitroAttestationValidatorWrapper = await deployContractWrapper(
      "NitroAttestationValidatorWrapper",
    );
    await nitroAttestationValidatorWrapper.setAttestationValidator(
      await nitroAttestationValidator.getAddress(),
    );
  });

  it("Validate TEE attestation off-chain", async function () {
    const result = await validateAttestation(JSON.stringify(jsonAttestation), false);
    expect(result).not.to.be.undefined;
  });

  it("Parse TEE attestation on-chain", async function () {
    const attestation = await nitroAttestationValidator.parseAttestation(
      `0x${bytesToHex(base64ToBytes(jsonAttestation.attestation))}`,
    );
    expect(attestation[0]).to.equal(18);
    expect(attestation[1][2][1]).to.equal("SHA384");
  });

  it("Validate TEE attestation on-chain with certificates not verified yet", async function () {
    await expect(
      nitroAttestationValidator.validateAttestation(
        `0x${bytesToHex(base64ToBytes(jsonAttestation.attestation))}`,
        true,
      ),
    ).revertedWithCustomError(certificatesValidator, "CertificateNotVerifiedYet");
  }).timeout(160000);

  it("Validate TEE attestation on-chain expired", async function () {
    const certificates = await getChainOfCertificatesRawBytes(
      JSON.stringify(jsonAttestationExpired),
    );

    for (let i = 0; i < certificates.length - 1; i++) {
      await certificatesValidator.addCertificateVerification(
        `0x${certificates[i]}`,
        `0x${certificates[i + 1]}`,
      );
    }

    await expect(
      nitroAttestationValidator.validateAttestation(
        `0x${bytesToHex(base64ToBytes(jsonAttestationExpired.attestation))}`,
        true,
      ),
    ).revertedWithCustomError(certificatesValidator, "CertificateExpired");
  }).timeout(160000);

  it("Validate TEE attestation on-chain", async function () {
    await expect(
      nitroAttestationValidator.validateAttestation(
        `0x${bytesToHex(base64ToBytes(jsonAttestation.attestation))}`,
        false,
      ),
    ).not.to.be.reverted;
  }).timeout(160000);

  it("Validate chain of certificates", async function () {
    let certificates = await getChainOfCertificatesRawBytes(JSON.stringify(jsonAttestationClaim));
    certificates = certificates.slice(2); // remove first two certificates for testing to avoid expired ones
    await expect(
      certificatesValidator.validateChainOfCertificates(
        certificates.slice(1, certificates.length).map((c) => `0x${c}`),
      ),
    ).to.be.revertedWithCustomError(certificatesValidator, "CertificateNotVerifiedYet");

    for (let i = 0; i < certificates.length - 1; i++) {
      await certificatesValidator.addCertificateVerification(
        `0x${certificates[i]}`,
        `0x${certificates[i + 1]}`,
      );
    }

    // firsts could be expired
    const result = await certificatesValidator.validateChainOfCertificates(
      certificates.slice(2, certificates.length).map((c) => `0x${c}`),
    );
    expect(result).to.be.true;
  }).timeout(160000);

  it("Parse TEE attestation on-chain with user data", async function () {
    const attestation = await nitroAttestationValidator.parseAttestation(
      `0x${bytesToHex(base64ToBytes(jsonAttestationClaim.attestation))}`,
    );
    expect(attestation[0]).to.equal(18);
    expect(attestation[1][2][1]).to.equal("SHA384");
    expect(attestation[1][2][7]).not.to.be.equal("0xf6"); // CBOR null
  });

  it("Validate TEE attestation on-chain with user data", async function () {
    const result = await nitroAttestationValidator.validateAttestation(
      `0x${bytesToHex(base64ToBytes(jsonAttestationClaim.attestation))}`,
      false,
    );
    expect(result[1]).to.equal(
      "0xb46a627218ca4511d9d55c64181dcdd465c3c44822ee1610c4fab0e7a5ba9997",
    );
    expect(result[2]).to.equal(true);
    expect(result[0]).to.equal(
      "0x81a46474797065006968617368496e646578c258201ba9f0d1706768dfd0297926ce1f2cff088ee2e25382c02cfab07974de084c2a696861736856616c7565c2582013a962fc4bac6c79985bcea0d16b9314cde5547ae3a73a1431d966ca629aa7376f7265766f636174696f6e4e6f6e63651bbb0d65f253f3f7e9",
    );
  }).timeout(160000);

  it("Validate TEE attestation on-chain for wrapper", async function () {
    await nitroAttestationValidatorWrapper.parseAttestation(
      `0x${bytesToHex(base64ToBytes(jsonAttestationClaim.attestation))}`,
    );

    await nitroAttestationValidatorWrapper.validateAttestation(
      `0x${bytesToHex(base64ToBytes(jsonAttestationClaim.attestation))}`,
      false,
    );
  }).timeout(240000);
});
