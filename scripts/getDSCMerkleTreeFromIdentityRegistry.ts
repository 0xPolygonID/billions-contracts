import hre from "hardhat";
import fs from "fs";
import path from "path";
import { LeanIMT } from "@openpassport/zk-kit-lean-imt";
import { Poseidon } from "@iden3/js-crypto";
import { generateMerkleProof } from "../../passport-circuits/utils/trees";
import { DSC_TREE_DEPTH } from "../../passport-circuits/utils/constants/constants";

function getDscTreeInclusionProof(
  leaf: bigint,
  tree: LeanIMT
): [bigint, number[], bigint[], number] {
  const index = tree.indexOf(leaf);
  if (index === -1) {
    throw new Error('Your public key was not found in the registry');
  }
  const { siblings, path, leaf_depth } = generateMerkleProof(tree, index, DSC_TREE_DEPTH);
  return [tree.root, path, siblings, leaf_depth];
}

async function main() {
  const networkName = hre.network.config.chainId;

  const deployedAddressesPath = path.join(
    __dirname,
    `../ignition/deployments/chain-${networkName}/deployed_addresses.json`,
  );
  const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));
  const registryAddress = deployedAddresses["DeployRegistryModule#IdentityRegistry"];
  const registry = await hre.ethers.getContractAt("IdentityRegistryImplV1", registryAddress);
  
  const hashFunction = (a: any, b: any) => Poseidon.spongeHashX([a, b], 2);
  const tree = new LeanIMT(hashFunction);

  const fromBlock = 0;
  const toBlock = "latest";
  const eventFilter = registry.filters.DscKeyCommitmentRegistered();
  const events = await registry.queryFilter(eventFilter, fromBlock, toBlock);

  let latestCommitment = 0n;
  
  events.forEach((event) => {
    const { commitment, timestamp, imtRoot, imtIndex } = event.args;
    console.log(`Event -> Dsc Commitment: ${commitment}, Timestamp: ${timestamp}, IMT Root: ${imtRoot}, IMT Index: ${imtIndex}`);
    tree.insert(commitment);
    latestCommitment = commitment;
  });

  const [root, path2, siblings, leaf_depth] = getDscTreeInclusionProof(latestCommitment, tree);
  console.log(`Inclusion proof for latest commitment ${latestCommitment}:`, root, path2, siblings, leaf_depth);
  console.log(`\nMerkle Root in regitry: ${await registry.getDscKeyCommitmentMerkleRoot()}`);
  console.log(`Merkle Root in local: ${tree.root}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
