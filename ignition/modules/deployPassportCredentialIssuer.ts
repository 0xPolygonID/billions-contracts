import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { artifacts, ethers } from "hardhat";
import hre from "hardhat";
import fs from "fs";
import path from "path";

function getPassportCredentialIssuerInitializeData() {
  const passportCredentialIssuerArtifact = artifacts.readArtifactSync(
    "PassportCredentialIssuerImplV1",
  );
  return new ethers.Interface(passportCredentialIssuerArtifact.abi);
}

export default buildModule("DeployPassportCredentialIssuer", (m) => {
  const networkName = hre.network.config.chainId;

  const deployedAddressesPath = path.join(
    __dirname,
    `../deployments/chain-${networkName}/deployed_addresses.json`,
  );
  const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));

  const registryAddress = deployedAddresses["DeployRegistryModule#IdentityRegistry"];

  const smtLibAddress = m.contractAt("SmtLib", "0x682364078e26C1626abD2B95109D2019E241F0F6");
  const poseidonUtil3lAddress = m.contractAt("PoseidonUnit3L", "0x5Bc89782d5eBF62663Df7Ce5fb4bc7408926A240");
  const poseidonUtil4lAddress = m.contractAt("PoseidonUnit4L", "0x0695cF2c6dfc438a4E40508741888198A6ccacC2");

  const identityLib = m.contract("IdentityLib", [], {
    libraries: {
      SmtLib: smtLibAddress,
      PoseidonUnit3L: poseidonUtil3lAddress,
      PoseidonUnit4L: poseidonUtil4lAddress,
    },
  });
  const passportCredentialIssuerHubImpl = m.contract("PassportCredentialIssuerImplV1", [], {
    libraries: {
      IdentityLib: identityLib,
    },
  });

  const passportCredentialIssuerInterface = getPassportCredentialIssuerInitializeData();

  const stateContractAddress = "0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124"; // "<StateContractAddress>"; // Replace with actual state contract address
  const idType = "0x0113";
  const expirationTime = BigInt(60 * 60 * 24 * 7); // 1 week
  const templateRoot = BigInt(
    "11355012832755671330307538002239263753806804904003813746452342893352381210514",
  );
  const initializeData = passportCredentialIssuerInterface.encodeFunctionData("initializeIssuer", [
    expirationTime,
    templateRoot,
    registryAddress,
    [],
    [],
    [],
    [],
    stateContractAddress,
    idType,
  ]);

  const passportCredentialIssuer = m.contract("PassportCredentialIssuer", [
    passportCredentialIssuerHubImpl,
    initializeData,
  ]);

  return {
    passportCredentialIssuer,
    passportCredentialIssuerHubImpl,
  };
});
