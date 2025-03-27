import { Signer } from "ethers";
import { PassportData } from "../../../passport-circuits/utils/types";

import type { 
    PublicSignals,
    Groth16Proof
} from "snarkjs";

// Contract imports
import {
    IdentityVerificationHub,
    IdentityVerificationHubImplV1,
    IdentityRegistry,
    IdentityRegistryImplV1,
} from "../../typechain-types";

import type { 
    IIdentityVerificationHubV1,
    ISignatureCircuitVerifier,
    IDscCircuitVerifier,
    IVcAndDiscloseCircuitVerifier
} from "../../typechain-types";

export type PassportProof = IIdentityVerificationHubV1.PassportProofStruct;
export type SignatureCircuitProof = ISignatureCircuitVerifier.RegisterCircuitProofStruct;
export type DscCircuitProof = IDscCircuitVerifier.DscCircuitProofStruct;
export type VcAndDiscloseHubProof = IIdentityVerificationHubV1.VcAndDiscloseHubProofStruct;
export type VcAndDiscloseProof = IVcAndDiscloseCircuitVerifier.VcAndDiscloseProofStruct;

// Verifier type imports
import type { Verifier_vc_and_disclose as ProdVerifier } from "../../typechain-types/contracts/verifiers/disclose/Verifier_vc_and_disclose";
import type { Verifier_signature_sha256_sha256_sha256_rsa_65537_4096 as ProdSignatureVerifier } from "../../typechain-types/contracts/verifiers/signature/Verifier_signature_sha256_sha256_sha256_rsa_65537_4096";
import type { Verifier_dsc_sha256_rsa_65537_4096 as ProdDscVerifier } from "../../typechain-types/contracts/verifiers/dsc/Verifier_dsc_sha256_rsa_65537_4096";

// Type definitions
export type VcAndDiscloseVerifier = ProdVerifier;
export type SignatureVerifier = ProdSignatureVerifier;
export type DscVerifier = ProdDscVerifier;

export interface DeployedActors {
    hub: IdentityVerificationHubImplV1;
    hubImpl: IdentityVerificationHubImplV1;
    registry: IdentityRegistryImplV1;
    registryImpl: IdentityRegistryImplV1;
    vcAndDisclose: VcAndDiscloseVerifier;
    signature: SignatureVerifier;
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
    PublicSignals
};

export type CircuitArtifacts = {
    [key: string]: {
        wasm: string,
        zkey: string,
        vkey: string,
        verifier?: any,
        inputs?: any,
        parsedCallData?: any,
        formattedCallData?: any,
    }
}