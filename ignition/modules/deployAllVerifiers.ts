import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import {
    DEPLOYED_CIRCUITS_CREDENTIAL,
    DEPLOYED_CIRCUITS_SIGNATURE,
    DEPLOYED_CIRCUITS_DSC
} from "../../../passport-circuits/utils/constants/constants";

export default buildModule("DeployAllVerifiers", (m) => {
    const deployedContracts: Record<string, any> = {};
    
    DEPLOYED_CIRCUITS_DSC.forEach(circuit => {
        const contractName = `Verifier_${circuit}`;
        deployedContracts[circuit] = m.contract(contractName);
    });

    DEPLOYED_CIRCUITS_CREDENTIAL.forEach(circuit => {
        const contractName = `Verifier_${circuit}`;
        deployedContracts[circuit] = m.contract(contractName);
    });

    DEPLOYED_CIRCUITS_SIGNATURE.forEach(circuit => {
        const contractName = `Verifier_${circuit}`;
        deployedContracts[circuit] = m.contract(contractName);
    });

    return deployedContracts;
});