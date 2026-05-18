/**
 * IMPORTANT: READ BEFORE USING
 * 
 * This README explains how to seed demo products to your TrustMart marketplace
 * for testing and demo purposes.
 */

# Demo Products Seeding Guide

## Why?
The marketplace needs demo products from multiple sellers so you can:
- ✅ Test the full buyer flow
- ✅ Show judges a populated marketplace
- ✅ Demonstrate multi-seller functionality
- ✅ Verify order tracking works

## Quick Start (5 minutes)

### Step 1: Create Test Wallets
1. Open MetaMask
2. Click your account → **"Create account"**
3. Create 3-4 test seller accounts:
   - "Seller 1" (your main wallet)
   - "Seller 2"
   - "Seller 3"
   - "Buyer" (for testing purchases)

### Step 2: Get Test KITE Tokens
1. Go to Kite Chain Faucet: [https://faucet.kitescan.ai](https://faucet.kitescan.ai)
2. For each wallet, paste the address and request KITE
3. Wait for tokens to arrive (usually instant)
4. You'll need at least ~0.02 KITE per wallet for listing fees

### Step 3: Create Products Manually (Easiest)
Instead of running the script, do this for each seller:

**For Seller 2 (Switch MetaMask):**
1. Go to your app → **"Sell Products"** in header
2. Click **"List New Product"**
3. Fill in the form with data from `seedDemoProducts.js`
4. Click **"Publish Listing"** (costs 0.001 KITE)
5. Repeat 3-4 times with different products

**For Seller 3:**
1. Switch to Seller 3 in MetaMask
2. Repeat the same process

### Step 4: Test Buying
1. Switch MetaMask to **"Buyer"** wallet
2. Go to **"Browse Products"** 
3. See all products from different sellers
4. Click a product → **"Buy Now"**
5. Complete the purchase!

## Demo Products Included

The script includes 10 products across all categories:
- **Electronics**: Laptop, Headphones, iPhone
- **Clothing**: Coat, Running Shoes
- **Food**: Matcha Tea
- **Books**: Programming Books Set
- **Sports**: Yoga Mat
- **Home**: Ceramic Coffee Maker
- **Services**: Smart Lighting Installation

## Manual Seeding Instructions

If you want to use the script instead of manual creation:

### Option A: Browser Console
1. Log into your app with first seller wallet
2. Press **F12** to open DevTools
3. Go to **"Console"** tab
4. Copy-paste the entire `seedDemoProducts.js` content
5. Run: `seedDemoProducts()`
6. Wait for all products to create

### Option B: Node.js Script
```bash
cd frontend
npm install ethers dotenv
node scripts/seedDemoProducts.js
```

## Tips for Success

✅ **Do this:**
- Create products with 2-3 units each (not just 1)
- Use diverse product images
- Write realistic descriptions
- Spread prices from 0.05 to 1.0 KITE

❌ **Avoid this:**
- Don't create all from same wallet (judges won't see diversity)
- Don't use empty/placeholder descriptions
- Don't create 100+ products (wasteful)

## After Seeding

1. **Refresh your Vercel preview**
2. Go to **"Browse Products"**
3. You should see 10+ products from different sellers
4. Click one → see seller info isn't your wallet
5. Try to buy it!

## Troubleshooting

**Q: "This is your product listing" still shows?**
A: You're viewing a product from your own wallet. Try clicking a different product.

**Q: Products not showing up?**
A: Refresh the page, wait 5 seconds for contract calls to finish.

**Q: "Insufficient funds" error?**
A: Get more KITE from faucet for listing fees.

**Q: Can only create 1 product?**
A: Each wallet needs its own KITE. Create products from different wallets.

## For Demo Day

Have 2 browsers open:
- **Browser 1**: Seller wallet (shows listings)
- **Browser 2**: Buyer wallet (shows purchases)

This way judges can see both flows simultaneously!
