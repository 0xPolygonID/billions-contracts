import { ethers } from "hardhat";
import { base64ToBytes, bytesToHex } from "@0xpolygonid/js-sdk";
import jsonAttestationWithUserData from "../../test/data/TEEAttestationWithUserData.json";
import { contractsInfo } from "../../helpers/constants";
import { getChainOfCertificatesRawBytes } from "../../helpers/validateTEE";

async function main() {
  const [signer] = await ethers.getSigners();

  // Replace with your values
  const passportCredentialIssuerAddress = "0xF9A2332Ce5D8de57269A77B2835A17630858066c"; //"0xe685CA0179c58C430E3d11532bB21BdFFD06261d" //"0x03466F742d46F89a5125734e09e7934D3E11fbE5"); //"0xAbd91B9d85E83529699166933484687f7C7c8898");
  const certificatesValidatorAddress = "0x8553A842f6ed324686656BB83340ea62Ed4dE409";
  const imageHash = "0xededc6be756c1f502dd6be5dfd34aacdc2c59e6518c66dbf8e74a93acff58842";  

  const passportCredentialIssuer = await ethers.getContractAt(
    contractsInfo.PASSPORT_CREDENTIAL_ISSUER.name,
    passportCredentialIssuerAddress,
  );
  // Replace with CertificatesValidator for real tests with valid certificates
  const certificatesValidator = await ethers.getContractAt("CertificatesValidatorStub", certificatesValidatorAddress);

  const imageHashWhitelisted = await passportCredentialIssuer.isWhitelistedImageHash(imageHash);
  const transactors = await passportCredentialIssuer.getTransactors();
  console.log("Transactors:", transactors);
  console.log("ImageHash is whitelisted:", imageHashWhitelisted);

  if (!imageHashWhitelisted) {
    console.log("Adding imageHash ", imageHash);
    await passportCredentialIssuer.addImageHashToWhitelist(imageHash);
  }
  if (!transactors.includes(await signer.getAddress())) {
    console.log("Adding transactor ", await signer.getAddress());
    await passportCredentialIssuer.addTransactor(await signer.getAddress());
  }

  console.log("Transactors:", await passportCredentialIssuer.getTransactors());
  console.log("PassportCredentialIssuer version:", await passportCredentialIssuer.VERSION());

  const certificates = await getChainOfCertificatesRawBytes(
    JSON.stringify(jsonAttestationWithUserData),
  );

  for (let i = 0; i < certificates.length - 1; i++) {
    await certificatesValidator.addCertificateVerification(
      `0x${certificates[i]}`,
      `0x${certificates[i + 1]}`,
    );
  }

  const tx = await passportCredentialIssuer.addSigner(
    `0x${bytesToHex(base64ToBytes(jsonAttestationWithUserData.attestation))}`,
    {
      gasLimit: 30000000,
    },
  );
  await tx.wait();

  console.log("Signers:", await passportCredentialIssuer.getSigners());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
