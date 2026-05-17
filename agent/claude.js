/**
 * Claude API wrapper for TrustMart AI agent
 * All calls return structured JSON decisions
 */
const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

const AGENT_SYSTEM = `You are TrustMart's autonomous AI arbitration agent running on Kite Chain.
You analyze evidence, make binding decisions, and your decisions are written permanently to the blockchain.
You MUST respond with valid JSON ONLY — no markdown, no explanation outside JSON.
Be fair, concise, and decisive. Your decisions protect buyers and sellers from fraud.`;

/**
 * Verify a delivery proof photo/URL
 * Returns: { decision, confidence, reason, action, flags }
 */
async function verifyDelivery({ imageUrl, orderData }) {
  const prompt = `Analyze this delivery proof for order #${orderData.orderId}.

Product: "${orderData.productName}"
Expected price: ${orderData.amount} KITE
Buyer notes: "${orderData.notes || 'none'}"

Image URL: ${imageUrl}

Determine if this is valid proof of delivery. Consider:
1. Does the image show a physical item being delivered?
2. Does it appear to match the product description?
3. Are there any signs of tampering or fraud?
4. Is this a real photo (not stock image/screenshot)?

Respond with ONLY this JSON:
{
  "decision": "APPROVED" | "REJECTED" | "NEEDS_REVIEW",
  "confidence": 0-100,
  "reason": "clear explanation in 1-2 sentences",
  "action": "RELEASE_FUNDS" | "REQUEST_MORE_PROOF" | "FLAG_DISPUTE",
  "flags": [] 
}`;

  // Try with vision if image URL is accessible
  let content;
  try {
    content = [
      { type: "image", source: { type: "url", url: imageUrl } },
      { type: "text", text: prompt }
    ];
  } catch {
    content = prompt + `\n\nNote: Could not load image directly, analyzing based on URL and context.`;
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: AGENT_SYSTEM,
    messages: [{ role: "user", content }],
  });

  return parseJSON(response.content[0].text, {
    decision: "NEEDS_REVIEW",
    confidence: 50,
    reason: "Unable to analyze image",
    action: "REQUEST_MORE_PROOF",
    flags: [],
  });
}

/**
 * Detect fraud in a product listing
 * Returns: { isFraud, riskScore, reason, flags, recommendation }
 */
async function detectFraud({ productData }) {
  const prompt = `Analyze this product listing for fraud or policy violations.

Product Name: "${productData.name}"
Description: "${productData.description}"
Price: ${productData.price} KITE
Category: ${productData.category}
Seller: ${productData.seller}

Check for:
1. Unrealistic pricing (too cheap for category)
2. Misleading descriptions
3. Prohibited items
4. Spam patterns
5. Copy-paste from other listings

Respond with ONLY this JSON:
{
  "isFraud": true | false,
  "riskScore": 0-100,
  "reason": "explanation in 1-2 sentences",
  "flags": ["flag1", "flag2"],
  "recommendation": "APPROVE" | "FLAG" | "REMOVE"
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: AGENT_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  return parseJSON(response.content[0].text, {
    isFraud: false,
    riskScore: 0,
    reason: "Analysis unavailable",
    flags: [],
    recommendation: "APPROVE",
  });
}

/**
 * Arbitrate a buyer/seller dispute
 * Returns: { decision, winner, confidence, reason, evidence_assessment }
 */
async function arbitrateDispute({ orderData, buyerReason, sellerEvidence, disputeHistory }) {
  const prompt = `Arbitrate this marketplace dispute between buyer and seller.

ORDER DETAILS:
- Order ID: #${orderData.orderId}
- Product: "${orderData.productName}"
- Amount: ${orderData.amount} KITE
- Placed: ${new Date(orderData.createdAt * 1000).toLocaleDateString()}
- Status: ${orderData.status}
- Tracking provided: ${orderData.trackingInfo || "None"}

BUYER'S CLAIM:
"${buyerReason}"

SELLER'S EVIDENCE:
"${sellerEvidence || "No evidence submitted"}"

DISPUTE HISTORY:
${disputeHistory || "No prior history"}

Make a FAIR ruling. Consider:
1. Who has the stronger evidence?
2. Is the timeline reasonable?
3. Was tracking info provided?
4. Are there signs of bad faith from either party?

Respond with ONLY this JSON:
{
  "decision": "REFUND_BUYER" | "PAY_SELLER" | "SPLIT" | "ESCALATE",
  "winner": "buyer" | "seller" | "none",
  "confidence": 0-100,
  "reason": "detailed reasoning in 2-3 sentences",
  "evidence_assessment": {
    "buyer_score": 0-10,
    "seller_score": 0-10
  },
  "conditions": "any conditions on the ruling"
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 768,
    system: AGENT_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  return parseJSON(response.content[0].text, {
    decision: "ESCALATE",
    winner: "none",
    confidence: 0,
    reason: "Could not analyze dispute",
    evidence_assessment: { buyer_score: 0, seller_score: 0 },
    conditions: "",
  });
}

function parseJSON(text, fallback) {
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    console.warn("[Claude] JSON parse failed:", text.slice(0, 100));
    return fallback;
  }
}

module.exports = { verifyDelivery, detectFraud, arbitrateDispute };
