/**
 * Agent wallet — the AI agent's own EOA on Kite Chain
 * It pays gas + attestation fees autonomously
 */
const { ethers } = require("ethers");

let _provider = null;
let _wallet   = null;

function getProvider() {
  if (!_provider) {
    _provider = new ethers.providers.JsonRpcProvider(
      process.env.KITE_RPC_URL || "https://rpc-testnet.gokite.ai/"
    );
  }
  return _provider;
}

function getWallet() {
  if (!_wallet) {
    if (!process.env.AGENT_PRIVATE_KEY) {
      throw new Error("AGENT_PRIVATE_KEY not set in agent/.env");
    }
    _wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, getProvider());
  }
  return _wallet;
}

async function getAgentInfo() {
  const wallet = getWallet();
  const balance = await wallet.provider.getBalance(wallet.address);
  return {
    address: wallet.address,
    balance: ethers.utils.formatEther(balance),
    network: await wallet.provider.getNetwork(),
  };
}

module.exports = { getProvider, getWallet, getAgentInfo };
