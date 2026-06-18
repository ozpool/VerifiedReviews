import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';

const BUSINESS_ID = 1n;
const OTHER_BUSINESS_ID = 2n;
const IERC5192_INTERFACE_ID = '0xb45a3c0e';

async function deployFixture() {
  const [admin, minter, customer, stranger] = await ethers.getSigners();
  const Factory = await ethers.getContractFactory('VisitProofSBT');
  const sbt = await Factory.deploy(admin.address);
  await sbt.waitForDeployment();
  await sbt.connect(admin).setBusinessMinter(BUSINESS_ID, minter.address);
  return { sbt, admin, minter, customer, stranger };
}

describe('VisitProofSBT', () => {
  describe('deployment & roles', () => {
    it('grants the admin role to the deployer-specified admin', async () => {
      const { sbt, admin } = await loadFixture(deployFixture);
      const adminRole = await sbt.DEFAULT_ADMIN_ROLE();
      expect(await sbt.hasRole(adminRole, admin.address)).to.equal(true);
    });

    it('exposes name and symbol', async () => {
      const { sbt } = await loadFixture(deployFixture);
      expect(await sbt.name()).to.equal('VisitProof');
      expect(await sbt.symbol()).to.equal('VISIT');
    });
  });

  describe('setBusinessMinter', () => {
    it('lets the admin assign a minter and emits BusinessMinterSet', async () => {
      const { sbt, admin, stranger } = await loadFixture(deployFixture);
      await expect(sbt.connect(admin).setBusinessMinter(OTHER_BUSINESS_ID, stranger.address))
        .to.emit(sbt, 'BusinessMinterSet')
        .withArgs(OTHER_BUSINESS_ID, stranger.address);
      expect(await sbt.businessMinter(OTHER_BUSINESS_ID)).to.equal(stranger.address);
    });

    it('reverts when a non-admin tries to assign a minter', async () => {
      const { sbt, stranger } = await loadFixture(deployFixture);
      await expect(
        sbt.connect(stranger).setBusinessMinter(OTHER_BUSINESS_ID, stranger.address),
      ).to.be.revertedWithCustomError(sbt, 'AccessControlUnauthorizedAccount');
    });
  });

  describe('mint', () => {
    it('mints a soulbound token and records visit data', async () => {
      const { sbt, minter, customer } = await loadFixture(deployFixture);
      await expect(sbt.connect(minter).mint(customer.address, BUSINESS_ID))
        .to.emit(sbt, 'Transfer')
        .withArgs(ethers.ZeroAddress, customer.address, 1n)
        .and.to.emit(sbt, 'Locked')
        .withArgs(1n);

      expect(await sbt.ownerOf(1n)).to.equal(customer.address);
      expect(await sbt.balanceOf(customer.address)).to.equal(1n);
      expect(await sbt.latestVisit(customer.address, BUSINESS_ID)).to.equal(1n);

      const visit = await sbt.visits(1n);
      expect(visit.businessId).to.equal(BUSINESS_ID);
      expect(visit.visitedAt).to.be.greaterThan(0n);
    });

    it('reverts when the caller is not the business minter', async () => {
      const { sbt, stranger, customer } = await loadFixture(deployFixture);
      await expect(sbt.connect(stranger).mint(customer.address, BUSINESS_ID))
        .to.be.revertedWithCustomError(sbt, 'NotBusinessMinter')
        .withArgs(stranger.address, BUSINESS_ID);
    });

    it('reverts when minting for an unconfigured business (no minter set)', async () => {
      const { sbt, minter, customer } = await loadFixture(deployFixture);
      // minter is set for BUSINESS_ID, not OTHER_BUSINESS_ID
      await expect(sbt.connect(minter).mint(customer.address, OTHER_BUSINESS_ID))
        .to.be.revertedWithCustomError(sbt, 'NotBusinessMinter')
        .withArgs(minter.address, OTHER_BUSINESS_ID);
    });

    it('advances latestVisit to the newest token on repeat visits', async () => {
      const { sbt, minter, customer } = await loadFixture(deployFixture);
      await sbt.connect(minter).mint(customer.address, BUSINESS_ID);
      await sbt.connect(minter).mint(customer.address, BUSINESS_ID);
      expect(await sbt.latestVisit(customer.address, BUSINESS_ID)).to.equal(2n);
      expect(await sbt.balanceOf(customer.address)).to.equal(2n);
    });

    it('latestVisitOf returns the newest token and its timestamp', async () => {
      const { sbt, minter, customer } = await loadFixture(deployFixture);
      await sbt.connect(minter).mint(customer.address, BUSINESS_ID);
      const [tokenId, visitedAt] = await sbt.latestVisitOf(customer.address, BUSINESS_ID);
      expect(tokenId).to.equal(1n);
      expect(visitedAt).to.be.greaterThan(0n);
    });

    it('latestVisitOf returns zeros for an account with no visit', async () => {
      const { sbt, stranger } = await loadFixture(deployFixture);
      const [tokenId, visitedAt] = await sbt.latestVisitOf(stranger.address, BUSINESS_ID);
      expect(tokenId).to.equal(0n);
      expect(visitedAt).to.equal(0n);
    });
  });

  describe('soulbound enforcement', () => {
    it('reports tokens as locked', async () => {
      const { sbt, minter, customer } = await loadFixture(deployFixture);
      await sbt.connect(minter).mint(customer.address, BUSINESS_ID);
      expect(await sbt.locked(1n)).to.equal(true);
    });

    it('reverts locked() for a nonexistent token', async () => {
      const { sbt } = await loadFixture(deployFixture);
      await expect(sbt.locked(999n)).to.be.revertedWithCustomError(
        sbt,
        'ERC721NonexistentToken',
      );
    });

    it('reverts transferFrom', async () => {
      const { sbt, minter, customer, stranger } = await loadFixture(deployFixture);
      await sbt.connect(minter).mint(customer.address, BUSINESS_ID);
      await expect(
        sbt.connect(customer).transferFrom(customer.address, stranger.address, 1n),
      ).to.be.revertedWithCustomError(sbt, 'Soulbound');
    });

    it('reverts safeTransferFrom', async () => {
      const { sbt, minter, customer, stranger } = await loadFixture(deployFixture);
      await sbt.connect(minter).mint(customer.address, BUSINESS_ID);
      const safeTransfer = 'safeTransferFrom(address,address,uint256)';
      await expect(
        sbt.connect(customer)[safeTransfer](customer.address, stranger.address, 1n),
      ).to.be.revertedWithCustomError(sbt, 'Soulbound');
    });

    it('reverts transfer even after an approval', async () => {
      const { sbt, minter, customer, stranger } = await loadFixture(deployFixture);
      await sbt.connect(minter).mint(customer.address, BUSINESS_ID);
      await sbt.connect(customer).approve(stranger.address, 1n);
      await expect(
        sbt.connect(stranger).transferFrom(customer.address, stranger.address, 1n),
      ).to.be.revertedWithCustomError(sbt, 'Soulbound');
    });
  });

  describe('supportsInterface', () => {
    it('advertises ERC-5192, ERC-721, and AccessControl', async () => {
      const { sbt } = await loadFixture(deployFixture);
      expect(await sbt.supportsInterface(IERC5192_INTERFACE_ID)).to.equal(true); // ERC-5192
      expect(await sbt.supportsInterface('0x80ac58cd')).to.equal(true); // ERC-721
      expect(await sbt.supportsInterface('0x7965db0b')).to.equal(true); // AccessControl
      expect(await sbt.supportsInterface('0xffffffff')).to.equal(false);
    });
  });
});
