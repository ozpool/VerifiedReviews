import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture, time } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';

const BUSINESS_ID = 1n;
const OTHER_BUSINESS_ID = 2n;
const CONTENT_HASH = ethers.id('great pasta, friendly staff');
const OTHER_HASH = ethers.id('went back a second time, still great');
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

    it('accepts boundary rating 1', async () => {
      const { sbt, registry, minter, customer } = await loadFixture(deployFixture);
      await sbt.connect(minter).mint(customer.address, BUSINESS_ID);
      await expect(registry.connect(customer).submit(BUSINESS_ID, CONTENT_HASH, 1)).to.emit(
        registry,
        'ReviewSubmitted',
      );
    });

    it('accepts boundary rating 5', async () => {
      const { sbt, registry, minter, customer } = await loadFixture(deployFixture);
      await sbt.connect(minter).mint(customer.address, BUSINESS_ID);
      await expect(registry.connect(customer).submit(BUSINESS_ID, CONTENT_HASH, 5)).to.emit(
        registry,
        'ReviewSubmitted',
      );
    });
  });

  describe('submit — one review per visit', () => {
    it('reverts a second review off the same VisitProof', async () => {
      const { sbt, registry, minter, customer } = await loadFixture(deployFixture);
      await sbt.connect(minter).mint(customer.address, BUSINESS_ID);
      const [tokenId] = await sbt.latestVisitOf(customer.address, BUSINESS_ID);

      await registry.connect(customer).submit(BUSINESS_ID, CONTENT_HASH, 5);
      await expect(registry.connect(customer).submit(BUSINESS_ID, OTHER_HASH, 4))
        .to.be.revertedWithCustomError(registry, 'AlreadyReviewed')
        .withArgs(tokenId);
    });

    it('marks the VisitProof reviewed after a successful submit', async () => {
      const { sbt, registry, minter, customer } = await loadFixture(deployFixture);
      await sbt.connect(minter).mint(customer.address, BUSINESS_ID);
      const [tokenId] = await sbt.latestVisitOf(customer.address, BUSINESS_ID);

      expect(await registry.reviewed(tokenId)).to.equal(false);
      await registry.connect(customer).submit(BUSINESS_ID, CONTENT_HASH, 5);
      expect(await registry.reviewed(tokenId)).to.equal(true);
    });

    it('lets a new visit (new tokenId) review again', async () => {
      const { sbt, registry, minter, customer } = await loadFixture(deployFixture);
      await sbt.connect(minter).mint(customer.address, BUSINESS_ID);
      await registry.connect(customer).submit(BUSINESS_ID, CONTENT_HASH, 5);

      // A second paid visit mints a fresh tokenId, which can back a new review.
      await sbt.connect(minter).mint(customer.address, BUSINESS_ID);
      await expect(registry.connect(customer).submit(BUSINESS_ID, OTHER_HASH, 3)).to.emit(
        registry,
        'ReviewSubmitted',
      );
    });

    it('keeps each business independent (reviewing one frees neither the other)', async () => {
      const { sbt, registry, admin, minter, customer } = await loadFixture(deployFixture);
      await sbt.connect(admin).setBusinessMinter(OTHER_BUSINESS_ID, minter.address);
      await sbt.connect(minter).mint(customer.address, BUSINESS_ID);
      await sbt.connect(minter).mint(customer.address, OTHER_BUSINESS_ID);

      await registry.connect(customer).submit(BUSINESS_ID, CONTENT_HASH, 5);
      // The other business's VisitProof is a different tokenId — still reviewable.
      await expect(registry.connect(customer).submit(OTHER_BUSINESS_ID, OTHER_HASH, 4)).to.emit(
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
