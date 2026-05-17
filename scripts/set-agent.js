/**
 * Wire agent wallet into contracts after deployment
 * Run AFTER: node agent/index.js (to know the agent address)
 *
 * Usage: npx hardhat run scripts/set-agent.js --network kite_testnet
 */
require("dotenv").config();
const { ethers } = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();

  // Load deployed addresses
  const addrPath = path.join(__dirname, "../frontend/config/deployedAddresses.json");
  if (!fs.existsSync(addrPath)) throw new Error("Run deploy.js first!");
  const { contracts } = JSON.parse(fs.readFileSync(addrPath, "utf8"));

  // Derive agent address from AGENT_PRIVATE_KEY
  const agentPrivKey = process.env.AGENT_PRIVATE_KEY;
  if (!agentPrivKey) throw new Error("AGENT_PRIVATE_KEY not set in .env");
  const agentWallet = new ethers.Wallet(agentPrivKey);
  console.log(`\n🤖 Agent wallet: ${agentWallet.address}`);

  // Load contracts
  const EscrowOrder      = await ethers.getContractFactory("EscrowOrder");
  const AttestationReg   = await ethers.getContractFactory("AttestationRegistry");

  const eo = EscrowOrder.attach(contracts.EscrowOrder);
  const ar = AttestationReg.attach(contracts.AttestationRegistry);

  // Set authorized agent on EscrowOrder
  let tx = await eo.connect(deployer).setAuthorizedAgent(agentWallet.address);
  await tx.wait(1);
  console.log(`✅ EscrowOrder.authorizedAgent = ${agentWallet.address}`);

  // Authorize agent to write attestations
  tx = await ar.connect(deployer).setAgentAuthorized(agentWallet.address, true);
  await tx.wait(1);
  console.log(`✅ AttestationRegistry: agent authorized`);

  console.log(`\n🚀 Agent is fully wired! Start it with: cd agent && npm start\n`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
