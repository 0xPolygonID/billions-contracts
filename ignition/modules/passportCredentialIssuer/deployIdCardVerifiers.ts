import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
// TODO: restore import below when passport-utils is updated
//import { DEPLOYED_CIRCUITS_IDCARD } from "passport-utils";

const DEPLOYED_CIRCUITS_IDCARD = [
  'idcard_sha1',
  'idcard_sha224',
  'idcard_sha256',
  'idcard_sha384',
  'idcard_sha512',
];

export default buildModule("DeployIdCardVerifiers", (m) => {
  const deployedContracts: Record<string, any> = {};

  DEPLOYED_CIRCUITS_IDCARD.forEach((circuit) => {
    const contractName = `Verifier_${circuit}`;
    deployedContracts[circuit] = m.contract(contractName);
  });

  return deployedContracts;
});
