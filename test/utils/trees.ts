import { Poseidon } from "@iden3/js-crypto";
import { LeanIMT } from "@openpassport/zk-kit-lean-imt";

export async function getDscTreeFromRegistry(registry: any) {
  const hashFunction = (a: any, b: any) => Poseidon.spongeHashX([a, b], 2);
  const tree = new LeanIMT(hashFunction);

  const fromBlock = 0;
  const toBlock = "latest";
  const eventFilter = registry.filters.DscKeyCommitmentRegistered();
  const events = await registry.queryFilter(eventFilter, fromBlock, toBlock);

  events.forEach((event: any) => {
    const { commitment, timestamp, imtRoot, imtIndex } = event.args;
    console.log(`Event -> Dsc Commitment: ${commitment}, Timestamp: ${timestamp}, IMT Root: ${imtRoot}, IMT Index: ${imtIndex}`);
    tree.insert(commitment);
  });

  return tree;
}
