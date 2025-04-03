import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import hre from "hardhat";
import fs from "fs";
import path from "path";
// import { getCscaTreeRoot } from "../../../passport-circuits/utils/trees";
// import serialized_csca_tree from "../../../passport-circuits/utils/pubkeys/serialized_csca_tree.json";

module.exports = buildModule("UpdateRegistryCscaRoot", (m) => {
  const networkName = hre.network.config.chainId;

  const merkleRoot = "15431927371695989140013259067008163429003426013407875949435150401147302054488"; // "11564723783687470905289531159397394762331557689010646067107121169440352583550";
  const deployedAddressesPath = path.join(
    __dirname,
    `../deployments/chain-${networkName}/deployed_addresses.json`,
  );
  const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));

  const registryAddress = deployedAddresses["DeployRegistryModule#IdentityRegistry"];

  const deployedRegistryInstance = m.contractAt("IdentityRegistryImplV1", registryAddress);
  console.log("Deployed registry instance", deployedRegistryInstance);
  m.call(deployedRegistryInstance, "updateCscaRoot", [merkleRoot]);
  return { deployedRegistryInstance };
});
