import { expect } from "chai";
import { ethers } from "hardhat";
import { CertiChain } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CertiChain", function () {
  let certichain: CertiChain;
  let owner: SignerWithAddress;
  let issuer: SignerWithAddress;
  let holder: SignerWithAddress;
  let verifier: SignerWithAddress;

  const sampleHash = ethers.keccak256(ethers.toUtf8Bytes("sample-document"));
  const sampleURI = "ipfs://QmSampleHash";

  beforeEach(async function () {
    [owner, issuer, holder, verifier] = await ethers.getSigners();

    const CertiChain = await ethers.getContractFactory("CertiChain");
    certichain = await CertiChain.deploy();
    await certichain.waitForDeployment();

    // Grant issuer role
    await certichain.addIssuer(issuer.address);
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await certichain.name()).to.equal("CertiChain Document");
      expect(await certichain.symbol()).to.equal("CERT");
    });

    it("Should grant admin roles to deployer", async function () {
      const ADMIN_ROLE = await certichain.ADMIN_ROLE();
      expect(await certichain.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Document Issuance", function () {
    it("Should issue a document successfully", async function () {
      const tx = await certichain
        .connect(issuer)
        .issueDocument(sampleHash, holder.address, sampleURI);

      await expect(tx)
        .to.emit(certichain, "DocumentIssued")
        .withArgs(1, sampleHash, issuer.address, holder.address, await getBlockTimestamp());

      expect(await certichain.ownerOf(1)).to.equal(holder.address);
    });

    it("Should reject duplicate document hash", async function () {
      await certichain.connect(issuer).issueDocument(sampleHash, holder.address, sampleURI);

      await expect(
        certichain.connect(issuer).issueDocument(sampleHash, verifier.address, sampleURI)
      ).to.be.revertedWithCustomError(certichain, "DocumentAlreadyExists");
    });

    it("Should reject non-issuer", async function () {
      await expect(
        certichain.connect(holder).issueDocument(sampleHash, holder.address, sampleURI)
      ).to.be.reverted;
    });
  });

  describe("Document Verification", function () {
    beforeEach(async function () {
      await certichain.connect(issuer).issueDocument(sampleHash, holder.address, sampleURI);
    });

    it("Should verify valid document", async function () {
      const [isValid, isRevoked] = await certichain.verifyDocument(1, sampleHash);
      expect(isValid).to.be.true;
      expect(isRevoked).to.be.false;
    });

    it("Should reject mismatched hash", async function () {
      const wrongHash = ethers.keccak256(ethers.toUtf8Bytes("wrong-document"));
      const [isValid] = await certichain.verifyDocument(1, wrongHash);
      expect(isValid).to.be.false;
    });
  });

  describe("Document Revocation", function () {
    beforeEach(async function () {
      await certichain.connect(issuer).issueDocument(sampleHash, holder.address, sampleURI);
    });

    it("Should revoke document", async function () {
      await expect(certichain.connect(issuer).revokeDocument(1, "Expired"))
        .to.emit(certichain, "DocumentRevoked");

      const [, isRevoked] = await certichain.verifyDocument(1, sampleHash);
      expect(isRevoked).to.be.true;
    });

    it("Should reject revocation by non-issuer", async function () {
      await expect(
        certichain.connect(holder).revokeDocument(1, "Test")
      ).to.be.reverted;
    });
  });

  // Helper function
  async function getBlockTimestamp(): Promise<number> {
    const block = await ethers.provider.getBlock("latest");
    return block!.timestamp;
  }
});
