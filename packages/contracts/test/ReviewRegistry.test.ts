import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture, time } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';

const BUSINESS_ID = 1n;
const OTHER_BUSINESS_ID = 2n;
const CONTENT_HASH = ethers.id('great pasta, friendly staff');
const SIXTY_DAYS = 60n * 24n * 60n * 60n;

async function deployFixture() {
  const [admin, minter, customer, stranger] = await ethers.getSigners();

  const SbtFactory = await ethers.getContractFactory('VisitProofSBT');
  const sbt = await SbtFactory.deploy(admin.address);
  await sbt.waitForDeployment();
  await sbt.connect(admin).setBusinessMinter(BUSINESS_ID, minter.address);

  const RegistryFactory = await ethers.getContractFactory('ReviewRegistry');
  const registry = await RegistryFactory.deploy(await sbt.getAddress());
  await registry.waitForDeployment();

  return { sbt, registry, admin, minter, customer, stranger };
}

describe('ReviewRegistry', () => {
  describe('configuration', () => {
    it('points at the VisitProofSBT and exposes the recency window', async () => {
      const { sbt, registry } = await loadFixture(deployFixture);
      expect(await registry.sbt()).to.equal(await sbt.getAddress());
      expect(await registry.RECENCY_WINDOW()).to.equal(SIXTY_DAYS);
    });
  });

  describe('submit — gate', () => {
    it('accepts a review from a holder with a fresh VisitProof', async () => {
      const { sbt, registry, minter, customer } = await loadFixture(deployFixture);
      await sbt.connect(minter).mint(customer.address, BUSINESS_ID);

      await expect(registry.connect(customer).submit(BUSINESS_ID, CONTENT_HASH, 5))
        .to.emit(registry, 'ReviewSubmitted')
        .withArgs(BUSINESS_ID, customer.address, CONTENT_HASH, 5, anyValue);
    });

    it('reverts when the submitter holds no VisitProof for the business', async () => {
      const { registry, stranger } = await loadFixture(deployFixture);
      await expect(registry.connect(stranger).submit(BUSINESS_ID, CONTENT_HASH, 5))
        .to.be.revertedWithCustomError(registry, 'NoVisitProof')
        .withArgs(stranger.address, BUSINESS_ID);
    });

    it('reverts when the submitter has a proof for a different business only', async () => {
      const { sbt, registry, admin, minter, customer } = await loadFixture(deployFixture);
      // Give the customer a proof for OTHER_BUSINESS_ID, then review BUSINESS_ID.
      await sbt.connect(admin).setBusinessMinter(OTHER_BUSINESS_ID, minter.address);
      await sbt.connect(minter).mint(customer.address, OTHER_BUSINESS_ID);

      await expect(registry.connect(customer).submit(BUSINESS_ID, CONTENT_HASH, 5))
        .to.be.revertedWithCustomError(registry, 'NoVisitProof')
        .withArgs(customer.address, BUSINESS_ID);
    });
  });

  describe('submit — rating validation', () => {
    it('reverts on a zero rating', async () => {
      const { sbt, registry, minter, customer } = await loadFixture(deployFixture);
      await sbt.connect(minter).mint(customer.address, BUSINESS_ID);
      await expect(registry.connect(customer).submit(BUSINESS_ID, CONTENT_HASH, 0))
        .to.be.revertedWithCustomError(registry, 'InvalidRating')
        .withArgs(0);
    });

    it('reverts on a rating above 5', async () => {
      const { sbt, registry, minter, customer } = await loadFixture(deployFixture);
      await sbt.connect(minter).mint(customer.address, BUSINESS_ID);
      await expect(registry.connect(customer).submit(BUSINESS_ID, CONTENT_HASH, 6))
        .to.be.revertedWithCustomError(registry, 'InvalidRating')
        .withArgs(6);
    });

    it('checks the rating before the gate (rejects bad rating even with no proof)', async () => {
      const { registry, stranger } = await loadFixture(deployFixture);
      await expect(
        registry.connect(stranger).submit(BUSINESS_ID, CONTENT_HASH, 9),
      ).to.be.revertedWithCustomError(registry, 'InvalidRating');
    });

    it('accepts both boundary ratings 1 and 5', async () => {
      const { sbt, registry, minter, customer } = await loadFixture(deployFixture);
      await sbt.connect(minter).mint(customer.address, BUSINESS_ID);
      await expect(registry.connect(customer).submit(BUSINESS_ID, CONTENT_HASH, 1)).to.emit(
        registry,
        'ReviewSubmitted',
      );
      await expect(registry.connect(customer).submit(BUSINESS_ID, CONTENT_HASH, 5)).to.emit(
        registry,
        'ReviewSubmitted',
      );
    });
  });

  describe('submit — recency window', () => {
    it('accepts a review well within the window (30 days later)', async () => {
      const { sbt, registry, minter, customer } = await loadFixture(deployFixture);
      await sbt.connect(minter).mint(customer.address, BUSINESS_ID);
      const [, visitedAt] = await sbt.latestVisitOf(customer.address, BUSINESS_ID);

      await time.setNextBlockTimestamp(visitedAt + SIXTY_DAYS / 2n);
      await expect(registry.connect(customer).submit(BUSINESS_ID, CONTENT_HASH, 4)).to.emit(
        registry,
        'ReviewSubmitted',
      );
    });

    it('accepts a review at exactly the 60-day boundary (inclusive)', async () => {
      const { sbt, registry, minter, customer } = await loadFixture(deployFixture);
      await sbt.connect(minter).mint(customer.address, BUSINESS_ID);
      const [, visitedAt] = await sbt.latestVisitOf(customer.address, BUSINESS_ID);

      await time.setNextBlockTimestamp(visitedAt + SIXTY_DAYS);
      await expect(registry.connect(customer).submit(BUSINESS_ID, CONTENT_HASH, 5)).to.emit(
        registry,
        'ReviewSubmitted',
      );
    });

    it('reverts one second past the 60-day window', async () => {
      const { sbt, registry, minter, customer } = await loadFixture(deployFixture);
      await sbt.connect(minter).mint(customer.address, BUSINESS_ID);
      const [, visitedAt] = await sbt.latestVisitOf(customer.address, BUSINESS_ID);

      await time.setNextBlockTimestamp(visitedAt + SIXTY_DAYS + 1n);
      await expect(
        registry.connect(customer).submit(BUSINESS_ID, CONTENT_HASH, 5),
      ).to.be.revertedWithCustomError(registry, 'VisitTooOld');
    });
  });
});
