import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import {
  packSignedPassportData,
  packZKProof,
  PassportDataSigned,
  prepareProof,
} from "../test/utils/packData";
import { generateCredentialProof } from "../test/utils/generateProof";
import { genMockPassportData } from "passport-utils";
import { base64ToBytes, bytesToHex } from "@0xpolygonid/js-sdk";
import jsonAttestationWithUserData from "../test/data/TEEAttestationWithUserData.json";

async function main() {

  const passportCredentialIssuer = await ethers.getContractAt(
    "PassportCredentialIssuerImplV1", "0xAbd91B9d85E83529699166933484687f7C7c8898"); //"0x03466F742d46F89a5125734e09e7934D3E11fbE5"); //"0xAbd91B9d85E83529699166933484687f7C7c8898");

  await passportCredentialIssuer.addSigner(
    `0x${bytesToHex(base64ToBytes(jsonAttestationWithUserData.attestation))}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
