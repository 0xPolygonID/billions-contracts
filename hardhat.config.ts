import { HardhatUserConfig } from "hardhat/config";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ledger";
import dotenv from "dotenv";
dotenv.config();

const DEFAULT_MNEMONIC = "test test test test test test test test test test test junk";
const DEFAULT_ACCOUNTS: any = {
  mnemonic: DEFAULT_MNEMONIC,
  path: "m/44'/60'/0'/0",
  initialIndex: 0,
  count: 20,
};

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.27",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    "billions-main": {
      chainId: 45056,
      url: `${process.env.BILLIONS_MAIN_RPC_URL}`,
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : DEFAULT_ACCOUNTS,
      // ledgerAccounts: [`${process.env.LEDGER_ACCOUNT}`],
    },
    "billions-test": {
      chainId: 6913,
      url: `${process.env.BILLIONS_TEST_RPC_URL}`,
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : DEFAULT_ACCOUNTS,
      // ledgerAccounts: [`${process.env.LEDGER_ACCOUNT}`],
    },
    "privado-main": {
      chainId: 21000,
      url: `${process.env.PRIVADO_MAIN_RPC_URL}`,
      // accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : DEFAULT_ACCOUNTS,
      ledgerAccounts: [`${process.env.LEDGER_ACCOUNT}`],
    },
    "privado-test": {
      chainId: 21001,
      url: `${process.env.PRIVADO_TEST_RPC_URL}`,
      // accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : DEFAULT_ACCOUNTS,
      ledgerAccounts: [`${process.env.LEDGER_ACCOUNT}`],
    },
    "polygon-mainnet": {
      chainId: 137,
      url: `${process.env.POLYGON_MAINNET_RPC_URL}`,
      // accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : DEFAULT_ACCOUNTS,
      ledgerAccounts: [`${process.env.LEDGER_ACCOUNT}`],
    },
    "polygon-amoy": {
      chainId: 80002,
      url: `${process.env.POLYGON_AMOY_RPC_URL}`,
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : DEFAULT_ACCOUNTS,
      //ledgerAccounts: [`${process.env.LEDGER_ACCOUNT}`],
    },
    "ethereum-mainnet": {
      chainId: 1,
      url: `${process.env.ETHEREUM_MAINNET_RPC_URL}`,
      // accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : DEFAULT_ACCOUNTS,
      ledgerAccounts: [`${process.env.LEDGER_ACCOUNT}`],
    },
    "ethereum-sepolia": {
      chainId: 11155111,
      url: `${process.env.ETHEREUM_SEPOLIA_RPC_URL}`,
      // accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : DEFAULT_ACCOUNTS,
      ledgerAccounts: [`${process.env.LEDGER_ACCOUNT}`],
    },
    "zkevm-mainnet": {
      chainId: 1101,
      url: `${process.env.ZKEVM_MAINNET_RPC_URL}`,
      // accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : DEFAULT_ACCOUNTS,
      ledgerAccounts: [`${process.env.LEDGER_ACCOUNT}`],
    },
    "zkevm-cardona": {
      chainId: 2442,
      url: `${process.env.ZKEVM_CARDONA_RPC_URL}`,
      // accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : DEFAULT_ACCOUNTS,
      ledgerAccounts: [`${process.env.LEDGER_ACCOUNT}`],
    },
    "linea-mainnet": {
      chainId: 59144,
      url: `${process.env.LINEA_MAINNET_RPC_URL}`,
      // accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : DEFAULT_ACCOUNTS,
      ledgerAccounts: [`${process.env.LEDGER_ACCOUNT}`],
    },
    "linea-sepolia": {
      chainId: 59141,
      url: `${process.env.LINEA_SEPOLIA_RPC_URL}`,
      // accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : DEFAULT_ACCOUNTS,
      ledgerAccounts: [`${process.env.LEDGER_ACCOUNT}`],
    },
    // hardhat: {
    //   chainId: 80002,
    //   forking: {
    //     url: `${process.env.POLYGON_AMOY_RPC_URL}`,
    //   },
    //   chains: {
    //     80002: {
    //       hardforkHistory: {
    //         london: 10000000,
    //       },
    //     },
    //   },
    //   accounts: [
    //     {
    //       privateKey: process.env.PRIVATE_KEY as string,
    //       balance: "1000000000000000000000000",
    //     },
    //   ],
    // },
    localhost: {
      chainId: 31337,
      url: "http://127.0.0.1:8545",
      timeout: 100000000,
      // accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : DEFAULT_ACCOUNTS,
    },
  },
  etherscan: {
    apiKey: {
      "polygon-amoy": process.env.POLYGON_EXPLORER_API_KEY || "",
      polygon: process.env.POLYGON_EXPLORER_API_KEY || "",
      sepolia: process.env.ETHEREUM_EXPLORER_API_KEY || "",
      mainnet: process.env.ETHEREUM_EXPLORER_API_KEY || "",
      "linea-mainnet": process.env.LINEA_EXPLORER_API_KEY || "",
      "linea-sepolia": process.env.LINEA_EXPLORER_API_KEY || "",
      "zkevm-cardona": process.env.ZKEVM_EXPLORER_API_KEY || "",
      "zkevm-mainnet": process.env.ZKEVM_EXPLORER_API_KEY || "",
      "billions-test": "abc",
    },
    customChains: [
      {
        network: "billions-test",
        chainId: 6913,
        urls: {
          apiURL: "https://billions-testnet-blockscout.eu-north-2.gateway.fm/api/",
          browserURL: "https://docs.blockscout.com",
        },
      },
      {
        network: "billions-main",
        chainId: 45056,
        urls: {
          apiURL: "https://billions-mainnet-blockscout.eu-north-2.gateway.fm/api/",
          browserURL: "https://docs.blockscout.com",
        },
      },
      {
        network: "polygon-amoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://docs.polygonscan.com",
        },
      },
      {
        network: "linea-sepolia",
        chainId: 59141,
        urls: {
          apiURL: "https://api-sepolia.lineascan.build/api",
          browserURL: "https://docs.lineascan.build/sepolia-lineascan",
        },
      },
      {
        network: "linea-mainnet",
        chainId: 59144,
        urls: {
          apiURL: "https://api.lineascan.build/api",
          browserURL: "https://docs.lineascan.build",
        },
      },
      {
        network: "zkevm-cardona",
        chainId: 2442,
        urls: {
          apiURL: "https://api-cardona-zkevm.polygonscan.com/api",
          browserURL: "https://docs.polygonscan.com/cardona-polygon-zkevm",
        },
      },
      {
        network: "zkevm-mainnet",
        chainId: 1101,
        urls: {
          apiURL: "https://api-zkevm.polygonscan.com/api",
          browserURL: "https://docs.polygonscan.com/polygon-zkevm",
        },
      },
    ],
  },
  sourcify: {
    enabled: false
  },
};

export default config;
