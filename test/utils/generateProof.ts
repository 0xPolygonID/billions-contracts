const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

import type { CircuitSignals } from "snarkjs";
import { groth16 } from "snarkjs";
import fs from "fs";
import { CircuitArtifacts, CircuitProof } from "./types";

import { BigNumberish } from "ethers";
import { PassportData, generateCircuitInputsCredential } from "passport-utils";

const credentialCircuits: CircuitArtifacts = {
  credential_sha256: {
    wasm: "./circuits/credential_sha256/credential_sha256.wasm",
    zkey: "./circuits/credential_sha256/credential_sha256.zkey",
    vkey: "./circuits/credential_sha256/credential_sha256_vkey.json",
  },
};

export async function generateCredentialProof(
  passportData: PassportData,
  currentDate?: Date,
  issuanceDate?: Date,
): Promise<CircuitProof> {
  console.log(CYAN, "=== Start generateCredentialProof ===", RESET);
  const credenditalCircuitInputs: CircuitSignals = await generateCircuitInputsCredential(
    passportData,
    currentDate,
    issuanceDate,
  );
  const startTime = performance.now();
  const credentialProof = await groth16.fullProve(
    credenditalCircuitInputs,
    credentialCircuits["credential_sha256"].wasm,
    credentialCircuits["credential_sha256"].zkey,
  );
  const endTime = performance.now();
  console.log(
    GREEN,
    `groth16.fullProve execution time: ${((endTime - startTime) / 1000).toFixed(2)} seconds`,
    RESET,
  );

  // Verify the proof
  const vKey = JSON.parse(fs.readFileSync(credentialCircuits["credential_sha256"].vkey, "utf8"));
  const isValid = await groth16.verify(vKey, credentialProof.publicSignals, credentialProof.proof);
  if (!isValid) {
    throw new Error("Generated Credential proof verification failed");
  }
  console.log(GREEN, "Credential proof verified successfully", RESET);
  console.log(CYAN, "=== End generateCredentialProof ===", RESET);
  return credentialProof;
}

export function parseSolidityCalldata<T>(rawCallData: string, _type: T): T {
  const parsed = JSON.parse("[" + rawCallData + "]");

  return {
    a: parsed[0].map((x: string) => x.replace(/"/g, "")) as [BigNumberish, BigNumberish],
    b: parsed[1].map((arr: string[]) => arr.map((x: string) => x.replace(/"/g, ""))) as [
      [BigNumberish, BigNumberish],
      [BigNumberish, BigNumberish],
    ],
    c: parsed[2].map((x: string) => x.replace(/"/g, "")) as [BigNumberish, BigNumberish],
    pubSignals: parsed[3].map((x: string) => x.replace(/"/g, "")) as BigNumberish[],
  } as T;
}
