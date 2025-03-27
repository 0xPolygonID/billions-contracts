const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

import type { CircuitSignals } from "snarkjs";
import { groth16 } from "snarkjs";
import fs from "fs";
import { SMT, ChildNodes } from "@openpassport/zk-kit-smt";
import { poseidon2, poseidon3 } from "poseidon-lite";
import path from "path";
import { DscCircuitProof, CircuitArtifacts } from "./types";

import { BigNumberish } from "ethers";
import { generateCircuitInputsDSC } from "../../../passport-circuits/utils/circuits/generateInputs";
import serialized_csca_tree from "./pubkeys/serialized_csca_tree.json";

const dscCircuits: CircuitArtifacts = {
  dsc_sha256_rsa_65537_4096: {
    wasm: "../passport-circuits/build/dsc/dsc_sha256_rsa_65537_4096/dsc_sha256_rsa_65537_4096_js/dsc_sha256_rsa_65537_4096.wasm",
    zkey: "../passport-circuits/build/dsc/dsc_sha256_rsa_65537_4096/dsc_sha256_rsa_65537_4096_final.zkey",
    vkey: "../passport-circuits/build/dsc/dsc_sha256_rsa_65537_4096/dsc_sha256_rsa_65537_4096_vkey.json",
  },
};

export async function generateDscProof(
  dscCertificate: string
): Promise<DscCircuitProof> {
  console.log(CYAN, "=== Start generateDscProof ===", RESET);

  const dscCircuitInputs: CircuitSignals = await generateCircuitInputsDSC(
    dscCertificate,
    serialized_csca_tree
  );

  const startTime = performance.now();
  const dscProof = await groth16.fullProve(
    dscCircuitInputs,
    dscCircuits["dsc_sha256_rsa_65537_4096"].wasm,
    dscCircuits["dsc_sha256_rsa_65537_4096"].zkey
  );
  const endTime = performance.now();
  console.log(
    GREEN,
    `groth16.fullProve execution time: ${((endTime - startTime) / 1000).toFixed(
      2
    )} seconds`,
    RESET
  );

  // Verify the proof
  const vKey = JSON.parse(
    fs.readFileSync(dscCircuits["dsc_sha256_rsa_65537_4096"].vkey, "utf8")
  );
  const isValid = await groth16.verify(
    vKey,
    dscProof.publicSignals,
    dscProof.proof
  );
  if (!isValid) {
    throw new Error("Generated DSC proof verification failed");
  }
  console.log(GREEN, "DSC proof verified successfully", RESET);

  const rawCallData = await groth16.exportSolidityCallData(
    dscProof.proof,
    dscProof.publicSignals
  );
  const fixedProof = parseSolidityCalldata(rawCallData, {} as DscCircuitProof);
  console.log(CYAN, "=== End generateDscProof ===", RESET);
  return fixedProof;
}

export function parseSolidityCalldata<T>(rawCallData: string, _type: T): T {
  const parsed = JSON.parse("[" + rawCallData + "]");

  return {
    a: parsed[0].map((x: string) => x.replace(/"/g, "")) as [
      BigNumberish,
      BigNumberish
    ],
    b: parsed[1].map((arr: string[]) =>
      arr.map((x: string) => x.replace(/"/g, ""))
    ) as [[BigNumberish, BigNumberish], [BigNumberish, BigNumberish]],
    c: parsed[2].map((x: string) => x.replace(/"/g, "")) as [
      BigNumberish,
      BigNumberish
    ],
    pubSignals: parsed[3].map((x: string) =>
      x.replace(/"/g, "")
    ) as BigNumberish[],
  } as T;
}

export function getSMTs() {
  const passportNo_smt = importSMTFromJsonFile(
    "./test/utils/ofacdata/outputs/passportNoAndNationalitySMT.json"
  ) as SMT;
  const nameAndDob_smt = importSMTFromJsonFile(
    "./test/utils/ofacdata/outputs/nameAndDobSMT.json"
  ) as SMT;
  const nameAndYob_smt = importSMTFromJsonFile(
    "./test/utils/ofacdata/outputs/nameAndYobSMT.json"
  ) as SMT;

  return {
    passportNo_smt,
    nameAndDob_smt,
    nameAndYob_smt,
  };
}

function importSMTFromJsonFile(filePath?: string): SMT | null {
  try {
    const jsonString = fs.readFileSync(
      path.resolve(process.cwd(), filePath as string),
      "utf8"
    );

    const data = JSON.parse(jsonString);

    const hash2 = (childNodes: ChildNodes) =>
      childNodes.length === 2 ? poseidon2(childNodes) : poseidon3(childNodes);
    const smt = new SMT(hash2, true);
    smt.import(data);

    return smt;
  } catch (error) {
    console.error("Failed to import SMT from JSON file:", error);
    return null;
  }
}
