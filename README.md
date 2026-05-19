# 🛒 TrustMart – Web3 Escrow Marketplace on Kite Chain

> A production-grade decentralized marketplace secured by smart contract escrow + AI arbitration.
> Built for the **Kite Chain Hackathon 2026**.

![TrustMart](https://img.shields.io/badge/Chain-Kite%20Chain%20Testnet-7c3aed?style=for-the-badge)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-06b6d4?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-13-white?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)

---

## 🚀 Quick Start for Judges (5 Minutes)

### ⚡ **IMPORTANT: Run Locally (NOT Vercel)**

The Vercel link shows the UI only. **You MUST run locally** to see:
- ✅ Auto-confirm order system working
- ✅ AI Agent processing deliveries
- ✅ Funds auto-releasing
- ✅ Full attestation trail

### Step 1: Clone & Install

```bash
# Clone repo
git clone https://github.com/OnymaliVictory/trustmart.git
cd trustmart

# Install all dependencies
npm install
cd frontend && npm install && cd ..
cd agent && npm install && cd ..
```

### Step 2: Set Up MetaMask (Kite Chain Testnet)

1. Open MetaMask
2. Add Network:
   - **Network Name:** Kite Chain Testnet
   - **RPC URL:** `https://rpc-testnet.gokite.ai/`
   - **Chain ID:** `2368`
   - **Currency:** KITE
   - **Explorer:** `https://testnet.kitescan.ai`

3. Get testnet KITE from [Kite Faucet](https://faucet.gokite.ai/)

### Step 3: Start AI Agent (Terminal 1)

```bash
cd agent
npm start
# You should see: "Claude AI Agent running on port 3001"
```

### Step 4: Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
# Open http://localhost:3000
```

### Step 5: Test the Full Flow

**As Seller:**
1. Connect MetaMask wallet
2. Go to "Seller Dashboard"
3. Click "List New Product" → Add a test item
4. See the banner: "✅ Auto-Confirm Active"

**As Buyer (switch wallet):**
1. Connect different MetaMask wallet
2. Go to homepage, click a product
3. Click "Buy Now"
4. See: "✅ Auto-Confirmed" (NO manual confirmation needed!)
5. Confirm delivery

**As Seller (switch back):**
1. Go to "Orders" tab
2. Click "Mark as Shipped" + add tracking
3. Funds auto-release when buyer confirms

✅ **Everything should work perfectly!**

---

## ✨ What is TrustMart?

TrustMart is a **decentralized e-commerce platform** where buyers and sellers transact safely using smart contract escrow + AI arbitration. No middlemen. No fraud. Every transaction is secured on Kite Chain.

### 🎯 Core Innovation: AI Arbitration + Attestation Trail

Every transaction is protected by **Claude AI** that:
- ✅ Verifies delivery photos using computer vision
- ✅ Detects fraud patterns and price anomalies
- ✅ Makes binding arbitration decisions
- ✅ **Records every decision permanently on Kite Chain** (Attestation Trail)

Judges can see the complete AI decision log with clickable Kite Chain explorer links.

### Key Features
- 🔒 **Smart contract escrow** — funds locked until delivery confirmed
- 🤖 **AI arbitration** — Claude AI verifies deliveries & resolves disputes
- 📋 **Attestation trail** — permanent on-chain proof of every AI decision
- ⚖️ **Multi-role dispute resolution** — arbitrators, admins, appeals
- 🏅 **NFT reputation badges** — sellers earn Bronze/Silver/Gold/Platinum NFTs
- ⭐ **Verified reviews** — only confirmed buyers can leave reviews
- ⏱️ **Auto-release / auto-refund** — timeout protection for both parties
- 📊 **Real-time analytics** �� platform volume, fees, order counts
- 🌗 **Dark mode UI** — stunning Web3 aesthetic
- 🛍️ **30 Demo Products** — pre-populated marketplace for testing
- ✅ **Auto-Confirm Orders** — orders confirm instantly, no manual step needed

---

## 📋 Attestation Trail – What Judges See

When judges click any order, they see the complete AI decision log:

```
📋 Attestation Trail — Order #0045
─────────────────────────────────────────
✅ Delivery Verified
   "Photo shows package at doorstep"
   Confidence: 98%
   Tx: 0xa08fac...742b · 3h ago  [View on Kite ↗]

🚨 Fraud Check Passed  
   "Price within normal market range"
   Confidence: 92%
   Tx: 0x713cfd...4bd7 · 5h ago  [View on Kite ↗]

💰 Funds Released to Seller
   Agent executed escrow release
   ⚡ On-chain execution
   Tx: 0x77b224...34c4 · 5h ago  [View on Kite ↗]
─────────────────────────────────────────
🔒 All AI decisions permanently recorded on Kite Chain
```

**Every row = one AI decision + one real transaction hash.**

---

## 🏗️ Architecture

```
trustmart/
├── contracts/
│   ├── ProductRegistry.sol     ← Product listings, stock management
│   ├── EscrowOrder.sol         ← Core escrow state machine (CRITICAL)
│   ├── DisputeResolver.sol     ← Multi-role arbitration system
│   ├── ReputationSystem.sol    ← On-chain reviews + NFT badges
│   └── AttestationRegistry.sol ← Records all AI decisions on-chain
│
├── scripts/
│   ├── deploy.js               ← Full deployment + ABI export
│   ├── seed.js                 ← Original seed script
│   └── seedDemoProducts.js     ← 30 demo products (use this!)
│
├── agent/
│   ├── index.js                ← Claude AI arbitration service
│   ├── actions/
│   │   ├── verifyDelivery.js   ← Photo analysis + confidence scoring
│   │   ├── fraudDetection.js   ← Price anomaly, seller pattern checks
│   │   └── arbitrate.js        ← Dispute resolution logic
│   └── utils/
│       ├── attestation.js      ← Write decisions to AttestationRegistry
│       └── reasoning.js        ← Agent reasoning logs
│
├── frontend/
│   ├── pages/
│   │   ├── index.js            ← Marketplace home (30 demo products visible!)
│   │   ├── product/[id].js     ← Product detail + buy flow (auto-confirm!)
│   │   ├── seller/
│   │   │   ├── dashboard.js    ← Seller's listings & orders
│   │   │   └── add-product.js  ← Create new listing
│   │   ├── buyer/
│   │   │   └── dashboard.js    ← Order history, confirm, dispute
│   │   └── admin/
│   │       └── index.js        ← Dispute resolution + analytics
│   ├── context/
│   │   └── WalletContext.js    ← MetaMask + contract instances
│   ├── config/
│   │   ├── chain.js            ← Kite Chain config
│   │   └── contracts.js        ← Addresses + ABIs
│   └── utils/
│       └── helpers.js          ← Formatters, utilities
│
├── hardhat.config.js
├── package.json
└── .env.example
```

---

## ⛓️ Kite Chain Testnet Configuration

| Parameter | Value |
|-----------|-------|
| Network Name | Kite Chain Testnet |
| RPC URL | `https://rpc-testnet.gokite.ai/` |
| Chain ID | `2368` |
| Currency Symbol | `KITE` |
| Block Explorer | `https://testnet.kitescan.ai` |

---

## 🔧 Detailed Setup (Advanced)

### Prerequisites
- Node.js v18+
- npm or yarn
- MetaMask browser extension
- Kite Chain Testnet KITE tokens (from faucet)

### Deploy Smart Contracts (Optional)

If contracts aren't deployed yet:

```bash
# Compile contracts
npx hardhat compile

# Deploy to Kite Testnet
npx hardhat run scripts/deploy.js --network kite_testnet

# Seed 30 demo products
npx hardhat run scripts/seedDemoProducts.js --network kite_testnet
```

### Start Everything

**Terminal 1 - AI Agent:**
```bash
cd agent
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Local Blockchain (optional, for development):**
```bash
npx hardhat node
```

---

## 📊 Test Scenarios for Judges

### Scenario 1: Successful Order → Auto-Confirm → Auto-Release
1. Seller lists product
2. Buyer purchases → **Auto-Confirms** (NEW!)
3. Seller marks shipped
4. Buyer confirms delivery
5. AI verifies photo → **Funds release automatically**

### Scenario 2: Dispute Resolution
1. Buyer raises dispute with reason
2. AI analyzes both sides
3. Arbitrator reviews on admin panel
4. Decision recorded on Attestation Trail
5. Funds released to winner

### Scenario 3: Auto-Release After Timeout
1. Order ships but buyer doesn't confirm
2. After 21 days → **Auto-release to seller**
3. Transaction recorded on-chain

### Scenario 4: Fraud Detection
1. Suspicious price spike
2. AI flags as anomaly
3. Transaction blocked
4. AI reasoning visible in logs

---

## 🎯 Key Innovations

| Feature | Innovation |
|---------|-----------|
| **Auto-Confirm** | Orders confirm instantly, no manual step |
| **AI Arbitration** | Claude AI makes binding decisions |
| **Attestation Trail** | Every decision recorded on Kite Chain |
| **On-Chain Proof** | All AI reasoning + tx hashes visible |
| **Reputation NFTs** | Sellers earn verifiable credentials |
| **Timeout Protection** | Auto-release/refund after deadline |

---

## 📝 Environment Variables

Create `.env` in root:

```env
NEXT_PUBLIC_RPC_URL=https://rpc-testnet.gokite.ai/
NEXT_PUBLIC_CHAIN_ID=2368
ANTHROPIC_API_KEY=your_claude_api_key
NEXT_PUBLIC_PRODUCT_REGISTRY=0x...
NEXT_PUBLIC_ESCROW_ORDER=0x...
NEXT_PUBLIC_DISPUTE_RESOLVER=0x...
NEXT_PUBLIC_REPUTATION_SYSTEM=0x...
NEXT_PUBLIC_ATTESTATION_REGISTRY=0x...
```

---

## 🧪 Testing Tips

- **Use 2+ MetaMask accounts** for buyer/seller testing
- **Check browser console** (F12) for errors
- **Verify contract addresses** in `frontend/config/contracts.js`
- **Check AI Agent logs** in terminal for reasoning
- **View transactions** on [Kite Testnet Explorer](https://testnet.kitescan.ai)

---

## 🤝 Support

- 📖 [Kite Chain Docs](https://docs.gokite.ai/)
- 💬 [Discord](https://discord.gg/gokite)
- 🐛 [Report Issues](https://github.com/OnymaliVictory/trustmart/issues)

---

## 📜 License

MIT - See LICENSE file

---

**Built with ❤️ for Kite Chain Hackathon 2026**
