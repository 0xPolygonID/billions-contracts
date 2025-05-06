import { ethers } from "hardhat";
import { base64ToBytes, bytesToHex } from "@0xpolygonid/js-sdk";
import jsonAttestationWithUserData from "../test/data/TEEAttestationWithUserData.json";

async function main() {
  const [signer] = await ethers.getSigners();

  const passportCredentialIssuer = await ethers.getContractAt(
    "PassportCredentialIssuer",
    "0xe685CA0179c58C430E3d11532bB21BdFFD06261d",
  ); //"0xe685CA0179c58C430E3d11532bB21BdFFD06261d" //"0x03466F742d46F89a5125734e09e7934D3E11fbE5"); //"0xAbd91B9d85E83529699166933484687f7C7c8898");
  const imageHash = "0xc980e59163ce244bb4bb6211f48c7b46f88a4f40943e84eb99bdc41e129bd293";
  await passportCredentialIssuer.addImageHashToWhitelist(imageHash);
  await passportCredentialIssuer.addTransactor(await signer.getAddress());
  
  console.log("Transactors:", await passportCredentialIssuer.getTransactors());
  console.log("PassportCredentialIssuer version:", await passportCredentialIssuer.VERSION());
  
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
