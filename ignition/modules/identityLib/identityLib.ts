import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { contractsInfo } from "../../../helpers/constants";
import { Poseidon2Module, Poseidon3Module, Poseidon4Module } from "./libraries";

export const SmtLibModule = buildModule("SmtLibModule", (m) => {
  const { poseidon: poseidonUnit2L } = m.useModule(Poseidon2Module);
  const { poseidon: poseidonUnit3L } = m.useModule(Poseidon3Module);

  const smtLib = m.contract(contractsInfo.SMT_LIB.name, [], {
    libraries: {
      PoseidonUnit2L: poseidonUnit2L,
      PoseidonUnit3L: poseidonUnit3L,
    },
  });

  return { smtLib };
});

export const IdentityLibModule = buildModule("IdentityLibModule", (m) => {
  const { smtLib } = m.useModule(SmtLibModule);
  const { poseidon: poseidonUnit3L } = m.useModule(Poseidon3Module);
  const { poseidon: poseidonUnit4L } = m.useModule(Poseidon4Module);

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
