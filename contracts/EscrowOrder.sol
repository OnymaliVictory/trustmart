// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// ─── Interface at TOP LEVEL (not inside contract) ─────────
interface IProductRegistry {
    struct Product {
        uint256 id;
        address payable seller;
        string  name;
        string  description;
        string  imageUrl;
        uint256 price;
        uint256 stock;
        uint8   category;
        bool    isActive;
        uint256 createdAt;
        uint256 totalSold;
        uint256 totalRating;
        uint256 reviewCount;
    }
    function getProduct(uint256 productId) external view returns (Product memory);
    function decreaseStock(uint256 productId, uint256 quantity) external;
    function restoreStock(uint256 productId, uint256 quantity) external;
}

contract EscrowOrder is Ownable, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;
    Counters.Counter private _orderIds;

    IProductRegistry public productRegistry;
    address public disputeResolver;
    address public feeReceiver;
    address public authorizedAgent;

    uint256 public platformFeePercent = 250;
    uint256 public constant CANCEL_WINDOW    = 1 hours;
    uint256 public constant SHIPPING_TIMEOUT = 7 days;
    uint256 public constant AUTO_RELEASE     = 21 days;

    enum OrderStatus { Paid, Shipped, Delivered, Disputed, Refunded, Completed, Cancelled }

    struct Order {
        uint256 id;
        uint256 productId;
        address buyer;
        address payable seller;
        uint256 quantity;
        uint256 amount;
        uint256 platformFee;
        OrderStatus status;
        uint256 createdAt;
        uint256 shippedAt;
        uint256 completedAt;
        string  trackingInfo;
        string  notes;
    }

    mapping(uint256 => Order) private _orders;
    mapping(address => uint256[]) private _buyerOrders;
    mapping(address => uint256[]) private _sellerOrders;
    mapping(uint256 => bool) private _orderLocked;
    mapping(uint256 => bool) public agentVerified;

    uint256 public totalVolume;
    uint256 public totalOrders;
    uint256 public totalFeesCollected;
    uint256 public totalRefunded;

    event OrderCreated(uint256 indexed orderId, uint256 indexed productId, address indexed buyer, address seller, uint256 amount, uint256 quantity);
    event PaymentLocked(uint256 indexed orderId, uint256 amount, uint256 platformFee);
    event OrderShipped(uint256 indexed orderId, address seller, string trackingInfo);
    event OrderDelivered(uint256 indexed orderId, address buyer, uint256 timestamp);
    event DisputeRaised(uint256 indexed orderId, address indexed raisedBy, string reason);
    event FundsReleased(uint256 indexed orderId, address indexed seller, uint256 amount);
    event RefundIssued(uint256 indexed orderId, address indexed buyer, uint256 amount);
    event OrderCancelled(uint256 indexed orderId, address cancelledBy);
    event AutoReleaseTriggered(uint256 indexed orderId);
    event AutoRefundTriggered(uint256 indexed orderId);
    event AgentReleased(uint256 indexed orderId, string attestationId, uint256 timestamp);
    event AuthorizedAgentSet(address indexed agent);
    event DisputeResolverSet(address indexed resolver);

    modifier onlyBuyer(uint256 orderId)  { require(_orders[orderId].buyer  == msg.sender, "EO: Not buyer");  _; }
    modifier onlySeller(uint256 orderId) { require(_orders[orderId].seller == msg.sender, "EO: Not seller"); _; }
    modifier onlyDisputeResolver()       { require(msg.sender == disputeResolver || msg.sender == owner(), "EO: Not resolver"); _; }
    modifier orderExists(uint256 orderId){ require(orderId > 0 && orderId <= _orderIds.current(), "EO: Not found"); _; }
    modifier notLocked(uint256 orderId)  { require(!_orderLocked[orderId], "EO: Locked"); _orderLocked[orderId] = true; _; _orderLocked[orderId] = false; }

    constructor(address _productRegistry, address _feeReceiver) {
        require(_productRegistry != address(0) && _feeReceiver != address(0), "EO: Invalid addr");
        productRegistry = IProductRegistry(_productRegistry);
        feeReceiver = _feeReceiver;
    }

    // ── Buyer Actions ─────────────────────────────────────

    function createOrder(uint256 productId, uint256 quantity, string calldata notes)
        external payable whenNotPaused nonReentrant returns (uint256)
    {
        IProductRegistry.Product memory p = productRegistry.getProduct(productId);
        require(p.isActive, "EO: Not active");
        require(p.stock >= quantity && quantity > 0 && quantity <= 100, "EO: Bad quantity");
        require(p.seller != address(0) && p.seller != msg.sender, "EO: Invalid seller");
        require(bytes(notes).length <= 300, "EO: Notes too long");

        uint256 totalAmount = p.price * quantity;
        uint256 fee = (totalAmount * platformFeePercent) / 10000;
        require(msg.value >= totalAmount, "EO: Underpaid");

        if (msg.value > totalAmount) {
            (bool ok,) = payable(msg.sender).call{value: msg.value - totalAmount}("");
            require(ok, "EO: Refund failed");
        }

        _orderIds.increment();
        uint256 orderId = _orderIds.current();

        _orders[orderId] = Order({
            id: orderId, productId: productId, buyer: msg.sender, seller: p.seller,
            quantity: quantity, amount: totalAmount, platformFee: fee,
            status: OrderStatus.Paid, createdAt: block.timestamp,
            shippedAt: 0, completedAt: 0, trackingInfo: "", notes: notes
        });

        _buyerOrders[msg.sender].push(orderId);
        _sellerOrders[p.seller].push(orderId);
        productRegistry.decreaseStock(productId, quantity);
        totalOrders++;
        totalVolume += totalAmount;

        emit OrderCreated(orderId, productId, msg.sender, p.seller, totalAmount, quantity);
        emit PaymentLocked(orderId, totalAmount, fee);
        return orderId;
    }

    function confirmDelivery(uint256 orderId)
        external orderExists(orderId) onlyBuyer(orderId) whenNotPaused nonReentrant notLocked(orderId)
    {
        Order storage o = _orders[orderId];
        require(o.status == OrderStatus.Shipped || o.status == OrderStatus.Paid, "EO: Bad status");
        o.status = OrderStatus.Delivered;
        o.completedAt = block.timestamp;
        emit OrderDelivered(orderId, msg.sender, block.timestamp);
        _releaseFundsToSeller(orderId);
    }

    function cancelOrder(uint256 orderId)
        external orderExists(orderId) onlyBuyer(orderId) nonReentrant notLocked(orderId)
    {
        Order storage o = _orders[orderId];
        require(o.status == OrderStatus.Paid && o.shippedAt == 0, "EO: Cannot cancel");
        require(block.timestamp <= o.createdAt + CANCEL_WINDOW, "EO: Window expired");
        o.status = OrderStatus.Cancelled;
        productRegistry.restoreStock(o.productId, o.quantity);
        emit OrderCancelled(orderId, msg.sender);
        _issueRefund(orderId, o.buyer, o.amount);
    }

    function raiseDispute(uint256 orderId, string calldata reason)
        external orderExists(orderId) whenNotPaused
    {
        Order storage o = _orders[orderId];
        require(msg.sender == o.buyer || msg.sender == o.seller, "EO: Not participant");
        require(o.status == OrderStatus.Paid || o.status == OrderStatus.Shipped, "EO: Bad status");
        require(bytes(reason).length > 0 && bytes(reason).length <= 500, "EO: Bad reason");
        o.status = OrderStatus.Disputed;
        emit DisputeRaised(orderId, msg.sender, reason);
    }

    // ── Seller Actions ────────────────────────────────────

    function markShipped(uint256 orderId, string calldata trackingInfo)
        external orderExists(orderId) onlySeller(orderId) whenNotPaused
    {
        Order storage o = _orders[orderId];
        require(o.status == OrderStatus.Paid, "EO: Not Paid");
        require(bytes(trackingInfo).length > 0 && bytes(trackingInfo).length <= 300, "EO: Bad tracking");
        o.status = OrderStatus.Shipped;
        o.shippedAt = block.timestamp;
        o.trackingInfo = trackingInfo;
        emit OrderShipped(orderId, msg.sender, trackingInfo);
    }

    // ── AI Agent Actions ──────────────────────────────────

    function agentRelease(uint256 orderId, string calldata attestationId)
        external orderExists(orderId) nonReentrant notLocked(orderId)
    {
        require(msg.sender == authorizedAgent, "EO: Not agent");
        Order storage o = _orders[orderId];
        require(o.status == OrderStatus.Paid || o.status == OrderStatus.Shipped, "EO: Bad status");
        require(bytes(attestationId).length > 0, "EO: No attestation");
        agentVerified[orderId] = true;
        emit AgentReleased(orderId, attestationId, block.timestamp);
        _releaseFundsToSeller(orderId);
    }

    // ── Timeouts ──────────────────────────────────────────

    function autoRelease(uint256 orderId)
        external orderExists(orderId) nonReentrant notLocked(orderId)
    {
        Order storage o = _orders[orderId];
        require(o.status == OrderStatus.Shipped, "EO: Not shipped");
        require(block.timestamp >= o.shippedAt + AUTO_RELEASE, "EO: Too early");
        emit AutoReleaseTriggered(orderId);
        _releaseFundsToSeller(orderId);
    }

    function autoRefund(uint256 orderId)
        external orderExists(orderId) nonReentrant notLocked(orderId)
    {
        Order storage o = _orders[orderId];
        require(o.status == OrderStatus.Paid, "EO: Not paid");
        require(block.timestamp >= o.createdAt + SHIPPING_TIMEOUT, "EO: Too early");
        o.status = OrderStatus.Refunded;
        productRegistry.restoreStock(o.productId, o.quantity);
        emit AutoRefundTriggered(orderId);
        _issueRefund(orderId, o.buyer, o.amount);
    }

    // ── Dispute Resolution ────────────────────────────────

    function resolveDispute(uint256 orderId, bool refundBuyer)
        external orderExists(orderId) onlyDisputeResolver nonReentrant notLocked(orderId)
    {
        Order storage o = _orders[orderId];
        require(o.status == OrderStatus.Disputed, "EO: Not disputed");
        if (refundBuyer) {
            o.status = OrderStatus.Refunded;
            productRegistry.restoreStock(o.productId, o.quantity);
            _issueRefund(orderId, o.buyer, o.amount);
        } else {
            _releaseFundsToSeller(orderId);
        }
    }

    // ── Internal ──────────────────────────────────────────

    function _releaseFundsToSeller(uint256 orderId) internal {
        Order storage o = _orders[orderId];
        o.status = OrderStatus.Completed;
        o.completedAt = block.timestamp;
        uint256 sellerAmount = o.amount - o.platformFee;
        if (o.platformFee > 0) {
            (bool feeOk,) = payable(feeReceiver).call{value: o.platformFee}("");
            require(feeOk, "EO: Fee failed");
            totalFeesCollected += o.platformFee;
        }
        (bool ok,) = o.seller.call{value: sellerAmount}("");
        require(ok, "EO: Seller pay failed");
        emit FundsReleased(orderId, o.seller, sellerAmount);
    }

    function _issueRefund(uint256 orderId, address buyer, uint256 amount) internal {
        (bool ok,) = payable(buyer).call{value: amount}("");
        require(ok, "EO: Refund failed");
        totalRefunded += amount;
        emit RefundIssued(orderId, buyer, amount);
    }

    // ── Views ─────────────────────────────────────────────

    function getOrder(uint256 orderId) external view orderExists(orderId) returns (Order memory) { return _orders[orderId]; }
    function getBuyerOrders(address buyer)   external view returns (uint256[] memory) { return _buyerOrders[buyer]; }
    function getSellerOrders(address seller) external view returns (uint256[] memory) { return _sellerOrders[seller]; }
    function getTotalOrders()   external view returns (uint256) { return _orderIds.current(); }
    function getEscrowBalance() external view returns (uint256) { return address(this).balance; }
    function getAnalytics() external view returns (uint256, uint256, uint256, uint256, uint256) {
        return (totalVolume, totalOrders, totalFeesCollected, totalRefunded, address(this).balance);
    }

    // ── Admin ─────────────────────────────────────────────

    function setAuthorizedAgent(address _agent) external onlyOwner {
        require(_agent != address(0), "EO: Zero addr");
        authorizedAgent = _agent;
        emit AuthorizedAgentSet(_agent);
    }
    function setDisputeResolver(address _r) external onlyOwner {
        require(_r != address(0), "EO: Zero addr");
        disputeResolver = _r;
        emit DisputeResolverSet(_r);
    }
    function setPlatformFee(uint256 f)   external onlyOwner { require(f <= 1000, "EO: Max 10%"); platformFeePercent = f; }
    function setFeeReceiver(address r)   external onlyOwner { require(r != address(0)); feeReceiver = r; }
    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
    function emergencyWithdraw() external onlyOwner whenPaused {
        (bool ok,) = payable(owner()).call{value: address(this).balance}("");
        require(ok);
    }
    receive() external payable {}
    fallback() external payable {}
}
