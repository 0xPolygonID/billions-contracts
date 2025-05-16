import { Contract, Signer } from "ethers";
import { PassportData } from "passport-utils";

import type { PublicSignals, Groth16Proof } from "snarkjs";

// Contract imports
import {
  AnonAadhaarCredentialIssuer,
  PassportCredentialIssuer,
} from "../../typechain-types";

export type CircuitProof = any;

// Verifier type imports
import type {
  Verifier_credential_sha256 as ProdCredentialVerifier,
  Verifier_anon_aadhaar_v1 as ProdAnonAadhaarV1Verifier,  
} from "../../typechain-types";

// Type definitions
export type CredentialVerifier = ProdCredentialVerifier;
export type AnonAadhaarVerifier = ProdAnonAadhaarV1Verifier;

export interface BaseActors {
  owner: Signer;
  user1: Signer;
  user2: Signer;
  state: Contract;
  identityLib: Contract;
  idType: string;
}

export interface DeployedActors extends BaseActors {
  mockPassport: PassportData;
  passportCredentialIssuer: Contract;
  certificatesValidator: Contract;
  certificatesValidatorStub: Contract;
  nitroAttestationValidator: Contract;
  proxyAdmin: Contract;
  credentialVerifier: CredentialVerifier;
  expirationTime: bigint;
  maxFutureTime: bigint;
  templateRoot: bigint;
  poseidon3: any;
  poseidon4: any;
  smtLib: any;
}

export interface DeployedActorsAnonAadhaar extends BaseActors {
  anonAadhaarIssuer: Contract;
  proxyAdmin: Contract;
  anonAadhaarVerifier: ProdAnonAadhaarV1Verifier;
  expirationTime: bigint;
  templateRoot: bigint;
  nullifierSeed: bigint;
  publicKeyHashes: bigint[];
  supportedQrVersions: bigint[];
  poseidon3: any;
  poseidon4: any;
  smtLib: any;
}

// Contract type exports
export type { Groth16Proof, PublicSignals };

export type CircuitArtifacts = {
  [key: string]: {
    wasm: string;
    zkey: string;
    vkey: string;
    verifier?: any;
    inputs?: any;
    parsedCallData?: any;
    formattedCallData?: any;
  };
};
