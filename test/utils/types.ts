import { Contract, Signer } from "ethers";
import { PassportData } from "passport-utils";

import type { PublicSignals, Groth16Proof } from "snarkjs";

// Contract imports
import { PassportCredentialIssuerImplV1 } from "../../typechain-types";

export type CircuitProof = any;

// Verifier type imports
import type { Verifier_credential_sha256 as ProdCredentialVerifier } from "../../typechain-types/contracts/verifiers/credential/Verifier_credential_sha256";

// Type definitions
export type CredentialVerifier = ProdCredentialVerifier;

export interface DeployedActors {
  owner: Signer;
  user1: Signer;
  user2: Signer;
  mockPassport: PassportData;
  passportCredentialIssuer: PassportCredentialIssuerImplV1;
  passportCredentialIssuerImpl: PassportCredentialIssuerImplV1;
  credentialVerifier: CredentialVerifier;
  state: Contract;
  identityLib: Contract;
  idType: string;
  expirationTime: bigint;
  templateRoot: bigint;
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
