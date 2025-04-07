import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import {
    DEPLOYED_CIRCUITS_SIGNATURE,
} from "../../../passport-circuits/utils/constants/constants";

export default buildModule("DeploySignatureVerifiers", (m) => {
    const deployedContracts: Record<string, any> = {};
    
    DEPLOYED_CIRCUITS_SIGNATURE.forEach(circuit => {
        const contractName = `Verifier_${circuit}`;
        deployedContracts[circuit] = m.contract(contractName);
    });

    return deployedContracts;
});