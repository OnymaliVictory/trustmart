#!/usr/bin/env node

/**
 * TrustMart Demo Products Seeder - 30 Products
 * 
 * Creates 30 diverse demo products across all marketplace categories
 * for testing and demo day presentations.
 * 
 * Usage: npx hardhat run scripts/seedDemoProducts.js --network kite_testnet
 */

const hre = require("hardhat");
const { ethers } = hre;

const DEMO_PRODUCTS = [
  // Electronics (6)
  ["Apple MacBook Pro 16\" M3 Max", "High-performance laptop with M3 Max chip. 36GB unified memory, 1TB SSD. Minimal wear, includes original charger and AppleCare+.", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop", ethers.utils.parseEther("1.2"), 3, 0],
  ["Sony WH-1000XM5 Headphones", "Industry-leading noise-canceling wireless headphones. 8-hour battery life, premium sound quality. Excellent condition with original case and accessories.", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop", ethers.utils.parseEther("0.45"), 5, 0],
  ["iPhone 15 Pro Max 256GB", "Latest flagship smartphone with A17 Pro, 48MP camera, titanium design. Barely used, screen protector installed. Full warranty included.", "https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=500&h=500&fit=crop", ethers.utils.parseEther("1.5"), 2, 0],
  ["iPad Air 11-inch (M2)", "Versatile tablet with M2 chip, stunning Liquid Retina display. 256GB, Wi-Fi + Cellular. Like new condition.", "https://images.unsplash.com/photo-1559056199-641a0ac8b3f7?w=500&h=500&fit=crop", ethers.utils.parseEther("0.85"), 4, 0],
  ["DJI Air 3S Drone", "Professional 4K drone with excellent stability and range. 46-minute flight time. Complete with 2 batteries, ND filters, and protective case.", "https://images.unsplash.com/photo-1508444845599-1c64ead20d12?w=500&h=500&fit=crop", ethers.utils.parseEther("0.9"), 2, 0],
  ["Sony A6400 Mirrorless Camera", "APS-C mirrorless with 24.2MP sensor and fast autofocus. 4K video capability. Includes Sony 18-135mm and 50mm lens kit.", "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&h=500&fit=crop", ethers.utils.parseEther("0.75"), 1, 0],

  // Clothing (6)
  ["Premium Wool Winter Coat", "Charcoal gray wool blend coat. Insulated, water-resistant exterior. Size M. Barely worn, professionally dry cleaned.", "https://images.unsplash.com/photo-1539533057592-4d14fc9d4a6e?w=500&h=500&fit=crop", ethers.utils.parseEther("0.25"), 3, 1],
  ["Nike Air Zoom Running Shoes Size 10", "Responsive cushioning technology, lightweight mesh upper. Worn 3 times only, like new condition. Original box included.", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop", ethers.utils.parseEther("0.18"), 4, 1],
  ["Luxury Handmade Silk Scarves Collection", "Premium Italian silk scarves, set of 5 pieces. Various luxury patterns, dry clean only. Perfect gift set.", "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&h=500&fit=crop", ethers.utils.parseEther("0.35"), 2, 1],
  ["Designer Italian Leather Backpack", "Premium Italian leather with dedicated laptop compartment. Professional minimalist design, extremely durable. Barely used.", "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop", ethers.utils.parseEther("0.4"), 3, 1],
  ["Vintage Indigo Denim Jacket", "Classic blue indigo denim. Size L. Perfect condition, great for casual or dress-up occasions. Timeless style.", "https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=500&h=500&fit=crop", ethers.utils.parseEther("0.15"), 2, 1],
  ["100% Pure Cashmere Knit Sweater", "Luxurious cashmere in cream color. Size S. Ultra soft premium quality. Only worn once, like new.", "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop", ethers.utils.parseEther("0.3"), 1, 1],

  // Food (4)
  ["Premium Organic Matcha Green Tea Powder", "Grade A ceremonial matcha from Uji, Japan. 100g pure organic powder. Perfect for traditional tea ceremony or smoothies.", "https://images.unsplash.com/photo-1597318086395-c21372cced46?w=500&h=500&fit=crop", ethers.utils.parseEther("0.12"), 10, 2],
  ["Single Origin Ethiopian Coffee Beans", "Specialty grade from Yirgacheffe region. 500g freshly roasted. Rich, complex flavor profile with floral notes.", "https://images.unsplash.com/photo-1559056199-641a0ac8b3f7?w=500&h=500&fit=crop", ethers.utils.parseEther("0.08"), 8, 2],
  ["Artisanal Raw Honey Collection", "3 jars: Manuka, Acacia, Wildflower honey. 250ml each. Raw, unfiltered, high quality. Premium gift set.", "https://images.unsplash.com/photo-1587049537359-08a5a9b0e7e9?w=500&h=500&fit=crop", ethers.utils.parseEther("0.2"), 5, 2],
  ["Organic Superfood Powder Blend", "Mix of spirulina, chlorella, moringa, and maca. 200g organic. Perfect for smoothies and health drinks.", "https://images.unsplash.com/photo-1584308666744-24d5f400f6f1?w=500&h=500&fit=crop", ethers.utils.parseEther("0.15"), 6, 2],

  // Books (4)
  ["The Art of Computer Programming - 3 Volume Set", "Complete boxed set by Donald E. Knuth. Pristine condition. Essential reference for programmers. Collector's item.", "https://images.unsplash.com/photo-1507842217343-583f20270319?w=500&h=500&fit=crop", ethers.utils.parseEther("0.35"), 1, 3],
  ["Clean Code - Signed First Edition", "By Robert C. Martin. Guide to writing readable, maintainable code. Excellent condition with dust jacket. Signed edition.", "https://images.unsplash.com/photo-1507842217343-583f20270319?w=500&h=500&fit=crop", ethers.utils.parseEther("0.08"), 3, 3],
  ["Atomic Habits - Bestseller", "Practical strategies for building good habits. Paperback, like new condition. Life-changing read.", "https://images.unsplash.com/photo-1507842217343-583f20270319?w=500&h=500&fit=crop", ethers.utils.parseEther("0.06"), 5, 3],
  ["Advanced TypeScript Bundle - 4 Books", "Complete collection: Basics to Expert level TypeScript/JavaScript programming. All excellent condition.", "https://images.unsplash.com/photo-1507842217343-583f20270319?w=500&h=500&fit=crop", ethers.utils.parseEther("0.18"), 2, 3],

  // Sports (4)
  ["Professional Yoga Mat - Non-Slip", "6mm thick eco-friendly TPE material. Non-slip surface with alignment markers. Includes carrying strap.", "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&h=500&fit=crop", ethers.utils.parseEther("0.22"), 6, 4],
  ["Adjustable Dumbbell Set 5-20kg", "Space-saving compact set with quick adjustment mechanism. Like new condition. Includes stand.", "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500&h=500&fit=crop", ethers.utils.parseEther("0.5"), 2, 4],
  ["Resistance Band Set - 5 Pieces", "Latex-free bands with instruction guide. Perfect for home workouts. Includes carrying bag.", "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&h=500&fit=crop", ethers.utils.parseEther("0.1"), 8, 4],
  ["Professional Skateboard - Maple Deck", "High-quality maple deck with ABEC-7 bearings. Perfect for beginners and intermediate skaters. Well-maintained.", "https://images.unsplash.com/photo-1606486753147-c8e36198eac2?w=500&h=500&fit=crop", ethers.utils.parseEther("0.14"), 3, 4],

  // Home (3)
  ["Handmade Ceramic Coffee Maker Set", "Beautiful artisan ceramic with 2 matching mugs. Minimalist design, dishwasher safe. Ready to use.", "https://images.unsplash.com/photo-1442512595331-e89e6e77de14?w=500&h=500&fit=crop", ethers.utils.parseEther("0.28"), 3, 5],
  ["10-Piece Stainless Steel Cookware Set", "Professional-grade cookware. Dishwasher safe, induction compatible. Heavy-bottomed, excellent heat distribution.", "https://images.unsplash.com/photo-1585521537066-d9c3cc0b41eb?w=500&h=500&fit=crop", ethers.utils.parseEther("0.4"), 2, 5],
  ["Smart LED Lighting Strips RGB 16.4ft", "WiFi-enabled RGB strips with remote control. Works with smart home apps. Brand new in box. Ambient lighting.", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop", ethers.utils.parseEther("0.16"), 5, 5],

  // Services (2)
  ["1-Hour Web Development Consultation", "Expert guidance on architecture, tech stack, and best practices. Ideal for startup founders and developers.", "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=500&fit=crop", ethers.utils.parseEther("0.3"), 5, 6],
  ["Professional Smart Home Installation", "Full setup and configuration of smart devices. Installation, configuration, and 30-day technical support included.", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop", ethers.utils.parseEther("0.6"), 1, 6],

  // Other (1)
  ["Vintage Film Camera Collection - 3 Cameras", "Canon AE-1, Nikon FM2, Olympus OM-1. All working perfectly. Perfect for photography enthusiasts.", "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&h=500&fit=crop", ethers.utils.parseEther("0.45"), 1, 7],
];

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🌱 TrustMart - 30 Demo Products Seeder (2026)");
  console.log("=".repeat(70));

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`\n📍 Deployer: ${deployer.address}`);

  // Check balance
  const balance = await deployer.getBalance();
  const balanceKITE = ethers.utils.formatEther(balance);
  console.log(`💰 Balance: ${balanceKITE} KITE\n`);

  // Load contract
  let deployedAddresses = {};
  try {
    deployedAddresses = require("../frontend/config/deployedAddresses.json");
  } catch (e) {
    console.error("❌ deployedAddresses.json not found. Deploy contracts first!");
    process.exit(1);
  }

  const registryAddr = deployedAddresses?.contracts?.ProductRegistry;
  if (!registryAddr) {
    console.error("❌ ProductRegistry address not found.");
    process.exit(1);
  }

  console.log(`📦 ProductRegistry: ${registryAddr}\n`);

  const registry = await ethers.getContractAt("ProductRegistry", registryAddr).connect(deployer);
  const LISTING_FEE = ethers.utils.parseEther("0.001");

  let success = 0, failed = 0;

  console.log("Creating products...\n");

  for (let i = 0; i < DEMO_PRODUCTS.length; i++) {
    const [name, desc, imgUrl, price, stock, category] = DEMO_PRODUCTS[i];
    const num = String(i + 1).padStart(2, "0");
    const nameDisplay = name.padEnd(45, ".");

    try {
      process.stdout.write(`[${num}/${DEMO_PRODUCTS.length}] ${nameDisplay}`);

      const tx = await registry.createProduct(
        name,
        desc,
        imgUrl,
        price,
        stock,
        category,
        { value: LISTING_FEE }
      );

      const receipt = await tx.wait();
      success++;
      console.log(` ✅ Block ${receipt.blockNumber}`);

      // Delay between transactions
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      failed++;
      const msg = error.message.split("\n")[0].slice(0, 40);
      console.log(` ❌ ${msg}`);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log(`\n✅ Seeding Complete!`);
  console.log(`   Created: ${success}/${DEMO_PRODUCTS.length} products`);
  console.log(`   Failed: ${failed}/${DEMO_PRODUCTS.length} products`);
  console.log(`\n🎉 Refresh your preview to see all products!\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
