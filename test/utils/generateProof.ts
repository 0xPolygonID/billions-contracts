const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

import type { CircuitSignals } from "snarkjs";
import { groth16 } from "snarkjs";
import fs from "fs";
import { DscCircuitProof, CircuitArtifacts, CircuitProof } from "./types";

import { BigNumberish } from "ethers";
import {
  generateCircuitInputsCredential,
  generateCircuitInputsDSC,
  generateCircuitInputsSignature,
} from "../../../passport-circuits/utils/circuits/generateInputs";
import serialized_csca_tree from "./pubkeys/serialized_csca_tree.json";
import serialized_dsc_tree from "../../../passport-circuits/utils/pubkeys/serialized_dsc_tree.json";
import { PassportData } from "../../../passport-circuits/utils/types";
import { packZKProof } from "./packData";

const dscCircuits: CircuitArtifacts = {
  dsc_sha256_rsa_65537_4096: {
    wasm: "../passport-circuits/build/dsc/dsc_sha256_rsa_65537_4096/dsc_sha256_rsa_65537_4096_js/dsc_sha256_rsa_65537_4096.wasm",
    zkey: "../passport-circuits/build/dsc/dsc_sha256_rsa_65537_4096/dsc_sha256_rsa_65537_4096_final.zkey",
    vkey: "../passport-circuits/build/dsc/dsc_sha256_rsa_65537_4096/dsc_sha256_rsa_65537_4096_vkey.json",
  },
};

const credentialCircuits: CircuitArtifacts = {
  credential_sha256: {
    wasm: "../passport-circuits/build/credential/credential_sha256/credential_sha256_js/credential_sha256.wasm",
    zkey: "../passport-circuits/build/credential/credential_sha256/credential_sha256_final.zkey",
    vkey: "../passport-circuits/build/credential/credential_sha256/credential_sha256_vkey.json",
  },
};

const signatureCircuits: CircuitArtifacts = {
  signature_sha256_sha256_sha256_rsa_65537_4096: {
    wasm: "../passport-circuits/build/signature/signature_sha256_sha256_sha256_rsa_65537_4096/signature_sha256_sha256_sha256_rsa_65537_4096_js/signature_sha256_sha256_sha256_rsa_65537_4096.wasm",
    zkey: "../passport-circuits/build/signature/signature_sha256_sha256_sha256_rsa_65537_4096/signature_sha256_sha256_sha256_rsa_65537_4096_final.zkey",
    vkey: "../passport-circuits/build/signature/signature_sha256_sha256_sha256_rsa_65537_4096/signature_sha256_sha256_sha256_rsa_65537_4096_vkey.json",
  },
};

export async function generateDscProof(dscCertificate: string): Promise<DscCircuitProof> {
  console.log(CYAN, "=== Start generateDscProof ===", RESET);

  const dscCircuitInputs: CircuitSignals = await generateCircuitInputsDSC(
    dscCertificate,
    serialized_csca_tree,
  );

  const startTime = performance.now();
  const dscProof = await groth16.fullProve(
    dscCircuitInputs,
    dscCircuits["dsc_sha256_rsa_65537_4096"].wasm,
    dscCircuits["dsc_sha256_rsa_65537_4096"].zkey,
  );
  const endTime = performance.now();
  console.log(
    GREEN,
    `groth16.fullProve execution time: ${((endTime - startTime) / 1000).toFixed(2)} seconds`,
    RESET,
  );

  // Verify the proof
  const vKey = JSON.parse(fs.readFileSync(dscCircuits["dsc_sha256_rsa_65537_4096"].vkey, "utf8"));
  const isValid = await groth16.verify(vKey, dscProof.publicSignals, dscProof.proof);
  if (!isValid) {
    throw new Error("Generated DSC proof verification failed");
  }
  console.log(GREEN, "DSC proof verified successfully", RESET);

  const rawCallData = await groth16.exportSolidityCallData(dscProof.proof, dscProof.publicSignals);
  const fixedProof = parseSolidityCalldata(rawCallData, {} as DscCircuitProof);
  console.log(CYAN, "=== End generateDscProof ===", RESET);
  return fixedProof;
}

export async function generateSignatureProof(
  passportData: PassportData,
): Promise<CircuitProof> {
  console.log(CYAN, "=== Start generateSignatureProof ===", RESET);

  const signatureCircuitInputs: CircuitSignals = await generateCircuitInputsSignature(
    passportData,
    serialized_dsc_tree as string,
    1,
  );

  const startTime = performance.now();
  const signatureProof = await groth16.fullProve(
    signatureCircuitInputs,
    signatureCircuits["signature_sha256_sha256_sha256_rsa_65537_4096"].wasm,
    signatureCircuits["signature_sha256_sha256_sha256_rsa_65537_4096"].zkey,
  );
  const endTime = performance.now();
  console.log(
    GREEN,
    `groth16.fullProve execution time: ${((endTime - startTime) / 1000).toFixed(2)} seconds`,
    RESET,
  );

  // Verify the proof
  const vKey = JSON.parse(
    fs.readFileSync(
      signatureCircuits["signature_sha256_sha256_sha256_rsa_65537_4096"].vkey,
      "utf8",
    ),
  );
  const isValid = await groth16.verify(vKey, signatureProof.publicSignals, signatureProof.proof);
  if (!isValid) {
    throw new Error("Generated Signature proof verification failed");
  }
  console.log(GREEN, "Signature proof verified successfully", RESET);

  /*const rawCallData = await groth16.exportSolidityCallData(
    signatureProof.proof,
    signatureProof.publicSignals,
  );*/
  //const fixedProof = parseSolidityCalldata(rawCallData, {} as CircuitProof);
  console.log(CYAN, "=== End generateSignatureProof ===", RESET);
  //return fixedProof;
  return signatureProof;
}

export async function generateCredentialProof(
  passportData: PassportData,
): Promise<CircuitProof> {
  console.log(CYAN, "=== Start generateCredentialProof ===", RESET);
  const credenditalCircuitInputs: CircuitSignals =
    await generateCircuitInputsCredential(passportData);
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

  /*const rawCallData = await groth16.exportSolidityCallData(
    credentialProof.proof,
    credentialProof.publicSignals,
  );*/

  //const fixedProof = parseSolidityCalldata(rawCallData, {} as CircuitProof);
  //const fixedProof = packZKProof(credentialProof.publicSignals, credentialProof.proof.pi_a, credentialProof.proof.pi_b, credentialProof.proof.pi_c);
  console.log(CYAN, "=== End generateCredentialProof ===", RESET);
  //return fixedProof;
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
