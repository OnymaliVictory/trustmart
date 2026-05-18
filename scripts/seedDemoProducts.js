#!/usr/bin/env node

/**
 * TrustMart Demo Products Seeder
 * 
 * Creates 30 demo products across all categories
 * Usage: npx hardhat run scripts/seedDemoProducts.js --network kiteChainTestnet
 */

const hre = require("hardhat");
const { ethers } = hre;

const DEMO_PRODUCTS = [
  // Electronics (6)
  ["Apple MacBook Pro 16\" M3 Max", "High-performance laptop with M3 Max chip. 36GB memory, 1TB SSD. Minimal wear, includes original charger.", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop", ethers.utils.parseEther("1.2"), 3, 0],
  ["Sony WH-1000XM5 Headphones", "Industry-leading noise-canceling. 8-hour battery, premium sound. Excellent condition with original case.", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop", ethers.utils.parseEther("0.45"), 5, 0],
  ["iPhone 15 Pro Max 256GB", "Latest flagship with A17 Pro, 48MP camera, titanium design. Barely used, screen protector installed. Full warranty.", "https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=500&h=500&fit=crop", ethers.utils.parseEther("1.5"), 2, 0],
  ["iPad Air 11-inch (M2)", "Versatile tablet with M2 chip, stunning display. 256GB, Wi-Fi + Cellular. Like new condition.", "https://images.unsplash.com/photo-1559056199-641a0ac8b3f7?w=500&h=500&fit=crop", ethers.utils.parseEther("0.85"), 4, 0],
  ["DJI Air 3S Drone", "Professional 4K drone with excellent stability. 46-minute flight time. Complete with 2 batteries and case.", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop", ethers.utils.parseEther("0.9"), 2, 0],
  ["Sony A6400 Mirrorless Camera", "APS-C mirrorless with 24.2MP sensor. Fast autofocus, 4K video. Includes 2 lenses.", "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&h=500&fit=crop", ethers.utils.parseEther("0.75"), 1, 0],

  // Clothing (6)
  ["Premium Wool Winter Coat", "Charcoal gray wool blend coat. Insulated, water-resistant. Size M. Barely worn, dry cleaned.", "https://images.unsplash.com/photo-1539533057592-4d14fc9d4a6e?w=500&h=500&fit=crop", ethers.utils.parseEther("0.25"), 3, 1],
  ["Nike Air Zoom Running Shoes", "Size 10. Responsive cushioning, lightweight mesh. Worn 3 times, like new.", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop", ethers.utils.parseEther("0.18"), 4, 1],
  ["Luxury Silk Scarves Collection", "Premium handmade silk scarves, 5 pieces. Italian design, various patterns.", "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&h=500&fit=crop", ethers.utils.parseEther("0.35"), 2, 1],
  ["Designer Leather Backpack", "Italian leather with laptop compartment. Professional look, durable. Barely used.", "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop", ethers.utils.parseEther("0.4"), 3, 1],
  ["Vintage Denim Jacket", "Classic blue denim. Size L. Perfect condition. Great for casual or dress-up.", "https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=500&h=500&fit=crop", ethers.utils.parseEther("0.15"), 2, 1],
  ["Cashmere Knit Sweater", "100% pure cashmere in cream. Size S. Ultra soft, luxurious. Only worn once.", "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop", ethers.utils.parseEther("0.3"), 1, 1],

  // Food (4)
  ["Premium Organic Matcha", "Grade A ceremonial matcha from Uji, Japan. 100g pure organic powder.", "https://images.unsplash.com/photo-1597318086395-c21372cced46?w=500&h=500&fit=crop", ethers.utils.parseEther("0.12"), 10, 2],
  ["Single Origin Ethiopian Coffee", "Specialty grade from Yirgacheffe. 500g freshly roasted. Rich, complex flavor.", "https://images.unsplash.com/photo-1559056199-641a0ac8b3f7?w=500&h=500&fit=crop", ethers.utils.parseEther("0.08"), 8, 2],
  ["Artisanal Honey Collection", "3 jars: Manuka, Acacia, Wildflower. 250ml each. Raw, unfiltered, high quality.", "https://images.unsplash.com/photo-1587049537359-08a5a9b0e7e9?w=500&h=500&fit=crop", ethers.utils.parseEther("0.2"), 5, 2],
  ["Organic Superfood Powder", "Spirulina, chlorella, moringa, maca. 200g organic. Perfect for smoothies.", "https://images.unsplash.com/photo-1587049537359-08a5a9b0e7e9?w=500&h=500&fit=crop", ethers.utils.parseEther("0.15"), 6, 2],

  // Books (4)
  ["The Art of Computer Programming Set", "Complete 3-volume boxed set by Donald Knuth. Pristine condition. Essential reference.", "https://images.unsplash.com/photo-1507842217343-583f20270319?w=500&h=500&fit=crop", ethers.utils.parseEther("0.35"), 1, 3],
  ["Clean Code by Robert C. Martin", "Signed first edition. Guide to readable code. Excellent condition with dust jacket.", "https://images.unsplash.com/photo-1507842217343-583f20270319?w=500&h=500&fit=crop", ethers.utils.parseEther("0.08"), 3, 3],
  ["Atomic Habits", "Bestselling self-improvement book. Practical habit strategies. Paperback, like new.", "https://images.unsplash.com/photo-1507842217343-583f20270319?w=500&h=500&fit=crop", ethers.utils.parseEther("0.06"), 5, 3],
  ["Advanced TypeScript Collection", "Bundle of 4 TypeScript/JavaScript books. Basics to expert level. Excellent condition.", "https://images.unsplash.com/photo-1507842217343-583f20270319?w=500&h=500&fit=crop", ethers.utils.parseEther("0.18"), 2, 3],

  // Sports (4)
  ["Professional Yoga Mat", "6mm eco-friendly non-slip mat. Includes strap and alignment markers.", "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&h=500&fit=crop", ethers.utils.parseEther("0.22"), 6, 4],
  ["Adjustable Dumbbell Set", "5-20kg compact set. Space-saving design. Like new condition.", "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500&h=500&fit=crop", ethers.utils.parseEther("0.5"), 2, 4],
  ["Resistance Band Set", "5 latex-free bands with instruction guide and carrying bag.", "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&h=500&fit=crop", ethers.utils.parseEther("0.1"), 8, 4],
  ["Professional Skateboard", "Maple deck with ABEC-7 bearings. Perfect for beginners/intermediate. Well-maintained.", "https://images.unsplash.com/photo-1606486753147-c8e36198eac2?w=500&h=500&fit=crop", ethers.utils.parseEther("0.14"), 3, 4],

  // Home (3)
  ["Ceramic Coffee Maker Set", "Handmade ceramic with 2 matching mugs. Minimalist design, dishwasher safe.", "https://images.unsplash.com/photo-1442512595331-e89e6e77de14?w=500&h=500&fit=crop", ethers.utils.parseEther("0.28"), 3, 5],
  ["Stainless Steel Cookware Set", "10-piece professional-grade set. Dishwasher safe, induction compatible.", "https://images.unsplash.com/photo-1585521537066-d9c3cc0b41eb?w=500&h=500&fit=crop", ethers.utils.parseEther("0.4"), 2, 5],
  ["Smart LED Lighting Strips", "16.4ft RGB strips with remote. WiFi enabled, works with smart home apps. Brand new.", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop", ethers.utils.parseEther("0.16"), 5, 5],

  // Services (2)
  ["Web Development Consultation", "Expert 1-hour consultation for web projects. Architecture, tech stack, best practices.", "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=500&fit=crop", ethers.utils.parseEther("0.3"), 5, 6],
  ["Smart Home Installation", "Professional setup of smart devices. Installation, config, 30-day support included.", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop", ethers.utils.parseEther("0.6"), 1, 6],

  // Other (1)
  ["Vintage Film Camera Collection", "3 working cameras: Canon AE-1, Nikon FM2, Olympus OM-1. Perfect for enthusiasts.", "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&h=500&fit=crop", ethers.utils.parseEther("0.45"), 1, 7],
];

async function main() {
  console.log("\n🌱 TrustMart Demo Products Seeder\n");
  console.log("=".repeat(60));

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`📍 Deployer address: ${deployer.address}`);

  // Check balance
  const balance = await deployer.getBalance();
  const balanceKITE = ethers.utils.formatEther(balance);
  console.log(`💰 Balance: ${balanceKITE} KITE\n`);

  // Get contract address from deployment
  const deployedAddresses = require("../frontend/config/deployedAddresses.json");
  const productRegistryAddress = deployedAddresses?.contracts?.ProductRegistry;

  if (!productRegistryAddress) {
    console.error("❌ ProductRegistry address not found. Please deploy contracts first.");
    process.exit(1);
  }

  console.log(`📦 ProductRegistry: ${productRegistryAddress}\n`);

  // Load ABI
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const productRegistry = ProductRegistry.attach(productRegistryAddress).connect(deployer);

  const LISTING_FEE = ethers.utils.parseEther("0.001");
  let successCount = 0;
  let failCount = 0;

  console.log("Creating products...\n");

  // Seed products
  for (let i = 0; i < DEMO_PRODUCTS.length; i++) {
    const [name, desc, imgUrl, price, stock, category] = DEMO_PRODUCTS[i];
    
    try {
      process.stdout.write(`[${String(i + 1).padStart(2, "0")}/${DEMO_PRODUCTS.length}] ${name.padEnd(40, ".")}`);
      
      const tx = await productRegistry.createProduct(
        name,
        desc,
        imgUrl,
        price,
        stock,
        category,
        { value: LISTING_FEE }
      );

      const receipt = await tx.wait();
      successCount++;
      console.log(` ✅ Block ${receipt.blockNumber}`);

      // Small delay between transactions
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      failCount++;
      console.log(` ❌ ${error.message.split('\n')[0]}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n✅ Seeding Complete!`);
  console.log(`   Created: ${successCount}/${DEMO_PRODUCTS.length} products`);
  console.log(`   Failed: ${failCount}/${DEMO_PRODUCTS.length} products\n`);
  console.log("🎉 Refresh your Vercel preview to see the products!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
