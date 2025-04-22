import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { DEPLOYED_CIRCUITS_CREDENTIAL } from "passport-utils";

export default buildModule("DeployCredentialVerifiers", (m) => {
  const deployedContracts: Record<string, any> = {};

  DEPLOYED_CIRCUITS_CREDENTIAL.forEach((circuit) => {
    const contractName = `Verifier_${circuit}`;
    deployedContracts[circuit] = m.contract(contractName);
  });

  return deployedContracts;
});
