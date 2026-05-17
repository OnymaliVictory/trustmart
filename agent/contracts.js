/**
 * Contract instances connected to the agent's signer
 */
const { ethers } = require("ethers");
const { getWallet } = require("./wallet");
const path = require("path");
const fs   = require("fs");

function loadABI(name) {
  const p = path.join(__dirname, "../frontend/abis", `${name}.json`);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, "utf8")).abi;
}

function getContracts() {
  const wallet = getWallet();
  const addr   = {
    attestationRegistry: process.env.ATTESTATION_REGISTRY_ADDRESS,
    escrowOrder:         process.env.ESCROW_ORDER_ADDRESS,
    productRegistry:     process.env.PRODUCT_REGISTRY_ADDRESS,
    disputeResolver:     process.env.DISPUTE_RESOLVER_ADDRESS,
  };

  const result = {};

  if (addr.attestationRegistry) {
    const abi = loadABI("AttestationRegistry");
    if (abi.length) result.attestationRegistry = new ethers.Contract(addr.attestationRegistry, abi, wallet);
  }
  if (addr.escrowOrder) {
    const abi = loadABI("EscrowOrder");
    if (abi.length) result.escrowOrder = new ethers.Contract(addr.escrowOrder, abi, wallet);
  }
  if (addr.productRegistry) {
    const abi = loadABI("ProductRegistry");
    if (abi.length) result.productRegistry = new ethers.Contract(addr.productRegistry, abi, wallet);
  }
  if (addr.disputeResolver) {
    const abi = loadABI("DisputeResolver");
    if (abi.length) result.disputeResolver = new ethers.Contract(addr.disputeResolver, abi, wallet);
  }

  return result;
}

module.exports = { getContracts };
