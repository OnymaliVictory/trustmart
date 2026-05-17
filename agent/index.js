/**
 * TrustMart AI Agent Server
 * Autonomous delivery verification, fraud detection, dispute arbitration
 * Writes every decision as an on-chain attestation on Kite Chain
 *
 * Start: node index.js  (or npm run dev)
 */

require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const { ethers } = require("ethers");

const claude    = require("./claude");
const { getWallet, getAgentInfo } = require("./wallet");
const { getContracts } = require("./contracts");

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json({ limit: "10mb" }));

const ATTESTATION_FEE = ethers.utils.parseEther("0.0001"); // fee to write attestation

// ── Helper: write attestation to chain ───────────────────
async function writeAttestation(contracts, {
  orderId = 0, productId = 0, actionType, decision,
  reason, confidence, metadata = "{}", executedOnChain = false,
}) {
  if (!contracts.attestationRegistry) {
    console.warn("[Agent] AttestationRegistry not connected — skipping on-chain write");
    return null;
  }
  try {
    const tx = await contracts.attestationRegistry.writeAttestation(
      orderId, productId, actionType, decision,
      reason.slice(0, 499), Math.min(100, Math.max(0, Math.round(confidence))),
      metadata, executedOnChain,
      { value: ATTESTATION_FEE, gasLimit: 300000 }
    );
    const receipt = await tx.wait(1);
    const event   = receipt.events?.find((e) => e.event === "AttestationWritten");
    const attId   = event?.args?.attestationId?.toString() || "unknown";
    console.log(`[Agent] ✅ Attestation #${attId} written on-chain (tx: ${tx.hash.slice(0, 10)}…)`);
    return { attestationId: attId, txHash: tx.hash };
  } catch (err) {
    console.error("[Agent] Attestation write failed:", err.message);
    return null;
  }
}

// ──────────────────────────────────────────────────────────
//  ROUTES
// ──────────────────────────────────────────────────────────

/**
 * GET /api/agent/status
 * Returns agent wallet address + balance
 */
