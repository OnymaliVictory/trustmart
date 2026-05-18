# 🛒 TrustMart – Web3 Escrow Marketplace on Kite Chain

> A production-grade decentralized marketplace secured by smart contract escrow + AI arbitration.
> Built for the **Kite Chain Hackathon 2026**.

![TrustMart](https://img.shields.io/badge/Chain-Kite%20Chain%20Testnet-7c3aed?style=for-the-badge)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-06b6d4?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-13-white?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)

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
- 📊 **Real-time analytics** — platform volume, fees, order counts
- 🌗 **Dark mode UI** — stunning Web3 aesthetic
- 🛍️ **30 Demo Products** — pre-populated marketplace for testing

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
trusmart/
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
│   │   ├── product/[id].js     ← Product detail + buy flow
│   │   ├── seller/
│   │   │   ├── dashboard.js    ← Seller's listings & orders + SELLER BANNER
│   │   │   └── add-product.js  ← Create new listing
│   │   ├── buyer/
│   │   │   └── dashboard.js    ← Order history, AI verification, attestation trail
│   │   └── admin/
│   │       └── index.js        ← Dispute resolution + analytics
│   ├── components/
│   │   ├── AttestationTrail.js ← ✨ Shows AI decision history + on-chain links
│   │   ├── Navbar.js           ← Updated with Buy/Sell navigation
│   │   └── ...
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

## 🚀 Quick Start (Full Setup in ~10 minutes)

### Prerequisites
- Node.js v18+
- npm or yarn
- MetaMask browser extension
- Some testnet KITE (from [Kite Chain faucet](https://faucet.kitescan.ai))

---

### Step 1 — Clone & Install

```bash
# Install contract dependencies (Hardhat + OpenZeppelin)
cd trustmart
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

---

### Step 2 — Configure Environment

```bash
# Root: copy and edit .env
cp .env.example .env
```

Edit `.env`:
```env
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
FEE_RECEIVER_ADDRESS=0xYOUR_FEE_RECEIVER_ADDRESS  # optional, defaults to deployer
KITE_RPC_URL=https://rpc-testnet.gokite.ai/
```

> ⚠️ **Security**: Never commit `.env` with real private keys!

---

### Step 3 — Compile Contracts

```bash
npx hardhat compile
```

Expected output:
```
Compiled 5 Solidity files successfully
```

---

### Step 4 — Deploy to Kite Chain Testnet

```bash
npx hardhat run scripts/deploy.js --network kite_testnet
```

Expected output:
```
═══════════════════════════════════════════════════════
  🛒  TrustMart – Contract Deployment 2026
═══════════════════════════════════════════════════════

ℹ️  Network : kite_testnet (chainId: 2368)
   Deployer: 0xYourAddress...

▶ Deploying ProductRegistry
✅ ProductRegistry deployed
   Address: 0xABC...

▶ Deploying EscrowOrder
✅ EscrowOrder deployed
   Address: 0xDEF...

▶ Deploying DisputeResolver
✅ DisputeResolver deployed
   Address: 0xGHI...

▶ Deploying ReputationSystem
✅ ReputationSystem deployed
   Address: 0xJKL...

▶ Deploying AttestationRegistry
✅ AttestationRegistry deployed
   Address: 0xMNO...

▶ Wiring contracts together
✅ All contracts wired successfully
```

> ✅ The deploy script **automatically** copies ABIs and addresses to the frontend!

---

### Step 5 — Configure Frontend Environment

```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local` with deployed addresses from Step 4 OR just use auto-loaded from `frontend/config/deployedAddresses.json`.

---

### Step 6 — Seed 30 Demo Products

```bash
npx hardhat run scripts/seedDemoProducts.js --network kite_testnet
```

This creates:
- ✅ 6 Electronics (MacBook, iPhone, Headphones, etc.)
- ✅ 6 Clothing (Coat, Shoes, Backpack, etc.)
- ✅ 4 Food (Matcha, Coffee, Honey, etc.)
- ✅ 4 Books (Programming, Self-help, etc.)
- ✅ 4 Sports (Yoga Mat, Dumbbells, etc.)
- ✅ 3 Home (Coffee Maker, Cookware, Smart Lights)
- ✅ 2 Services (Web Consultation, Smart Home Installation)
- ✅ 1 Other (Film Camera Collection)

**All products visible on the marketplace immediately!**

---

### Step 7 — Run the Frontend

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

### Step 8 — Connect MetaMask & Start Testing

1. Open MetaMask
2. Go to the app at `localhost:3000`
3. Click **Connect Wallet**
4. MetaMask will **automatically prompt** to add Kite Chain
5. Click **Approve** — you're connected!
6. See 30 demo products on homepage
7. Click "Buy Now" to test escrow flow
8. See **Attestation Trail** in order details (after AI verification)

---

## 🎬 Demo Flow for Judges

### Scene 1: Browse Marketplace
1. Show homepage with **30 demo products** across all categories
2. Highlight **"Browse Products"** button in header
3. Click a product → see full details

### Scene 2: Make a Purchase
1. Click **"Buy Now"**
2. Confirm order in MetaMask
3. Show order created with PAID status

### Scene 3: Show Seller View (Optional - Switch Wallet)
1. If demoing to multiple people: show seller dashboard
2. Show **"Connected as: Seller"** banner
3. Show products in inventory

### Scene 4: Mark as Shipped
1. Seller adds tracking info
2. Order moves to SHIPPED status

### Scene 5: Verify Delivery with AI
1. Buyer uploads delivery photo
2. AI analyzes photo
3. Shows **Attestation Trail** with:
   - ✅ Photo verification result
   - 🚨 Fraud checks run
   - 💰 Funds release decision
   - 🔗 Links to Kite Chain explorer

### Scene 6: Show Attestation Trail
1. Click **"AI Trail"** button on order
2. Expand each attestation
3. **Click explorer link** to show on-chain proof
4. Show decision recorded permanently on blockchain

---

## 📋 Order State Machine

```
                    ┌─────────────────────────────────────┐
                    │                                     │
    createOrder()   ▼         markShipped()               │
──────────────► [PAID] ─────────────────► [SHIPPED]       │
                 │   │                       │   │        │
      cancel()  │   │ raiseDispute()        │   │ raiseDispute()
                 │   │                       │   │
                 ▼   └──────┐    confirmDelivery() │
            [CANCELLED]     │    ◄────────────────┘
                            ▼
                       [DISPUTED] ──resolveDispute()──► [COMPLETED]
                                 ──resolveDispute()──► [REFUNDED]
                            │
                 autoRelease() (21d)
                            │
                            ▼
                       [COMPLETED] ← funds → seller
```

---

## 🔐 Security Features

- **ReentrancyGuard** on all fund-moving functions
- **Per-order locking** (anti-double-spend `notLocked` modifier)
- **Ownable + AccessControl** for admin functions
- **Pausable** emergency circuit breaker
- **Input validation** on all user-facing functions
- **Overpayment refund** — excess KITE returned automatically
- **EmergencyWithdraw** — only when paused, only owner
- **On-chain attestation** — immutable AI decision records

---

## 🎯 Hackathon Winning Features (2026)

1. **Full escrow state machine** — 7 states, 5 valid transitions, timeout automation
2. **AI-powered arbitration** — Claude AI verifies deliveries, detects fraud, makes decisions
3. **Attestation trail** — permanent on-chain proof of every AI decision with Kite Chain links
4. **NFT reputation badges** — on-chain credibility, automatically minted
5. **Multi-role dispute system** — arbitrators with evidence submission
6. **Platform analytics** — volume, fees, order counts on-chain
7. **Auto-release/auto-refund** — protects both parties from inaction
8. **30 demo products** — pre-populated marketplace for testing
9. **Production UI** — dark mode, animations, responsive design
10. **Comprehensive events** — 15+ events for full indexing

---

## 🌐 Live Links

- **App**: [http://localhost:3000](https://trustmart-ruddy.vercel.app/) 
- **Explorer**: https://testnet.kitescan.ai
- **Faucet**: https://faucet.kitescan.ai

---

## 📜 License

MIT — built with ❤️ for the Kite Chain Hackathon 2026
