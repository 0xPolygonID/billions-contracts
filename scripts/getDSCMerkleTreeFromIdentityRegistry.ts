import hre from "hardhat";
import fs from "fs";
import path from "path";
import { getDscTreeFromRegistry } from "../test/utils/trees";

async function main() {
  const networkName = hre.network.config.chainId;

  const deployedAddressesPath = path.join(
    __dirname,
    `../ignition/deployments/chain-${networkName}/deployed_addresses.json`,
  );
  const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));
  const registryAddress = deployedAddresses["DeployRegistryModule#IdentityRegistry"];
  const registry = await hre.ethers.getContractAt("IdentityRegistryImplV1", registryAddress);
  
  const tree = await getDscTreeFromRegistry(registry);

  console.log(`\nMerkle Root in regitry: ${await registry.getDscKeyCommitmentMerkleRoot()}`);
  console.log(`Merkle Root in local: ${tree.root}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
