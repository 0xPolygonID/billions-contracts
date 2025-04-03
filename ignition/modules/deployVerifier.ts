import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DeployVerifier", (m) => {
    const deployedContracts: Record<string, any> = {};
    
    deployedContracts["credential_sha256"] = m.contract("Verifier_credential_sha256");
    deployedContracts["signature_sha256_sha256_sha256_rsa_65537_4096"] = m.contract("Verifier_signature_sha256_sha256_sha256_rsa_65537_4096");
    return deployedContracts;
});