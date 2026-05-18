/**
 * Demo Data Seeding Script for TrustMart
 * 
 * This script creates demo products from multiple seller wallets
 * Run this ONCE to populate the marketplace for testing/demo
 * 
 * Usage:
 * 1. Set up test wallets in MetaMask (Seller 1, Seller 2, Seller 3, etc.)
 * 2. Ensure each has KITE testnet tokens from faucet
 * 3. Connect first wallet to the app
 * 4. Open browser console (F12) and paste this script
 * 5. Execute: seedDemoProducts()
 * 
 * Or run via Node.js if you have ethers.js installed
 */

// DEMO PRODUCTS DATA
const DEMO_PRODUCTS = [
  {
    name: "Apple MacBook Pro 14\" (M3)",
    description: "Powerful laptop with M3 chip. 8GB RAM, 512GB SSD. Excellent condition, minimal wear. Includes original charger and box.",
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop",
    price: "0.8", // KITE
    stock: 2,
    category: 0, // Electronics
  },
  {
    name: "Sony WH-1000XM5 Wireless Headphones",
    description: "Premium noise-canceling headphones. Bluetooth 5.3, 8-hour battery, folds compactly. Perfect audio quality.",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop",
    price: "0.35",
    stock: 5,
    category: 0, // Electronics
  },
  {
    name: "iPhone 15 Pro Max (256GB)",
    description: "Latest iPhone with titanium design, 48MP camera, A17 Pro chip. Like new condition, screen protector installed.",
    imageUrl: "https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=500&h=500&fit=crop",
    price: "0.95",
    stock: 1,
    category: 0, // Electronics
  },
  {
    name: "Winter Wool Coat (Medium)",
    description: "Classic wool blend coat, charcoal gray. Perfect for cold weather, barely worn. Dry cleaned and ready to wear.",
    imageUrl: "https://images.unsplash.com/photo-1539533057592-4d14fc9d4a6e?w=500&h=500&fit=crop",
    price: "0.15",
    stock: 3,
    category: 1, // Clothing
  },
  {
    name: "Premium Running Shoes - Nike Air Zoom",
    description: "High-performance running shoes size 10. Cushioned sole, lightweight mesh. Worn only 2 times, like new.",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
    price: "0.12",
    stock: 4,
    category: 1, // Clothing
  },
  {
    name: "Organic Matcha Green Tea Powder",
    description: "Grade A ceremonial matcha from Japan. 100g pure organic powder. Perfect for smoothies or traditional preparation.",
    imageUrl: "https://images.unsplash.com/photo-1597318086395-c21372cced46?w=500&h=500&fit=crop",
    price: "0.08",
    stock: 10,
    category: 2, // Food
  },
  {
    name: "The Art of Computer Programming (Vol 1-3 Set)",
    description: "Complete 3-volume set by Donald Knuth. Hardcover, pristine condition. Essential reference for programmers.",
    imageUrl: "https://images.unsplash.com/photo-1507842217343-583f20270319?w=500&h=500&fit=crop",
    price: "0.25",
    stock: 2,
    category: 3, // Books
  },
  {
    name: "Professional Yoga Mat - Non-Slip",
    description: "6mm thick eco-friendly yoga mat. Non-slip surface, includes carrying strap. Perfect for studio or home practice.",
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&h=500&fit=crop",
    price: "0.18",
    stock: 6,
    category: 4, // Sports
  },
  {
    name: "Ceramic Coffee Maker Set",
    description: "Beautiful handmade ceramic coffee maker with 2 mugs. Dishwasher safe, minimalist design. Unopened in box.",
    imageUrl: "https://images.unsplash.com/photo-1442512595331-e89e6e77de14?w=500&h=500&fit=crop",
    price: "0.22",
    stock: 3,
    category: 5, // Home
  },
  {
    name: "Smart Lighting Installation Service",
    description: "Professional installation of smart home lighting. Includes setup, configuration, and 30-day support. Local area only.",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop",
    price: "0.5",
    stock: 1,
    category: 6, // Services
  },
];

// SELLER WALLETS (you need to provide these)
// For testing, create multiple accounts in MetaMask
const SELLER_WALLETS = [
  "0xYourMainWallet",  // Seller 1
  "0xSecondWallet",     // Seller 2
  "0xThirdWallet",      // Seller 3
];

/**
 * Seeds demo products to the blockchain
 * You must be logged into the app with a connected wallet first
 */
async function seedDemoProducts() {
  // Check if window.trustmart is available (set by the app)
  if (!window.trustmart || !window.trustmart.contracts) {
    console.error("❌ TrustMart not initialized. Make sure you're logged into the app.");
    return;
  }

  const { contracts, account } = window.trustmart;
  if (!contracts.productRegistry) {
    console.error("❌ Product Registry contract not loaded.");
    return;
  }

  console.log("🌱 Starting demo data seeding...");
  console.log("⚠️  Make sure you have KITE tokens for listing fees!");

  let createdCount = 0;

  // Create products
  for (let i = 0; i < DEMO_PRODUCTS.length; i++) {
    const product = DEMO_PRODUCTS[i];
    
    try {
      console.log(`\n📦 Creating product ${i + 1}/${DEMO_PRODUCTS.length}: "${product.name}"`);
      
      const priceWei = ethers.utils.parseEther(product.price);
      const listingFeeWei = ethers.utils.parseEther("0.001");

      const tx = await contracts.productRegistry.createProduct(
        product.name,
        product.description,
        product.imageUrl,
        priceWei,
        product.stock,
        product.category,
        { value: listingFeeWei }
      );

      await tx.wait();
      createdCount++;
      console.log(`✅ Product created successfully!`);
      
      // Wait 2 seconds between transactions to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Failed to create "${product.name}":`, error.message);
    }
  }

  console.log(`\n🎉 Demo seeding complete! Created ${createdCount}/${DEMO_PRODUCTS.length} products`);
  console.log("📊 Refresh the marketplace to see the new products!");
}

// Export for Node.js usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = { DEMO_PRODUCTS, seedDemoProducts };
}
