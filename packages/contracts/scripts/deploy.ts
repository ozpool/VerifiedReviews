import hre from 'hardhat';

/**
 * Deploys the VerifiedReviews contract pair and wires them together:
 *   1. VisitProofSBT  — admin role granted to the deployer
 *   2. ReviewRegistry — bound to the SBT address
 *
 * Run locally:    pnpm -F @vr/contracts deploy:local
 * Run on testnet: pnpm -F @vr/contracts deploy:arbitrum   (needs PRIVATE_KEY)
 */
async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer / admin: ${deployer.address}`);

  const Sbt = await ethers.getContractFactory('VisitProofSBT');
  const sbt = await Sbt.deploy(deployer.address);
  await sbt.waitForDeployment();
  const sbtAddr = await sbt.getAddress();
  console.log(`VisitProofSBT:    ${sbtAddr}`);

  const Registry = await ethers.getContractFactory('ReviewRegistry');
  const registry = await Registry.deploy(sbtAddr);
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log(`ReviewRegistry:   ${registryAddr}`);

  console.log('\nAdd these to the api/web environment:');
  console.log(`SBT_ADDR=${sbtAddr}`);
  console.log(`REGISTRY_ADDR=${registryAddr}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
