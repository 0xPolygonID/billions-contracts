import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { poseidonContract } from "circomlibjs";
import { contractsInfo } from "../../../helpers/constants";

export const Poseidon1Module = buildModule("Poseidon1Module", (m) => {
  const nInputs = 1;
  const abi = poseidonContract.generateABI(nInputs);
  const bytecode = poseidonContract.createCode(nInputs);
  const contractName = "Poseidon1Element";

  const poseidon = m.contract(contractName, {
    abi: abi,
    contractName: contractName,
    bytecode: bytecode,
    sourceName: "",
    linkReferences: {},
  });
  return { poseidon };
});

export const Poseidon2Module = buildModule("Poseidon2Module", (m) => {
  const nInputs = 2;
  const abi = poseidonContract.generateABI(nInputs);
  const bytecode = poseidonContract.createCode(nInputs);
  const contractName = contractsInfo.POSEIDON_2.name;

  const poseidon = m.contract(contractName, {
    abi: abi,
    contractName: contractName,
    bytecode: bytecode,
    sourceName: "",
    linkReferences: {},
  });
  return { poseidon };
});

export const Poseidon3Module = buildModule("Poseidon3Module", (m) => {
  const nInputs = 3;
  const abi = poseidonContract.generateABI(nInputs);
  const bytecode = poseidonContract.createCode(nInputs);
  const contractName = contractsInfo.POSEIDON_3.name;

  const poseidon = m.contract(contractName, {
    abi: abi,
    contractName: contractName,
    bytecode: bytecode,
    sourceName: "",
    linkReferences: {},
  });
  return { poseidon };
});

export const Poseidon4Module = buildModule("Poseidon4Module", (m) => {
  const nInputs = 4;
  const abi = poseidonContract.generateABI(nInputs);
  const bytecode = poseidonContract.createCode(nInputs);
  const contractName = contractsInfo.POSEIDON_4.name;

  const poseidon = m.contract(contractName, {
    abi: abi,
    contractName: contractName,
    bytecode: bytecode,
    sourceName: "",
    linkReferences: {},
  });
  return { poseidon };
});

export const Poseidon5Module = buildModule("Poseidon5Module", (m) => {
  const nInputs = 5;
  const abi = poseidonContract.generateABI(nInputs);
  const bytecode = poseidonContract.createCode(nInputs);
  const contractName = contractsInfo.POSEIDON_5.name;

  const poseidon = m.contract(contractName, {
    abi: abi,
    contractName: contractName,
    bytecode: bytecode,
    sourceName: "",
    linkReferences: {},
  });
  return { poseidon };
});

export const Poseidon6Module = buildModule("Poseidon6Module", (m) => {
  const nInputs = 6;
  const abi = poseidonContract.generateABI(nInputs);
  const bytecode = poseidonContract.createCode(nInputs);
  const contractName = contractsInfo.POSEIDON_6.name;

  const poseidon = m.contract(contractName, {
    abi: abi,
    contractName: contractName,
    bytecode: bytecode,
    sourceName: "",
    linkReferences: {},
  });
  return { poseidon };
});

export const SmtLibModule = buildModule("SmtLibModule", (m) => {
  const poseidon2ElementAddress = m.getParameter("poseidon2ElementAddress");
  const poseidon3ElementAddress = m.getParameter("poseidon3ElementAddress");

  const poseidon2Element = m.contractAt(contractsInfo.POSEIDON_2.name, poseidon2ElementAddress);
  const poseidon3Element = m.contractAt(contractsInfo.POSEIDON_3.name, poseidon3ElementAddress);

  const smtLib = m.contract("SmtLib", [], {
    libraries: {
      PoseidonUnit2L: poseidon2Element,
      PoseidonUnit3L: poseidon3Element,
    },
  });
  return { smtLib };
});

export const SpongePoseidonModule = buildModule("SpongePoseidonModule", (m) => {
  const poseidon6ElementAddress = m.getParameter("poseidon6ContractAddress");

  const poseidon6Element = m.contractAt(contractsInfo.POSEIDON_6.name, poseidon6ElementAddress);

  const spongePoseidon = m.contract(contractsInfo.SPONGE_POSEIDON.name, [], {
    libraries: {
      PoseidonUnit6L: poseidon6Element,
    },
  });
  return { spongePoseidon };
});

export const VerifierLibModule = buildModule("VerifierLibModule", (m) => {
  const verifierLib = m.contract("VerifierLib");
  return { verifierLib };
});
