import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DeployAnonAadhaarVerifier", (m) => {
  const deployedContract = m.contract("Verifier_anon_aadhaar_v1");
  return { deployedContract };
});
