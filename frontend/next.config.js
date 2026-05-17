/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      "images.unsplash.com",
      "ipfs.io",
      "gateway.pinata.cloud",
      "cloudflare-ipfs.com",
      "nftstorage.link",
    ],
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_CHAIN_ID: "2368",
    NEXT_PUBLIC_CHAIN_NAME: "Kite Chain Testnet",
    NEXT_PUBLIC_RPC_URL: "https://rpc-testnet.gokite.ai/",
    NEXT_PUBLIC_EXPLORER_URL: "https://testnet.kitescan.ai",
    NEXT_PUBLIC_CURRENCY_SYMBOL: "KITE",
  },
};

module.exports = nextConfig;