app.get("/api/agent/status", async (req, res) => {
  try {
    const info = await getAgentInfo();
    res.json({
      ok: true,
      agent: {
        address:    info.address,
        balance:    info.balance + " KITE",
        network:    info.network.name,
        chainId:    info.network.chainId,
        model:      "claude-sonnet-4-20250514",
        capabilities: ["DELIVERY_VERIFY", "FRAUD_CHECK", "DISPUTE_ARBITRATE"],
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/verify-delivery
 * Body: { orderId, imageUrl, orderData: { productName, amount, notes } }
 *
 * 1. AI analyzes delivery proof photo using Claude Vision
 * 2. Writes attestation to Kite Chain (agent pays fee)
 * 3. If confidence >= 80%, auto-releases escrow via agentRelease()
 */
app.post("/api/verify-delivery", async (req, res) => {
  const { orderId, imageUrl, orderData } = req.body;

  if (!orderId || !imageUrl) {
    return res.status(400).json({ ok: false, error: "orderId and imageUrl required" });
  }

  console.log(`\n[Agent] 🔍 Verifying delivery for order #${orderId}…`);

  try {
    // 1. Ask Claude to analyze the image
    const analysis = await claude.verifyDelivery({
      imageUrl,
      orderData: { orderId, ...orderData },
    });

    console.log(`[Agent] Claude result: ${analysis.decision} (${analysis.confidence}% confidence)`);

    const contracts = getContracts();

    // 2. Write attestation to chain (agent pays attestation fee in KITE)
    const metadata = JSON.stringify({
      imageUrl,
      model: "claude-sonnet-4-20250514",
      flags: analysis.flags,
      action: analysis.action,
    });

    const attestation = await writeAttestation(contracts, {
      orderId:         parseInt(orderId),
      actionType:      "DELIVERY_VERIFY",
      decision:        analysis.decision,
      reason:          analysis.reason,
      confidence:      analysis.confidence,
      metadata,
      executedOnChain: false,
    });

    // 3. If approved with high confidence, auto-release escrow
    let released = false;
    if (analysis.decision === "APPROVED" && analysis.confidence >= 80 && contracts.escrowOrder) {
      try {
        const attId = attestation?.attestationId || "manual";
        const tx = await contracts.escrowOrder.agentRelease(orderId, attId, { gasLimit: 200000 });
        await tx.wait(1);
        released = true;
        console.log(`[Agent] ✅ Funds auto-released for order #${orderId}`);

        // Update attestation executedOnChain flag by writing a follow-up
        await writeAttestation(contracts, {
          orderId:        parseInt(orderId),
          actionType:     "DELIVERY_VERIFY",
          decision:       "FUNDS_RELEASED",
          reason:         `Escrow released automatically after AI verified delivery (confidence: ${analysis.confidence}%)`,
          confidence:     analysis.confidence,
          metadata:       JSON.stringify({ originalAttestationId: attestation?.attestationId }),
          executedOnChain: true,
        });
      } catch (err) {
        console.warn("[Agent] Auto-release failed (may need manual confirm):", err.message);
      }
    }

    res.json({
      ok:          true,
      analysis,
      attestation,
      autoReleased: released,
      message: released
        ? "✅ Delivery verified — funds auto-released to seller by AI agent"
        : analysis.decision === "APPROVED"
          ? "✅ Delivery verified — please confirm delivery in your dashboard"
          : "⚠️  Delivery could not be verified — please provide clearer proof",
    });
  } catch (err) {
    console.error("[Agent] verify-delivery error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/detect-fraud
 * Body: { productId, productData: { name, description, price, category, seller } }
 *
 * 1. AI scans listing for fraud signals
 * 2. Writes attestation to chain
 * 3. Returns risk assessment
 */
app.post("/api/detect-fraud", async (req, res) => {
  const { productId, productData } = req.body;

  if (!productId || !productData) {
    return res.status(400).json({ ok: false, error: "productId and productData required" });
  }

  console.log(`\n[Agent] 🔍 Fraud check for product #${productId}…`);

  try {
    const analysis = await claude.detectFraud({ productData });
    console.log(`[Agent] Fraud risk: ${analysis.riskScore}/100 — ${analysis.recommendation}`);

    const contracts = getContracts();

    const attestation = await writeAttestation(contracts, {
      productId:       parseInt(productId),
      actionType:      "FRAUD_CHECK",
      decision:        analysis.recommendation,
      reason:          analysis.reason,
      confidence:      100 - analysis.riskScore,
      metadata:        JSON.stringify({ flags: analysis.flags, riskScore: analysis.riskScore }),
      executedOnChain: false,
    });

    res.json({ ok: true, analysis, attestation });
  } catch (err) {
    console.error("[Agent] detect-fraud error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/arbitrate-dispute
 * Body: { orderId, orderData, buyerReason, sellerEvidence }
 *
 * 1. AI reads both sides and makes a binding ruling
 * 2. Writes attestation to chain
 * 3. Calls DisputeResolver.resolveDispute() on-chain
 */
app.post("/api/arbitrate-dispute", async (req, res) => {
  const { orderId, orderData, buyerReason, sellerEvidence } = req.body;

  if (!orderId || !buyerReason) {
    return res.status(400).json({ ok: false, error: "orderId and buyerReason required" });
  }

  console.log(`\n[Agent] ⚖️  Arbitrating dispute for order #${orderId}…`);

  try {
    const ruling = await claude.arbitrateDispute({ orderData, buyerReason, sellerEvidence });
    console.log(`[Agent] Ruling: ${ruling.decision} (${ruling.confidence}% confidence)`);

    const contracts = getContracts();
    const refundBuyer = ruling.decision === "REFUND_BUYER" || ruling.winner === "buyer";

    // Write attestation first
    const attestation = await writeAttestation(contracts, {
      orderId:         parseInt(orderId),
      actionType:      "DISPUTE_ARBITRATE",
      decision:        ruling.decision,
      reason:          ruling.reason,
      confidence:      ruling.confidence,
      metadata:        JSON.stringify({
        winner:             ruling.winner,
        evidence_assessment: ruling.evidence_assessment,
        conditions:         ruling.conditions,
      }),
      executedOnChain: false,
    });

    // Execute on-chain if confidence is high enough
    let executed = false;
    if (ruling.confidence >= 75 && ruling.decision !== "ESCALATE" && contracts.disputeResolver) {
      try {
        const attId = attestation?.attestationId || "0";
        // Call resolveDispute through the DisputeResolver
        const tx = await contracts.disputeResolver.resolveDispute(
          orderId,
          refundBuyer,
          `AI ruling: ${ruling.reason.slice(0, 200)}`,
          { gasLimit: 300000 }
        );
        await tx.wait(1);
        executed = true;
        console.log(`[Agent] ✅ Dispute #${orderId} resolved on-chain → ${ruling.decision}`);
      } catch (err) {
        console.warn("[Agent] On-chain resolution failed:", err.message);
      }
    }

    res.json({
      ok: true,
      ruling,
      attestation,
      executed,
      message: executed
        ? `✅ Dispute resolved by AI: ${ruling.decision}`
        : `AI ruling: ${ruling.decision} — requires manual arbitrator confirmation`,
    });
  } catch (err) {
    console.error("[Agent] arbitrate-dispute error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/attestations/:orderId
 * Returns all on-chain attestations for an order
 */
app.get("/api/attestations/:orderId", async (req, res) => {
  const { orderId } = req.params;
  try {
    const contracts = getContracts();
    if (!contracts.attestationRegistry) {
      return res.json({ ok: true, attestations: [], note: "Registry not connected" });
    }
    const attestations = await contracts.attestationRegistry.getOrderAttestations(orderId);
    res.json({ ok: true, attestations });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/attestations/feed/latest
 * Returns the latest 20 attestations (global activity feed)
 */
app.get("/api/attestations/feed/latest", async (req, res) => {
  try {
    const contracts = getContracts();
    if (!contracts.attestationRegistry) {
      return res.json({ ok: true, attestations: [] });
    }
    const attestations = await contracts.attestationRegistry.getLatestAttestations(20);
    res.json({ ok: true, attestations });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Start server ──────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`\n${"═".repeat(50)}`);
  console.log(`  🤖  TrustMart AI Agent running on :${PORT}`);
  console.log(`${"═".repeat(50)}\n`);

  try {
    const info = await getAgentInfo();
    console.log(`  Wallet:  ${info.address}`);
    console.log(`  Balance: ${info.balance} KITE`);
    console.log(`  Network: ${info.network.name} (chainId: ${info.network.chainId})`);
    if (parseFloat(info.balance) < 0.01) {
      console.warn("\n  ⚠️  Low balance! Fund the agent wallet with testnet KITE.");
      console.warn(`  Agent address: ${info.address}`);
    }
  } catch (err) {
    console.warn("  ⚠️  Agent wallet not configured:", err.message);
  }

  console.log(`\n  Endpoints:`);
  console.log(`  POST /api/verify-delivery`);
  console.log(`  POST /api/detect-fraud`);
  console.log(`  POST /api/arbitrate-dispute`);
  console.log(`  GET  /api/attestations/:orderId`);
  console.log(`  GET  /api/attestations/feed/latest\n`);
});
