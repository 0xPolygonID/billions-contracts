export const ATTESTATION_ID = {
  INVALID_ATTESTATION_ID: "0x0000000000000000000000000000000000000000000000000000000000000000",
  E_PASSPORT: "0x0000000000000000000000000000000000000000000000000000000000000001",
};

export const FIELD_PRIME = BigInt(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617",
);

const ORACLE_SIGNING_ADDRESS_HARDHAT = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
// TEST networks Oracle signing address (For now we will use in testnets the same production signing address)
export const ORACLE_SIGNING_ADDRESS_TEST = "0x3e1cFE1b83E7C1CdB0c9558236c1f6C7B203C34e";
// PRODUCTION networks Oracle signing address
export const ORACLE_SIGNING_ADDRESS_PRODUCTION = "0xf0Ae6D287aF14f180E1FAfe3D2CB62537D7b1A82";

type ChainIdInfo = {
  idType: string;
  networkType: string;
  oracleSigningAddress: string;
};

export const chainIdInfoMap: Map<number, ChainIdInfo> = new Map()
  .set(31337, {
    idType: "0x0112",
    networkType: "test",
    oracleSigningAddress: ORACLE_SIGNING_ADDRESS_HARDHAT,
  }) // hardhat
  .set(1101, {
    idType: "0x0114",
    networkType: "main",
    oracleSigningAddress: ORACLE_SIGNING_ADDRESS_PRODUCTION,
  }) // polygon zkevm
  .set(2442, {
    idType: "0x0115",
    networkType: "test",
    oracleSigningAddress: ORACLE_SIGNING_ADDRESS_PRODUCTION,
  }) // polygon cardona
  .set(137, {
    idType: "0x0111",
    networkType: "main",
    oracleSigningAddress: ORACLE_SIGNING_ADDRESS_PRODUCTION,
  }) // polygon main
  .set(80001, {
    idType: "0x0112",
    networkType: "test",
    oracleSigningAddress: ORACLE_SIGNING_ADDRESS_PRODUCTION,
  }) // polygon mumbai
  .set(80002, {
    idType: "0x0113",
    networkType: "test",
    oracleSigningAddress: ORACLE_SIGNING_ADDRESS_PRODUCTION,
  }) // polygon amoy
  .set(1, {
    idType: "0x0121",
    networkType: "main",
    oracleSigningAddress: ORACLE_SIGNING_ADDRESS_PRODUCTION,
  }) // ethereum mainnet
  .set(11155111, {
    idType: "0x0123",
    networkType: "test",
    oracleSigningAddress: ORACLE_SIGNING_ADDRESS_PRODUCTION,
  }) // ethereum sepolia
  .set(21000, {
    idType: "0x01A1",
    networkType: "main",
    oracleSigningAddress: ORACLE_SIGNING_ADDRESS_PRODUCTION,
  }) // privado-main
  .set(21001, {
    idType: "0x01A2",
    networkType: "test",
    oracleSigningAddress: ORACLE_SIGNING_ADDRESS_PRODUCTION,
  }) // privado-test
  .set(59144, {
    idType: "0x0149",
    networkType: "main",
    oracleSigningAddress: ORACLE_SIGNING_ADDRESS_PRODUCTION,
  }) // linea-main
  .set(59141, {
    idType: "0x0148",
    networkType: "test",
    oracleSigningAddress: ORACLE_SIGNING_ADDRESS_PRODUCTION,
  }); // linea-sepolia
