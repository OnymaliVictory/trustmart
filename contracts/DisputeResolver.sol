// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// ─── Interface at TOP LEVEL (not inside contract) ─────────
interface IEscrowOrderDR {
    function resolveDispute(uint256 orderId, bool refundBuyer) external;
    function getOrder(uint256 orderId) external view returns (
        uint256 id,
        uint256 productId,
        address buyer,
        address payable seller,
        uint256 quantity,
        uint256 amount,
        uint256 platformFee,
        uint8   status,
        uint256 createdAt,
        uint256 shippedAt,
        uint256 completedAt,
        string  memory trackingInfo,
        string  memory notes
    );
}

contract DisputeResolver is AccessControl, ReentrancyGuard {

    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");
    bytes32 public constant ADMIN_ROLE      = keccak256("ADMIN_ROLE");

    IEscrowOrderDR public escrowOrder;

    enum DisputeStatus { Pending, UnderReview, Resolved, Escalated }

    struct Evidence {
        address submitter;
        string  content;
        string  description;
        uint256 submittedAt;
    }

    struct Dispute {
        uint256       orderId;
        address       raisedBy;
        address       buyer;
        address       seller;
        string        reason;
        DisputeStatus status;
        address       assignedArbitrator;
        address       resolvedBy;
        bool          buyerWon;
        uint256       raisedAt;
        uint256       resolvedAt;
        string        resolution;
    }

    mapping(uint256 => Dispute)   private _disputes;
    mapping(uint256 => Evidence[]) private _evidences;
    uint256[] private _allDisputeIds;

    uint256 public totalDisputes;
    uint256 public resolvedForBuyer;
    uint256 public resolvedForSeller;
    uint256 public pendingCount;

    event DisputeOpened(uint256 indexed orderId, address indexed raisedBy, string reason);
    event EvidenceSubmitted(uint256 indexed orderId, address indexed submitter, string content);
    event DisputeAssigned(uint256 indexed orderId, address indexed arbitrator);
    event DisputeResolved(uint256 indexed orderId, address indexed arbitrator, bool buyerWon, string resolution);
    event DisputeEscalated(uint256 indexed orderId, address escalatedBy);
    event ArbitratorAdded(address indexed arbitrator, address addedBy);
    event ArbitratorRemoved(address indexed arbitrator, address removedBy);

    constructor(address _escrowOrder, address admin) {
        require(_escrowOrder != address(0), "DR: Invalid escrow");
        require(admin != address(0),        "DR: Invalid admin");
        escrowOrder = IEscrowOrderDR(_escrowOrder);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE,      admin);
        _grantRole(ARBITRATOR_ROLE, admin);
    }

    // ── Open dispute ──────────────────────────────────────

    function openDispute(uint256 orderId, string calldata reason) external {
        require(_disputes[orderId].raisedAt == 0, "DR: Already exists");
        require(bytes(reason).length > 0 && bytes(reason).length <= 500, "DR: Bad reason");

        // Fetch order to get buyer/seller
        (,, address buyer, address payable seller,,,,,,,,, ) = escrowOrder.getOrder(orderId);
        require(msg.sender == buyer || msg.sender == seller, "DR: Not participant");

        _disputes[orderId] = Dispute({
            orderId:            orderId,
            raisedBy:           msg.sender,
            buyer:              buyer,
            seller:             seller,
            reason:             reason,
            status:             DisputeStatus.Pending,
            assignedArbitrator: address(0),
            resolvedBy:         address(0),
            buyerWon:           false,
            raisedAt:           block.timestamp,
            resolvedAt:         0,
            resolution:         ""
        });

        _allDisputeIds.push(orderId);
        totalDisputes++;
        pendingCount++;
        emit DisputeOpened(orderId, msg.sender, reason);
    }

    // ── Submit evidence ───────────────────────────────────

    function submitEvidence(uint256 orderId, string calldata content, string calldata description) external {
        Dispute storage d = _disputes[orderId];
        require(d.raisedAt > 0, "DR: Not found");
        require(d.status != DisputeStatus.Resolved, "DR: Already resolved");
        require(msg.sender == d.buyer || msg.sender == d.seller, "DR: Not participant");
        require(bytes(content).length > 0 && bytes(content).length <= 500, "DR: Bad content");
        require(_evidences[orderId].length < 10, "DR: Too much evidence");

        _evidences[orderId].push(Evidence({
            submitter:   msg.sender,
            content:     content,
            description: description,
            submittedAt: block.timestamp
        }));
        emit EvidenceSubmitted(orderId, msg.sender, content);
    }

    // ── Assign dispute ────────────────────────────────────

    function assignDispute(uint256 orderId) external onlyRole(ARBITRATOR_ROLE) {
        Dispute storage d = _disputes[orderId];
        require(d.raisedAt > 0, "DR: Not found");
        require(d.status == DisputeStatus.Pending, "DR: Not pending");
        d.status = DisputeStatus.UnderReview;
        d.assignedArbitrator = msg.sender;
        if (pendingCount > 0) pendingCount--;
        emit DisputeAssigned(orderId, msg.sender);
    }

    // ── Resolve dispute ───────────────────────────────────

    function resolveDispute(uint256 orderId, bool refundBuyer, string calldata resolution)
        external onlyRole(ARBITRATOR_ROLE) nonReentrant
    {
        Dispute storage d = _disputes[orderId];
        require(d.raisedAt > 0, "DR: Not found");
        require(d.status != DisputeStatus.Resolved, "DR: Already resolved");
        require(bytes(resolution).length > 0 && bytes(resolution).length <= 1000, "DR: Resolution required");

        d.status     = DisputeStatus.Resolved;
        d.resolvedBy = msg.sender;
        d.buyerWon   = refundBuyer;
        d.resolvedAt = block.timestamp;
        d.resolution = resolution;

        if (refundBuyer) { resolvedForBuyer++; } else { resolvedForSeller++; }

        escrowOrder.resolveDispute(orderId, refundBuyer);
        emit DisputeResolved(orderId, msg.sender, refundBuyer, resolution);
    }

    // ── Escalate ──────────────────────────────────────────

    function escalateDispute(uint256 orderId) external onlyRole(ADMIN_ROLE) {
        Dispute storage d = _disputes[orderId];
        require(d.raisedAt > 0 && d.status != DisputeStatus.Resolved, "DR: Invalid");
        d.status = DisputeStatus.Escalated;
        emit DisputeEscalated(orderId, msg.sender);
    }

    // ── Arbitrator management ─────────────────────────────

    function addArbitrator(address arbitrator) external onlyRole(ADMIN_ROLE) {
        require(arbitrator != address(0), "DR: Zero addr");
        _grantRole(ARBITRATOR_ROLE, arbitrator);
        emit ArbitratorAdded(arbitrator, msg.sender);
    }

    function removeArbitrator(address arbitrator) external onlyRole(ADMIN_ROLE) {
        _revokeRole(ARBITRATOR_ROLE, arbitrator);
        emit ArbitratorRemoved(arbitrator, msg.sender);
    }

    function isArbitrator(address addr) external view returns (bool) {
        return hasRole(ARBITRATOR_ROLE, addr);
    }

    // ── Views ─────────────────────────────────────────────

    function getDispute(uint256 orderId) external view returns (
        uint256 _orderId, address raisedBy, address buyer, address seller,
        string memory reason, DisputeStatus status, address assignedArbitrator,
        address resolvedBy, bool buyerWon, uint256 raisedAt, uint256 resolvedAt,
        string memory resolution
    ) {
        Dispute storage d = _disputes[orderId];
        return (d.orderId, d.raisedBy, d.buyer, d.seller, d.reason, d.status,
                d.assignedArbitrator, d.resolvedBy, d.buyerWon, d.raisedAt,
                d.resolvedAt, d.resolution);
    }

    function getDisputeEvidences(uint256 orderId) external view returns (Evidence[] memory) {
        return _evidences[orderId];
    }

    function getAllDisputeIds() external view returns (uint256[] memory) {
        return _allDisputeIds;
    }

    function getPendingDisputeIds() external view returns (uint256[] memory) {
        uint256 count;
        for (uint256 i = 0; i < _allDisputeIds.length; i++) {
            if (_disputes[_allDisputeIds[i]].status == DisputeStatus.Pending) count++;
        }
        uint256[] memory result = new uint256[](count);
        uint256 idx;
        for (uint256 i = 0; i < _allDisputeIds.length; i++) {
            if (_disputes[_allDisputeIds[i]].status == DisputeStatus.Pending) {
                result[idx++] = _allDisputeIds[i];
            }
        }
        return result;
    }

    function getStats() external view returns (
        uint256 _total, uint256 _pending, uint256 _forBuyer, uint256 _forSeller
    ) {
        return (totalDisputes, pendingCount, resolvedForBuyer, resolvedForSeller);
    }
}
