import { Signer } from "ethers";
import { PassportData } from "../../../passport-circuits/utils/types";

import type { PublicSignals, Groth16Proof } from "snarkjs";

// Contract imports
import {
  IdentityVerificationHub,
  IdentityVerificationHubImplV1,
  IdentityRegistry,
  IdentityRegistryImplV1,
} from "../../typechain-types";

export type DscCircuitProof = any;

// Verifier type imports
import type { Verifier_dsc_sha256_rsa_65537_4096 as ProdDscVerifier } from "../../typechain-types/contracts/verifiers/dsc/Verifier_dsc_sha256_rsa_65537_4096";

// Type definitions
export type DscVerifier = ProdDscVerifier;

export interface DeployedActors {
  hub: IdentityVerificationHubImplV1;
  hubImpl: IdentityVerificationHubImplV1;
  registry: IdentityRegistryImplV1;
  registryImpl: IdentityRegistryImplV1;
  dsc: DscVerifier;
  owner: Signer;
  user1: Signer;
  user2: Signer;
  mockPassport: PassportData;
}

// Contract type exports
export type {
  IdentityVerificationHub,
  IdentityVerificationHubImplV1,
  IdentityRegistry,
  IdentityRegistryImplV1,
  Groth16Proof,
  PublicSignals,
};

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
