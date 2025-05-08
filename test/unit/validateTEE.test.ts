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

  /* it("Validate signature off-chain", async function () {
    const signature = hexToBytes(
      "21f7305d9ddbba33dc85c9291dca4a8141ab128927717e24b1a59dd1d8a3ba46977ada606cbb2ec4bdab4cb7f188f51807182d3bc9f7129eae83098214886e1b042dcd6b5fa1292e2e4ff22f70a8806e0be05fc79f5a078ebd5e8c5c7c612d0d",
    );
    const data = hexToBytes(
      "30820201a0030201020210019514dce5ce6daa0000000067b36bfb300a06082a8648ce3d04030330818e310b30090603550406130255533113301106035504080c0a57617368696e67746f6e3110300e06035504070c0753656174746c65310f300d060355040a0c06416d617a6f6e310c300a060355040b0c034157533139303706035504030c30692d30396431343831333963363263333466312e65752d776573742d312e6177732e6e6974726f2d656e636c61766573301e170d3235303231373137303335325a170d3235303231373230303335355a308193310b30090603550406130255533113301106035504080c0a57617368696e67746f6e3110300e06035504070c0753656174746c65310f300d060355040a0c06416d617a6f6e310c300a060355040b0c03415753313e303c06035504030c35692d30396431343831333963363263333466312d656e63303139353134646365356365366461612e65752d776573742d312e6177733076301006072a8648ce3d020106052b81040022036200042605b51e2e78bf78707d07ebcd50ccaccee7e9e5dd6788793d2fafe6e88e33f050e87717488e365e5df8df4d8e203490cfb3f19f8471c5c4d67fd5435f40842dcede5021bf52e96a6d06ba9c69987c9829fbb59d32aa799b3b6f6711121e3bb8a31d301b300c0603551d130101ff04023000300b0603551d0f0404030206c0",
    );
    const publicKey = await crypto.subtle.importKey(
      "raw",
      hexToBytes(
        "04965180025c22a5f80b1e248a6956bf49796cc8704be68d0dadffa254f5d3de104b4aef70e5e84f6d2aa0854c2e25843eccc8e09d7ba8a954f952f15ec3bed9ca9a1f9d316530d4ed86ed3c27f941a76bb5a81490319edbb350691f9ab3d488eb",
      ),
      { name: "ECDSA", namedCurve: "P-384" },
      true,
      ["verify"],
    ); 

    let result = await crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: { name: "SHA-384" },
      },
      publicKey,
      signature,
      data,
    );
    expect(result).to.be.true;
  }); */
});
