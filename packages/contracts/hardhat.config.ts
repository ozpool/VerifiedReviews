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
    // Etherscan V2 multichain endpoint: one key verifies on every supported
    // chain (Arbitrum Sepolia 421614 included), routed by chainId. Supply the
    // key via env in CI/local only. ARBISCAN_API_KEY kept as a legacy fallback.
    apiKey: process.env.ETHERSCAN_API_KEY ?? process.env.ARBISCAN_API_KEY ?? '',
  },
};

export default config;
