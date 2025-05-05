import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { contractsInfo } from "../../../helpers/constants";


export const IdentityLibModule = buildModule("IdentityLibModule", (m) => {
  const smtLibAddress = m.contractAt(contractsInfo.SMT_LIB.name, contractsInfo.SMT_LIB.unifiedAddress);
  const poseidonUtil3lAddress = m.contractAt(contractsInfo.POSEIDON_3.name, contractsInfo.POSEIDON_3.unifiedAddress);
  const poseidonUtil4lAddress = m.contractAt(contractsInfo.POSEIDON_4.name, contractsInfo.POSEIDON_4.unifiedAddress);

  const identityLib = m.contract("IdentityLib", [], {
    libraries: {
      SmtLib: smtLibAddress,
      PoseidonUnit3L: poseidonUtil3lAddress,
      PoseidonUnit4L: poseidonUtil4lAddress,
    },
  });

  return { identityLib };
});

export default IdentityLibModule;