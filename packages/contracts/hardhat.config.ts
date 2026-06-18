import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

// Network config for Arbitrum Sepolia + deploy scripts land in PR #5.
const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: { enabled: true, runs: 200 },
      // OpenZeppelin v5 uses the `mcopy` opcode; Arbitrum Sepolia supports Cancun.
      evmVersion: 'cancun',
    },
  },
};

export default config;
