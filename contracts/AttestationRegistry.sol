// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title AttestationRegistry
 * @author TrustMart AI Agent
 * @notice Permanent on-chain log of every AI agent decision.
 *         The AI agent pays a small KITE fee to write each attestation,
 *         proving autonomous transacting capability.
 *
 * Action types:
 *  - DELIVERY_VERIFY  : AI analyzed delivery proof photo
 *  - FRAUD_CHECK      : AI scanned a product listing for fraud
 *  - DISPUTE_ARBITRATE: AI arbitrated a buyer/seller dispute
 *  - PRICE_ANOMALY    : AI flagged abnormal pricing
 */
contract AttestationRegistry is Ownable, ReentrancyGuard {

    // ── State ────────────────────────────────────────────

    uint256 public attestationFee = 0.0001 ether; // Agent pays per attestation
    uint256 private _attestationCount;

    struct Attestation {
        uint256 id;
        uint256 orderId;       // 0 if not order-related (e.g., fraud check on listing)
        uint256 productId;     // 0 if not product-related
        address agent;         // AI agent wallet address
        string  actionType;    // "DELIVERY_VERIFY" | "FRAUD_CHECK" | "DISPUTE_ARBITRATE"
        string  decision;      // "APPROVED" | "REJECTED" | "FRAUD" | "REFUND_BUYER" | "PAY_SELLER"
        string  reason;        // Human-readable AI explanation
        uint8   confidence;    // 0-100 confidence score
        string  metadata;      // JSON: extra context (image hash, model version, etc.)
        uint256 timestamp;
        bool    executedOnChain; // Did this trigger an on-chain action?
    }

    // orderId => attestations
    mapping(uint256 => Attestation[]) private _orderAttestations;
    // productId => attestations
    mapping(uint256 => Attestation[]) private _productAttestations;
    // Flat list for global feed
    Attestation[] private _allAttestations;
    // Authorized agents (can write attestations)
    mapping(address => bool) public authorizedAgents;

    // ── Events ───────────────────────────────────────────

    event AttestationWritten(
        uint256 indexed attestationId,
        uint256 indexed orderId,
        uint256 indexed productId,
        address agent,
        string  actionType,
        string  decision,
        uint8   confidence,
        uint256 timestamp
    );
    event AgentAuthorized(address indexed agent, bool status);
    event AttestationFeeUpdated(uint256 newFee);
    event FeesWithdrawn(address to, uint256 amount);

    // ── Constructor ──────────────────────────────────────

    constructor() {}

    // ── Write Attestation ────────────────────────────────

    /**
     * @notice Record an AI agent decision permanently on-chain.
     *         Caller must pay attestationFee in KITE — proves agent autonomy.
     * @param orderId     Related order (0 if none)
     * @param productId   Related product (0 if none)
     * @param actionType  Type of AI action performed
     * @param decision    AI's final decision
     * @param reason      Human-readable explanation
     * @param confidence  Confidence score 0-100
     * @param metadata    JSON string with extra data
     * @param executedOnChain Whether this triggered an on-chain action
     */
    function writeAttestation(
        uint256 orderId,
        uint256 productId,
        string calldata actionType,
        string calldata decision,
        string calldata reason,
        uint8   confidence,
        string calldata metadata,
        bool    executedOnChain
    ) external payable nonReentrant returns (uint256) {
        require(msg.value >= attestationFee, "AR: Insufficient fee");
        require(authorizedAgents[msg.sender] || msg.sender == owner(), "AR: Not authorized agent");
        require(bytes(actionType).length > 0 && bytes(actionType).length <= 50, "AR: Invalid actionType");
        require(bytes(decision).length > 0  && bytes(decision).length  <= 50, "AR: Invalid decision");
        require(bytes(reason).length > 0    && bytes(reason).length    <= 500, "AR: Invalid reason");
        require(confidence <= 100, "AR: Confidence must be 0-100");

        uint256 id = _attestationCount++;

        Attestation memory att = Attestation({
            id:              id,
            orderId:         orderId,
            productId:       productId,
            agent:           msg.sender,
            actionType:      actionType,
            decision:        decision,
            reason:          reason,
            confidence:      confidence,
            metadata:        metadata,
            timestamp:       block.timestamp,
            executedOnChain: executedOnChain
        });

        _allAttestations.push(att);
        if (orderId   > 0) _orderAttestations[orderId].push(att);
        if (productId > 0) _productAttestations[productId].push(att);

        emit AttestationWritten(id, orderId, productId, msg.sender, actionType, decision, confidence, block.timestamp);
        return id;
    }

    // ── View Functions ────────────────────────────────────

    function getAttestation(uint256 id) external view returns (Attestation memory) {
        require(id < _attestationCount, "AR: Not found");
        return _allAttestations[id];
    }

    function getOrderAttestations(uint256 orderId)
        external view returns (Attestation[] memory)
    {
        return _orderAttestations[orderId];
    }

    function getProductAttestations(uint256 productId)
        external view returns (Attestation[] memory)
    {
        return _productAttestations[productId];
    }

    /**
     * @notice Get the latest N attestations (global feed)
     */
    function getLatestAttestations(uint256 count)
        external view returns (Attestation[] memory)
    {
        uint256 total = _allAttestations.length;
        if (total == 0) return new Attestation[](0);
        uint256 resultCount = count > total ? total : count;
        uint256 startIdx    = total - resultCount;

        Attestation[] memory result = new Attestation[](resultCount);
        for (uint256 i = 0; i < resultCount; i++) {
            result[i] = _allAttestations[startIdx + i];
        }
        return result;
    }

    function getTotalAttestations() external view returns (uint256) {
        return _attestationCount;
    }

    // ── Admin ─────────────────────────────────────────────

    function setAgentAuthorized(address agent, bool status) external onlyOwner {
        authorizedAgents[agent] = status;
        emit AgentAuthorized(agent, status);
    }

    function setAttestationFee(uint256 newFee) external onlyOwner {
        attestationFee = newFee;
        emit AttestationFeeUpdated(newFee);
    }

    function withdrawFees() external onlyOwner nonReentrant {
        uint256 bal = address(this).balance;
        require(bal > 0, "AR: Nothing to withdraw");
        (bool ok,) = payable(owner()).call{value: bal}("");
        require(ok, "AR: Withdraw failed");
        emit FeesWithdrawn(owner(), bal);
    }

    receive() external payable {}
}
