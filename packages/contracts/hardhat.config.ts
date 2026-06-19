import 'dotenv/config';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ARBITRUM_SEPOLIA_RPC_URL =
  process.env.ARBITRUM_SEPOLIA_RPC_URL ?? 'https://sepolia-rollup.arbitrum.io/rpc';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 },
      // OpenZeppelin v5 uses the `mcopy` opcode; Arbitrum Sepolia supports Cancun.
      evmVersion: 'cancun',
    },
  },
  networks: {
    arbitrumSepolia: {
      url: ARBITRUM_SEPOLIA_RPC_URL,
      chainId: 421614,
      // Empty when PRIVATE_KEY is unset, so the config still loads for compile/test.
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    // Arbiscan verification; key supplied via env in CI/local only.
    apiKey: { arbitrumSepolia: process.env.ARBISCAN_API_KEY ?? '' },
    customChains: [
      {
        network: 'arbitrumSepolia',
        chainId: 421614,
        urls: {
          apiURL: 'https://api-sepolia.arbiscan.io/api',
          browserURL: 'https://sepolia.arbiscan.io',
        },
      },
    ],
  },
};

export default config;
