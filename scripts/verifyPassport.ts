import { ethers } from "hardhat";
import { generateCredentialProof, generateSignatureProof } from "../test/utils/generateProof";
import { genMockPassportData } from "../../passport-circuits/utils/passports/genMockPassportData";
import { packCrossChainProofs, packZKProof, prepareProof } from "../test/utils/packData";

async function main() {
  const passportCredentialIssuerAddress = "0xadd74D74A1C527E3d6B03ADdd25783CC40e90FAb";
  const passportCredentialIssuer = await ethers.getContractAt(
    "PassportCredentialIssuerImplV1",
    passportCredentialIssuerAddress,
  );

  const lastName = "KUZNETSOV";
  const firstName = "VALERIY";

  const mockPassport = genMockPassportData(
    "sha256",
    "sha256",
    "rsa_sha256_65537_4096",
    "UKR",
    "960309",
    "350803",
    "AC1234567",
    lastName,
    firstName,
  );

  const credentialRequestId = 1;
  const signatureRequestId = 2;

  const credentialProof = await generateCredentialProof(mockPassport);
  const signatureProof = await generateSignatureProof(mockPassport);

  const crossChainProofs = packCrossChainProofs([]);
  const metadatas = "0x";

  const credentialPreparedProof = prepareProof(credentialProof.proof);
  const signaturePreparedProof = prepareProof(signatureProof.proof);

  const credentialZkProof = packZKProof(
    credentialProof.publicSignals,
    credentialPreparedProof.pi_a,
    credentialPreparedProof.pi_b,
    credentialPreparedProof.pi_c,
  );

  const signatureZkProof = packZKProof(
    signatureProof.publicSignals,
    signaturePreparedProof.pi_a,
    signaturePreparedProof.pi_b,
    signaturePreparedProof.pi_c,
  );

  await passportCredentialIssuer.submitZKPResponseV2(
    [
      { requestId: credentialRequestId, zkProof: credentialZkProof, data: metadatas },
      { requestId: signatureRequestId, zkProof: signatureZkProof, data: metadatas },
    ],
    crossChainProofs,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
