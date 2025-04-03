import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { artifacts, ethers } from "hardhat";
import hre from "hardhat";
import fs from "fs";
import path from "path";

function getPassportCredentialIssuerInitializeData() {
    const passportCredentialIssuerArtifact = artifacts.readArtifactSync("PassportCredentialIssuerImplV1");
    return new ethers.Interface(passportCredentialIssuerArtifact.abi);
}

export default buildModule("DeployNewPassportCredentialIssuerAndUpgrade", (m) => {
    const networkName = hre.network.config.chainId;

    const deployedAddressesPath = path.join(__dirname, `../deployments/chain-${networkName}/deployed_addresses.json`);
    const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));

    const passportCredentialIssuerProxyAddress = deployedAddresses["DeployPassportCredentialIssuer#PassportCredentialIssuer"];
    if (!passportCredentialIssuerProxyAddress) {
        throw new Error("PassportCredentialIssuer proxy address not found in deployed_addresses.json");
    }

    const identityLibAddress = deployedAddresses["DeployPassportCredentialIssuer#IdentityLib"];
    const identityLib = m.contractAt("PassportCredentialIssuerImplV1", identityLibAddress);

    const newPassportCredentialIssuerImpl = m.contract("PassportCredentialIssuerImplV1", [], {
        libraries: {
          IdentityLib: identityLib,
        },
        id: "v1_0_1",
      });

    const passportCredentialIssuerInterface = getPassportCredentialIssuerInitializeData();
    
    const registryAddress = deployedAddresses["DeployRegistryModule#IdentityRegistry"];
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

    const passportCredentialIssuerProxy = m.contractAt("PassportCredentialIssuerImplV1", passportCredentialIssuerProxyAddress, { id : "v1_0_1" });

    m.call(passportCredentialIssuerProxy, "upgradeToAndCall", [
        newPassportCredentialIssuerImpl,
        initializeData
    ]);

    return {
        newPassportCredentialIssuerImpl,
        passportCredentialIssuerProxy
    };
});
