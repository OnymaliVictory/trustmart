/**
 * TrustMart – Seed Script
 * Populates the testnet with demo products for hackathon demo
 *
 * Run: npx hardhat run scripts/seed.js --network kite_testnet
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🌱  Seeding TrustMart with demo products...\n");

  const [deployer, seller1, seller2] = await ethers.getSigners();

  // Load deployed addresses
  const addressesPath = path.join(__dirname, "../frontend/config/deployedAddresses.json");
  if (!fs.existsSync(addressesPath)) {
    throw new Error("Run deploy.js first! deployedAddresses.json not found.");
  }

  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  const { ProductRegistry: registryAddr } = addresses.contracts;

  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const registry = ProductRegistry.attach(registryAddr);

  const listingFee = await registry.listingFee();
  console.log(`Listing fee: ${ethers.utils.formatEther(listingFee)} KITE`);

  const products = [
    {
      name: "Sony WH-1000XM5 Headphones",
      description: "Industry-leading noise canceling with Speak-to-Chat technology. 30-hour battery life. Perfect sound quality.",
      imageUrl: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800",
      price: ethers.utils.parseEther("0.05"),
      stock: 15,
      category: 0, // Electronics
    },
    {
      name: "MacBook Pro M3 16-inch",
      description: "Apple M3 Pro chip, 18GB unified memory, 512GB SSD. Stunning Liquid Retina XDR display.",
      imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
      price: ethers.utils.parseEther("1.2"),
      stock: 5,
      category: 0, // Electronics
    },
    {
      name: "Nike Air Max 270",
      description: "Men's shoe with Max Air heel unit for all-day comfort. Available in multiple colorways.",
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
      price: ethers.utils.parseEther("0.08"),
      stock: 30,
      category: 1, // Clothing
    },
    {
      name: "The Psychology of Money",
      description: "Morgan Housel's timeless lessons on wealth, greed, and happiness. Hardcover edition.",
      imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800",
      price: ethers.utils.parseEther("0.01"),
      stock: 50,
      category: 3, // Books
    },
    {
      name: "Ergonomic Office Chair",
      description: "Lumbar support, adjustable armrests, breathable mesh back. Perfect for long work sessions.",
      imageUrl: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800",
      price: ethers.utils.parseEther("0.15"),
      stock: 8,
      category: 5, // Home
    },
    {
      name: "Protein Whey Gold Standard",
      description: "24g of protein per serving. Double Rich Chocolate flavor. 5lb bag, 74 servings.",
      imageUrl: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800",
      price: ethers.utils.parseEther("0.03"),
      stock: 40,
      category: 4, // Sports
    },
    {
      name: "Samsung 4K OLED TV 65\"",
      description: "QD-OLED display, 4K 144Hz, HDR gaming. Smart TV with built-in streaming apps.",
      imageUrl: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800",
      price: ethers.utils.parseEther("0.8"),
      stock: 3,
      category: 0, // Electronics
    },
    {
      name: "Handmade Leather Wallet",
      description: "Full-grain leather bifold wallet. 6 card slots, 2 bill compartments. RFID protection.",
      imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800",
      price: ethers.utils.parseEther("0.02"),
      stock: 20,
      category: 7, // Other
    },
  ];

  const seller = deployer; // Use deployer as seller for demo

  console.log(`Creating ${products.length} demo products...\n`);

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    try {
      const tx = await registry
        .connect(seller)
        .createProduct(
          p.name,
          p.description,
          p.imageUrl,
          p.price,
          p.stock,
          p.category,
          { value: listingFee }
        );

      const receipt = await tx.wait(1);
      const event = receipt.events?.find((e) => e.event === "ProductCreated");
      const productId = event?.args?.productId?.toString() || "?";

      console.log(`✅ [${i + 1}/${products.length}] Product #${productId}: ${p.name}`);
      console.log(`   Price: ${ethers.utils.formatEther(p.price)} KITE | Stock: ${p.stock}`);
    } catch (err) {
      console.error(`❌ Failed to create "${p.name}":`, err.message);
    }
  }

  console.log("\n✅ Seeding complete! TrustMart is ready for demo.\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
