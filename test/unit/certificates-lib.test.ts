import { expect } from "chai";
import { getChainOfCertificatesRawBytes } from "../../helpers/validateTEE";
import jsonAttestation from "../data/TEEAttestationWithUserData.json";
import { deployCertificatesLibWrapper } from "../utils/deployment";

describe("Test certificatesLib", function () {
  let certificatesLibWrapper: any;
  let certificateSubject: any;
  let certificateIssuer: any;

  before(async function () {
    certificatesLibWrapper = await deployCertificatesLibWrapper();
    const certificates = await getChainOfCertificatesRawBytes(JSON.stringify(jsonAttestation));
    certificateSubject = `0x${certificates[0]}`;
    certificateIssuer = `0x${certificates[1]}`;
  });

  it("Parse certificate", async function () {
    const result = await certificatesLibWrapper.parseCertificate(certificateSubject);
    expect(result[0]).to.equal(2110455735643949053598097832217058602n);
    expect(result[1]).to.equal(1745788199n);
    expect(result[2]).to.equal(1745799002n);
  });

  it("Parse certificate minimal", async function () {
    const result = await certificatesLibWrapper.parseCertificate(certificateSubject);
    const resultMinimal = await certificatesLibWrapper.parseCertificateMinimal(certificateSubject);
    expect(result[0]).to.equal(resultMinimal[0]);
    expect(result[1]).to.equal(resultMinimal[1]);
    expect(result[2]).to.equal(resultMinimal[2]);
  });

  it("Verify signature", async function () {
    const cs = await certificatesLibWrapper.parseCertificate(certificateSubject);
    const ci = await certificatesLibWrapper.parseCertificate(certificateIssuer);
    
    const verified = await certificatesLibWrapper.verifyP384Signature(cs[5], cs[4], ci[3]);
    expect(verified).to.be.true;
  });
});
