# 🚀 TrustMart Setup Guide 2026

## Quick Start - 5 Minutes to Live Demo

### Prerequisites
- Node.js v18+
- MetaMask browser extension
- KITE testnet tokens (from [faucet](https://faucet.kitescan.ai))

### Step 1: Deploy Contracts
```bash
cd trustmart
npm install
cp .env.example .env
# Edit .env with your private key
npx hardhat run scripts/deploy.js --network kite_testnet
```

### Step 2: Seed 30 Demo Products
```bash
npx hardhat run scripts/seedDemoProducts.js --network kite_testnet
```

### Step 3: Run Frontend
```bash
cd frontend
npm install
npm run dev
```

### Step 4: Open & Demo
- Go to http://localhost:3000
- Connect MetaMask
- See 30 products on marketplace
- Click "Buy Now" to test escrow
- See **Attestation Trail** in order details

---

## 🎬 Demo Flow for Judges

### 1. Show Marketplace (30 Products)
- Browse products page
- Filter by category
- Show realistic product listings

### 2. Make Purchase
- Click product → "Buy Now"
- Confirm in MetaMask
- Show order created

### 3. Show Attestation Trail
- Click "AI Trail" on order
- Expand each attestation
- Click explorer links to show on-chain proof
- **This is the key innovation!**

### 4. Show Seller View (Optional)
- Switch wallet or use second browser
- Show "Connected as: Seller" banner
- Mark as shipped
- Show order tracking

---

## 📋 What Judges Will See

✅ Professional marketplace with 30 products  
✅ Working buy flow with escrow  
✅ **AI Attestation Trail** with on-chain proof  
✅ Complete order lifecycle  
✅ Multi-wallet support (buyer/seller)  

---

## 🔗 Important Links

- **Chain**: https://rpc-testnet.gokite.ai/
- **Explorer**: https://testnet.kitescan.ai
- **Faucet**: https://faucet.kitescan.ai

---

## ✨ Key Feature: Attestation Trail

Every AI decision is recorded on-chain:

```
✅ Delivery Verified (98% confidence)
   "Photo shows package at doorstep"
   Tx: 0xa08fac...742b [View on Kite ↗]

🚨 Fraud Check Passed (92% confidence)  
   "Price within normal range"
   Tx: 0x713cfd...4bd7 [View on Kite ↗]

💰 Funds Released to Seller
   Tx: 0x77b224...34c4 [View on Kite ↗]
```

**Click any link to see real transaction on Kite Chain!**
