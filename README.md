# 🛒 TrustMart – Web3 Escrow Marketplace on Kite Chain

> A production-grade decentralized marketplace secured by smart contract escrow.
> Built for the **Kite Chain Hackathon**.

![TrustMart](https://img.shields.io/badge/Chain-Kite%20Chain%20Testnet-7c3aed?style=for-the-badge)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-06b6d4?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-13-white?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)

---

## ✨ What is TrustMart?

TrustMart is a **decentralized e-commerce platform** where buyers and sellers transact safely using smart contract escrow. No middlemen. No fraud. Every transaction is secured on Kite Chain.

### Key Features
- 🔒 **Smart contract escrow** — funds locked until delivery confirmed
- ⚖️ **On-chain dispute resolution** — arbitrators resolve conflicts transparently
- 🏅 **NFT reputation badges** — sellers earn Bronze/Silver/Gold/Platinum NFTs
- ⭐ **Verified reviews** — only confirmed buyers can leave reviews
- ⏱️ **Auto-release / auto-refund** — timeout protection for both parties
- 📊 **Real-time analytics** — platform volume, fees, order counts
- 🌗 **Dark mode UI** — stunning Web3 aesthetic

---

## 🏗️ Architecture

```
trustmart/
├── contracts/
│   ├── ProductRegistry.sol    ← Product listings, stock management
│   ├── EscrowOrder.sol        ← Core escrow state machine (CRITICAL)
│   ├── DisputeResolver.sol    ← Multi-role arbitration system
│   └── ReputationSystem.sol   ← On-chain reviews + NFT badges
│
├── scripts/
│   ├── deploy.js              ← Full deployment + ABI export
│   └── seed.js                ← Seed demo products
│
├── frontend/
│   ├── pages/
│   │   ├── index.js           ← Marketplace home
│   │   ├── product/[id].js    ← Product detail + buy flow
│   │   ├── seller/
│   │   │   ├── dashboard.js   ← Seller's listings & orders
│   │   │   └── add-product.js ← Create new listing
│   │   ├── buyer/
│   │   │   └── dashboard.js   ← Order history, confirm, dispute
│   │   └── admin/
│   │       └── index.js       ← Dispute resolution + analytics
│   ├── context/
│   │   └── WalletContext.js   ← MetaMask + contract instances
│   ├── config/
│   │   ├── chain.js           ← Kite Chain config
│   │   └── contracts.js       ← Addresses + ABIs
│   └── utils/
│       └── helpers.js         ← Formatters, utilities
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
- Some testnet KITE (from Kite Chain faucet)

---

## Step 1 — Clone & Install

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

## Step 2 — Configure Environment

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

## Step 3 — Compile Contracts

```bash
npx hardhat compile
```

Expected output:
```
Compiled 4 Solidity files successfully
```

If you see errors, check OpenZeppelin version: `npm list @openzeppelin/contracts`

---

## Step 4 — Deploy to Kite Chain Testnet

```bash
npx hardhat run scripts/deploy.js --network kite_testnet
```

Expected output:
```
═══════════════════════════════════════════════════════
  🛒  TrustMart – Contract Deployment
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

▶ Wiring contracts together
✅ EscrowOrder.setDisputeResolver → 0xGHI...
✅ ProductRegistry authorized EscrowOrder
✅ ProductRegistry authorized ReputationSystem

▶ Copying ABIs to frontend
✅ ABI copied: ProductRegistry.json
✅ ABI copied: EscrowOrder.json
✅ ABI copied: DisputeResolver.json
✅ ABI copied: ReputationSystem.json
✅ Contract addresses written to frontend/config/deployedAddresses.json
```

> ✅ The deploy script **automatically** copies ABIs and addresses to the frontend!

---

## Step 5 — Configure Frontend Environment

```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local` with the deployed addresses from Step 4:
```env
NEXT_PUBLIC_PRODUCT_REGISTRY_ADDRESS=0xABC...
NEXT_PUBLIC_ESCROW_ORDER_ADDRESS=0xDEF...
NEXT_PUBLIC_DISPUTE_RESOLVER_ADDRESS=0xGHI...
NEXT_PUBLIC_REPUTATION_SYSTEM_ADDRESS=0xJKL...
```

> Or skip this step — addresses are auto-loaded from `frontend/config/deployedAddresses.json` (written by deploy script).

---

## Step 6 — Seed Demo Products (Optional)

```bash
npx hardhat run scripts/seed.js --network kite_testnet
```

This creates 8 demo products on-chain for testing/demo purposes.

---

## Step 7 — Run the Frontend

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## Step 8 — Connect MetaMask

1. Open MetaMask
2. Go to the app at `localhost:3000`
3. Click **Connect Wallet**
4. MetaMask will **automatically prompt** to add Kite Chain
5. Click **Approve** — you're connected!

> TrustMart auto-detects wrong networks and prompts switching to Kite Chain.

---

## 🔗 How Contracts Connect (Post-Deploy Wiring)

After deployment, the contracts are wired together:

```
ProductRegistry
     ↑ authorizedContracts[escrowOrder] = true
     ↑ authorizedContracts[reputationSystem] = true

EscrowOrder
     → calls productRegistry.decreaseStock() on purchase
     → calls productRegistry.restoreStock() on refund/cancel
     ↑ disputeResolver set to DisputeResolver.address

DisputeResolver
     → calls escrowOrder.resolveDispute() when arbitrator decides

ReputationSystem
     → calls productRegistry.updateRating() when review submitted
     → reads escrowOrder.getOrder() to verify buyer
```

### Manual Wiring (if deploy script skipped the wiring):

```javascript
// In Hardhat console or a separate script:
const escrowOrder = await ethers.getContractAt("EscrowOrder", ESCROW_ADDRESS);
const productRegistry = await ethers.getContractAt("ProductRegistry", REGISTRY_ADDRESS);

// Wire DisputeResolver
await escrowOrder.setDisputeResolver(DISPUTE_RESOLVER_ADDRESS);

// Authorize EscrowOrder to update stock
await productRegistry.authorizeContract(ESCROW_ORDER_ADDRESS, true);

// Authorize ReputationSystem to update ratings
await productRegistry.authorizeContract(REPUTATION_SYSTEM_ADDRESS, true);
```

---

## 📋 Contract Function Reference

### ProductRegistry

| Function | Description |
|----------|-------------|
| `createProduct(name, desc, imageUrl, price, stock, category)` | List a product (payable: listing fee) |
| `updateProduct(id, price, stock, desc, imageUrl)` | Edit your listing |
| `setProductStatus(id, active)` | Enable/disable listing |
| `getProduct(id)` | Fetch product data |
| `getProductsBatch(from, count)` | Paginated product fetch |
| `getSellerProducts(addr)` | All product IDs for a seller |

### EscrowOrder

| Function | Description |
|----------|-------------|
| `createOrder(productId, qty, notes)` | Buy a product (payable: price × qty) |
| `markShipped(orderId, trackingInfo)` | Seller marks shipped |
| `confirmDelivery(orderId)` | Buyer confirms — releases funds |
| `raiseDispute(orderId, reason)` | Raise a dispute |
| `cancelOrder(orderId)` | Cancel within 1-hour window |
| `autoRefund(orderId)` | Trigger refund after 7d no-ship |
| `autoRelease(orderId)` | Trigger release after 21d no-confirm |
| `resolveDispute(orderId, refundBuyer)` | Admin: resolve dispute |

### DisputeResolver

| Function | Description |
|----------|-------------|
| `openDispute(orderId, reason)` | Open a dispute |
| `submitEvidence(orderId, content, desc)` | Submit evidence |
| `assignDispute(orderId)` | Arbitrator picks up dispute |
| `resolveDispute(orderId, refundBuyer, resolution)` | Arbitrator resolves |
| `addArbitrator(address)` | Admin: add arbitrator |

### ReputationSystem

| Function | Description |
|----------|-------------|
| `submitReview(orderId, rating, comment)` | Leave review (completed orders only) |
| `getSellerReputation(addr)` | Get seller stats + badge level |
| `getReview(reviewId)` | Get review data |

---

## 🏅 Seller Badge System (NFT)

Sellers automatically earn on-chain NFT badges when they reach sales milestones:

| Badge | Sales Required | Token |
|-------|---------------|-------|
| 🥉 Bronze   | 5 sales   | ERC-721 NFT |
| 🥈 Silver   | 25 sales  | ERC-721 NFT |
| 🥇 Gold     | 100 sales | ERC-721 NFT |
| 💎 Platinum | 500 sales | ERC-721 NFT |

Badges are minted automatically when a review is submitted that pushes the seller over a threshold.

---

## ⚙️ Order State Machine

```
                      ┌─────────────────────────────────────┐
                      │                                     │
      createOrder()   ▼         markShipped()               │
  ──────────────► [PAID] ──────────────────► [SHIPPED]      │
                   │   │                       │   │        │
        cancel()   │   │ raiseDispute()        │   │ raiseDispute()
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

---

## 🎯 Hackathon Winning Features

1. **Full escrow state machine** — 7 states, 5 valid transitions, timeout automation
2. **NFT reputation badges** — on-chain credibility, automatically minted
3. **Dispute arbitration** — multi-role system with evidence submission
4. **Platform analytics** — volume, fees, order counts on-chain
5. **Auto-release/auto-refund** — protects both parties from inaction
6. **Seller verification** — admin can verify top sellers
7. **Real-time frontend** — polls contracts, live updates
8. **Production UI** — dark mode, animations, responsive design
9. **Gas optimization** — batch reads, minimal storage writes
10. **Comprehensive events** — 15+ events for full indexing

---

## 🌐 Live Links (after deployment)

- **App**: http://localhost:3000 (local) or your Vercel/Netlify URL
- **Explorer**: https://testnet.kitescan.ai

---

## 📜 License

MIT — built with ❤️ for the Kite Chain Hackathon
