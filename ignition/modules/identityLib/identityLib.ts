import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { contractsInfo } from "../../../helpers/constants";

export const IdentityLibModule = buildModule("IdentityLibModule", (m) => {
  const poseidon3ElementAddress = m.getParameter("poseidon3ElementAddress");
  const poseidon4ElementAddress = m.getParameter("poseidon4ElementAddress");
  const smtLibAddress = m.getParameter("smtLibAddress");

  const smtLib = m.contractAt(contractsInfo.SMT_LIB.name, smtLibAddress);
  const poseidonUnit3L = m.contractAt(contractsInfo.POSEIDON_3.name, poseidon3ElementAddress);
  const poseidonUnit4L = m.contractAt(contractsInfo.POSEIDON_4.name, poseidon4ElementAddress);

  const identityLib = m.contract("IdentityLib", [], {
    libraries: {
      SmtLib: smtLib,
      PoseidonUnit3L: poseidonUnit3L,
      PoseidonUnit4L: poseidonUnit4L,
    },
  });

  return { identityLib };
});

export default IdentityLibModule;
