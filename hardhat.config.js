require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },

  networks: {
    // ── Kite Chain Testnet ──────────────────────────────────
    kite_testnet: {
      url: process.env.KITE_RPC_URL || "https://rpc-testnet.gokite.ai/",
      chainId: 2368,
      accounts: process.env.DEPLOYER_PRIVATE_KEY &&
          process.env.DEPLOYER_PRIVATE_KEY.length >= 64
  ? [process.env.DEPLOYER_PRIVATE_KEY]
  : [],
      gasPrice: "auto",
      timeout: 120000,
    },

    // ── Local Hardhat Node (testing) ────────────────────────
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },

    // ── Hardhat (in-process, default) ──────────────────────
    hardhat: {
      chainId: 31337,
      gas: 12000000,
      blockGasLimit: 12000000,
    },
  },

  // ── Etherscan / Block Explorer Verification ─────────────
  etherscan: {
    apiKey: {
      kite_testnet: process.env.KITESCAN_API_KEY || "no-api-key",
    },
    customChains: [
      {
        network: "kite_testnet",
        chainId: 2368,
        urls: {
          apiURL: "https://testnet.kitescan.ai/api",
          browserURL: "https://testnet.kitescan.ai",
        },
      },
    ],
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },

  mocha: {
    timeout: 60000,
  },
};
