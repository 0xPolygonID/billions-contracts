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

async function main() {
  const networkName = hre.network.config.chainId;

  const deployedAddressesPath = path.join(
    __dirname,
    `../ignition/deployments/chain-${networkName}/deployed_addresses.json`,
  );
  const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));

  const passportCredentialIssuerAddress =
    deployedAddresses["DeployPassportCredentialIssuer#PassportCredentialIssuer"];

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

  const credentialProof = await generateCredentialProof(mockPassport);

  const [signer] = await ethers.getSigners();
  const signedPassportData: PassportDataSigned = {
    linkId: BigInt(credentialProof.publicSignals[2]),
    nullifier: 1n,
  };

  const crossChainProofs = await packSignedPassportData(
    signedPassportData,
    passportCredentialIssuer,
    signer,
  );
  const metadatas = "0x";

  const credentialPreparedProof = prepareProof(credentialProof.proof);

  const credentialZkProof = packZKProof(
    credentialProof.publicSignals,
    credentialPreparedProof.pi_a,
    credentialPreparedProof.pi_b,
    credentialPreparedProof.pi_c,
  );

  const credentialRequestId =
    await passportCredentialIssuer.credentialCircuitIdToRequestIds("credential_sha256");

  await passportCredentialIssuer.submitZKPResponseV2(
    [{ requestId: credentialRequestId, zkProof: credentialZkProof, data: metadatas }],
    crossChainProofs,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
