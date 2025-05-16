import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { Id, DID } from "@iden3/js-iden3-core";
import { Merklizer } from "@iden3/js-jsonld-merklization";

export async function setPassportIssuerDID(address: string, did?: string) {
  const contract = await ethers.getContractAt("PassportCredentialIssuerImplV1", address);

  let issuerDid: DID;
  if (did) {
    issuerDid = DID.parse(did);
  } else {
    const contractId = await contract.getId();
    const issuerId = Id.fromBigInt(contractId);
    issuerDid = DID.parseFromId(issuerId);
  }

  const hashv = await Merklizer.hashValue("", issuerDid.string());
  const updateIssuerTx = await contract.setIssuerDIDHash(hashv.toString());
  await updateIssuerTx.wait();

  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;

  console.log(`Issuer DID hash set to ${hashv.toString()} for contract ${contract.target}`);
  console.log(
    "Revocation status info:",
    `${issuerDid.string()}/credentialStatus?contractAddress=${chainId}:${await contract.getAddress()}`,
  );
}

async function main() {
  const networkName = hre.network.config.chainId;

  const deployedAddressesPath = path.join(
    __dirname,
    `../../ignition/deployments/chain-${networkName}/deployed_addresses.json`,
  );
  const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));

  const passportIssuerAddress =
    deployedAddresses["DeployPassportCredentialIssuer#PassportCredentialIssuer"];

  await setPassportIssuerDID(passportIssuerAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
