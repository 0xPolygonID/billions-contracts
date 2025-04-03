import { ethers } from "hardhat";
import { generateCredentialProof, generateSignatureProof } from "../test/utils/generateProof";
import { genMockPassportData } from "../../passport-circuits/utils/passports/genMockPassportData";

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

  const credentialCircuitId = "credential_sha256";
  const signatureCircuitId = "signature_sha256_sha256_sha256_rsa_65537_4096";

  const credentialProof = await generateCredentialProof(mockPassport);
  const signatureProof = await generateSignatureProof(mockPassport);

  await passportCredentialIssuer.verifyPassportCredential(
    credentialCircuitId,
    credentialProof,
    signatureCircuitId,
    signatureProof,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
