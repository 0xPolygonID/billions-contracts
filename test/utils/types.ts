import { Contract, Signer } from "ethers";
import { PassportData } from "../../../passport-circuits/utils/types";

import type { PublicSignals, Groth16Proof } from "snarkjs";

// Contract imports
import {
  IdentityVerificationHub,
  IdentityVerificationHubImplV1,
  IdentityRegistry,
  IdentityRegistryImplV1,
  PassportCredentialIssuerImplV1,
} from "../../typechain-types";

export type DscCircuitProof = any;
export type SignatureCircuitProof = any;
export type CredentialCircuitProof = any;

// Verifier type imports
import type { Verifier_dsc_sha256_rsa_65537_4096 as ProdDscVerifier } from "../../typechain-types/contracts/verifiers/dsc/Verifier_dsc_sha256_rsa_65537_4096";
import type { Verifier_credential_sha256 as ProdCredentialVerifier } from "../../typechain-types/contracts/verifiers/credential/Verifier_credential_sha256";
import type { Verifier_signature_sha1_sha1_sha1_rsa_65537_4096 as ProdSignatureVerifier } from "../../typechain-types/contracts/verifiers/signature/Verifier_signature_sha1_sha1_sha1_rsa_65537_4096";

// Type definitions
export type DscVerifier = ProdDscVerifier;
export type SignatureVerifier = ProdSignatureVerifier;
export type CredentialVerifier = ProdCredentialVerifier;

export interface DeployedActors {
  hub: IdentityVerificationHubImplV1;
  hubImpl: IdentityVerificationHubImplV1;
  registry: IdentityRegistryImplV1;
  registryImpl: IdentityRegistryImplV1;
  dscVerifier: DscVerifier;
  owner: Signer;
  user1: Signer;
  user2: Signer;
  mockPassport: PassportData;
  passportCredentialIssuer: PassportCredentialIssuerImplV1;
  passportCredentialIssuerImpl: PassportCredentialIssuerImplV1;
  signatureVerifier: SignatureVerifier;
  credentialVerifier: CredentialVerifier;
  state: Contract;
  identityLib: Contract;
  idType: string;
  expirationTime: bigint;
  templateRoot: bigint;
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
