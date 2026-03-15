// test/certificate.test.js — Complete Smart Contract Tests
const { expect }        = require('chai');
const { ethers }        = require('hardhat');
const { loadFixture }   = require('@nomicfoundation/hardhat-toolbox/network-helpers');

// Helper: generate a valid 64-char hex hash
const makeHash = (seed = 'test') => {
  const base = seed.padEnd(32, '0');
  return Buffer.from(base).toString('hex').substring(0, 64).padEnd(64, '0');
};

describe('CertificateRegistry', () => {
  // ── Deploy fixture ──────────────────────────────────────────────────────────
  async function deployFixture() {
    const [owner, admin, user1, user2] = await ethers.getSigners();
    const Factory  = await ethers.getContractFactory('CertificateRegistry');
    const contract = await Factory.deploy();
    return { contract, owner, admin, user1, user2 };
  }

  // ── Deployment ──────────────────────────────────────────────────────────────
  describe('Deployment', () => {
    it('sets the deployer as owner', async () => {
      const { contract, owner } = await loadFixture(deployFixture);
      expect(await contract.owner()).to.equal(owner.address);
    });

    it('sets the deployer as admin', async () => {
      const { contract, owner } = await loadFixture(deployFixture);
      expect(await contract.admins(owner.address)).to.be.true;
    });

    it('starts with zero stats', async () => {
      const { contract } = await loadFixture(deployFixture);
      const [reg, rev, act] = await contract.getStats();
      expect(reg).to.equal(0);
      expect(rev).to.equal(0);
      expect(act).to.equal(0);
    });
  });

  // ── Admin Management ────────────────────────────────────────────────────────
  describe('Admin Management', () => {
    it('owner can add admin', async () => {
      const { contract, owner, admin } = await loadFixture(deployFixture);
      await contract.connect(owner).addAdmin(admin.address);
      expect(await contract.admins(admin.address)).to.be.true;
    });

    it('non-owner cannot add admin', async () => {
      const { contract, user1, admin } = await loadFixture(deployFixture);
      await expect(
        contract.connect(user1).addAdmin(admin.address)
      ).to.be.revertedWith('CertificateRegistry: Only owner');
    });

    it('owner can remove admin', async () => {
      const { contract, owner, admin } = await loadFixture(deployFixture);
      await contract.connect(owner).addAdmin(admin.address);
      await contract.connect(owner).removeAdmin(admin.address);
      expect(await contract.admins(admin.address)).to.be.false;
    });

    it('cannot remove owner as admin', async () => {
      const { contract, owner } = await loadFixture(deployFixture);
      await expect(
        contract.connect(owner).removeAdmin(owner.address)
      ).to.be.revertedWith('Cannot remove owner');
    });
  });

  // ── Certificate Registration ─────────────────────────────────────────────────
  describe('registerCertificate', () => {
    it('admin can register a certificate', async () => {
      const { contract, owner } = await loadFixture(deployFixture);
      const hash = makeHash('cert1');

      await expect(
        contract.connect(owner).registerCertificate(hash, 'user-123', 'QmIPFSHash123')
      ).to.emit(contract, 'CertificateRegistered')
        .withArgs(hash, 'user-123', anyValue, owner.address);
    });

    it('registered certificate is valid', async () => {
      const { contract, owner } = await loadFixture(deployFixture);
      const hash = makeHash('cert2');

      await contract.registerCertificate(hash, 'user-456', '');
      const [isValid, timestamp, userId] = await contract.verifyCertificate(hash);

      expect(isValid).to.be.true;
      expect(timestamp).to.be.gt(0);
      expect(userId).to.equal('user-456');
    });

    it('increments totalRegistered counter', async () => {
      const { contract, owner } = await loadFixture(deployFixture);

      await contract.registerCertificate(makeHash('a'), 'user1', '');
      await contract.registerCertificate(makeHash('b'), 'user2', '');

      const [reg] = await contract.getStats();
      expect(reg).to.equal(2);
    });

    it('rejects invalid hash length', async () => {
      const { contract } = await loadFixture(deployFixture);
      await expect(
        contract.registerCertificate('tooshort', 'user-1', '')
      ).to.be.revertedWith('CertificateRegistry: Hash must be 64 chars (SHA-256)');
    });

    it('rejects empty userId', async () => {
      const { contract } = await loadFixture(deployFixture);
      await expect(
        contract.registerCertificate(makeHash('x'), '', '')
      ).to.be.revertedWith('userId cannot be empty');
    });

    it('rejects duplicate registration', async () => {
      const { contract } = await loadFixture(deployFixture);
      const hash = makeHash('dup');
      await contract.registerCertificate(hash, 'user-1', '');
      await expect(
        contract.registerCertificate(hash, 'user-1', '')
      ).to.be.revertedWith('Certificate already registered and valid');
    });

    it('non-admin cannot register', async () => {
      const { contract, user1 } = await loadFixture(deployFixture);
      await expect(
        contract.connect(user1).registerCertificate(makeHash('z'), 'user-1', '')
      ).to.be.revertedWith('CertificateRegistry: Only admin or owner');
    });
  });

  // ── Certificate Verification ─────────────────────────────────────────────────
  describe('verifyCertificate', () => {
    it('returns false for unregistered certificate', async () => {
      const { contract } = await loadFixture(deployFixture);
      const [isValid, timestamp] = await contract.verifyCertificate(makeHash('never'));
      expect(isValid).to.be.false;
      expect(timestamp).to.equal(0);
    });

    it('returns correct IPFS hash', async () => {
      const { contract } = await loadFixture(deployFixture);
      const hash     = makeHash('ipfs-test');
      const ipfsHash = 'QmTestIPFSHash123456789';

      await contract.registerCertificate(hash, 'user-1', ipfsHash);
      const [, , , returnedIpfs] = await contract.verifyCertificate(hash);
      expect(returnedIpfs).to.equal(ipfsHash);
    });
  });

  // ── Certificate Revocation ───────────────────────────────────────────────────
  describe('revokeCertificate', () => {
    it('admin can revoke a certificate', async () => {
      const { contract } = await loadFixture(deployFixture);
      const hash = makeHash('revoke1');

      await contract.registerCertificate(hash, 'user-1', '');
      await expect(
        contract.revokeCertificate(hash)
      ).to.emit(contract, 'CertificateRevoked');

      const [isValid] = await contract.verifyCertificate(hash);
      expect(isValid).to.be.false;
    });

    it('increments totalRevoked counter', async () => {
      const { contract } = await loadFixture(deployFixture);
      const hash = makeHash('rev-count');
      await contract.registerCertificate(hash, 'user-1', '');
      await contract.revokeCertificate(hash);
      const [, rev] = await contract.getStats();
      expect(rev).to.equal(1);
    });

    it('cannot revoke unregistered certificate', async () => {
      const { contract } = await loadFixture(deployFixture);
      await expect(
        contract.revokeCertificate(makeHash('not-exist'))
      ).to.be.revertedWith('Certificate not found');
    });

    it('cannot revoke already revoked certificate', async () => {
      const { contract } = await loadFixture(deployFixture);
      const hash = makeHash('double-rev');
      await contract.registerCertificate(hash, 'user-1', '');
      await contract.revokeCertificate(hash);
      await expect(
        contract.revokeCertificate(hash)
      ).to.be.revertedWith('Certificate already revoked');
    });

    it('non-admin cannot revoke', async () => {
      const { contract, user1 } = await loadFixture(deployFixture);
      const hash = makeHash('auth-test');
      await contract.registerCertificate(hash, 'user-1', '');
      await expect(
        contract.connect(user1).revokeCertificate(hash)
      ).to.be.revertedWith('CertificateRegistry: Only admin or owner');
    });
  });

  // ── isRegistered ─────────────────────────────────────────────────────────────
  describe('isRegistered', () => {
    it('returns false for unregistered hash', async () => {
      const { contract } = await loadFixture(deployFixture);
      expect(await contract.isRegistered(makeHash('never'))).to.be.false;
    });

    it('returns true for registered hash even after revocation', async () => {
      const { contract } = await loadFixture(deployFixture);
      const hash = makeHash('reg-check');
      await contract.registerCertificate(hash, 'user-1', '');
      await contract.revokeCertificate(hash);
      expect(await contract.isRegistered(hash)).to.be.true;
    });
  });
});

// Helper for chai
const anyValue = () => true;
