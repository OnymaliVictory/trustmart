// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// ─── Interfaces at TOP LEVEL (not inside contract) ────────

interface IEscrowOrderRS {
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

interface IProductRegistryRS {
    function updateRating(uint256 productId, uint256 totalRating, uint256 reviewCount) external;
}

contract ReputationSystem is Ownable, ERC721URIStorage, ReentrancyGuard {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;
    Counters.Counter private _reviewIds;

    IEscrowOrderRS    public escrowOrder;
    IProductRegistryRS public productRegistry;

    // Badge thresholds (completed sales)
    uint256 public constant BRONZE_SALES   = 5;
    uint256 public constant SILVER_SALES   = 25;
    uint256 public constant GOLD_SALES     = 100;
    uint256 public constant PLATINUM_SALES = 500;

    string[5] public badgeURIs;

    struct Review {
        uint256 id;
        uint256 orderId;
        uint256 productId;
        address buyer;
        address seller;
        uint8   rating;
        string  comment;
        uint256 createdAt;
        bool    verified;
    }

    struct SellerReputation {
        uint256 totalRatingPoints;
        uint256 reviewCount;
        uint256 completedSales;
        uint256 badgeLevel;
        uint256 badgeTokenId;
    }

    mapping(uint256 => Review)           private _reviews;
    mapping(address => SellerReputation) private _sellerReps;
    mapping(address => uint256[])        private _sellerReviewIds;
    mapping(address => uint256[])        private _buyerReviewIds;
    mapping(uint256 => uint256[])        private _productReviews;
    mapping(uint256 => bool)             public  orderReviewed;

    event ReviewSubmitted(uint256 indexed reviewId, uint256 indexed orderId, address indexed buyer, address seller, uint8 rating, uint256 productId);
    event BadgeMinted(address indexed seller, uint256 indexed tokenId, uint256 badgeLevel);
    event BadgeUpgraded(address indexed seller, uint256 indexed tokenId, uint256 newLevel);
    event ReputationUpdated(address indexed seller, uint256 avgRating100x, uint256 reviewCount);

    constructor(address _escrowOrder, address _productRegistry)
        ERC721("TrustMart Seller Badge", "TMSB")
    {
        require(_escrowOrder != address(0),      "RS: Invalid escrow");
        require(_productRegistry != address(0),  "RS: Invalid registry");
        escrowOrder     = IEscrowOrderRS(_escrowOrder);
        productRegistry = IProductRegistryRS(_productRegistry);

        badgeURIs[0] = "";
        badgeURIs[1] = "ipfs://QmBronzeBadgeTrustMart";
        badgeURIs[2] = "ipfs://QmSilverBadgeTrustMart";
        badgeURIs[3] = "ipfs://QmGoldBadgeTrustMart";
        badgeURIs[4] = "ipfs://QmPlatinumBadgeTrustMart";
    }

    // ── Submit review ─────────────────────────────────────

    function submitReview(uint256 orderId, uint8 rating, string calldata comment)
        external nonReentrant
    {
        require(!orderReviewed[orderId], "RS: Already reviewed");
        require(rating >= 1 && rating <= 5, "RS: Rating 1-5");
        require(bytes(comment).length <= 500, "RS: Comment too long");

        // Fetch order — status 5 = Completed, 2 = Delivered
        (,uint256 productId, address buyer, address payable seller,,,,uint8 status,,,,, ) =
            escrowOrder.getOrder(orderId);

        require(buyer == msg.sender, "RS: Not the buyer");
        require(status == 5 || status == 2, "RS: Order not completed");

        _reviewIds.increment();
        uint256 reviewId = _reviewIds.current();

        _reviews[reviewId] = Review({
            id:        reviewId,
            orderId:   orderId,
            productId: productId,
            buyer:     msg.sender,
            seller:    seller,
            rating:    rating,
            comment:   comment,
            createdAt: block.timestamp,
            verified:  true
        });

        orderReviewed[orderId] = true;
        _sellerReviewIds[seller].push(reviewId);
        _buyerReviewIds[msg.sender].push(reviewId);
        _productReviews[productId].push(reviewId);

        SellerReputation storage rep = _sellerReps[seller];
        rep.totalRatingPoints += rating;
        rep.reviewCount++;
        rep.completedSales++;

        productRegistry.updateRating(productId, rep.totalRatingPoints, rep.reviewCount);

        uint256 avg = (rep.totalRatingPoints * 100) / rep.reviewCount;
        emit ReviewSubmitted(reviewId, orderId, msg.sender, seller, rating, productId);
        emit ReputationUpdated(seller, avg, rep.reviewCount);

        _checkBadge(seller);
    }

    // ── Badge logic ───────────────────────────────────────

    function _checkBadge(address seller) internal {
        SellerReputation storage rep = _sellerReps[seller];
        uint256 sales = rep.completedSales;
        uint256 current = rep.badgeLevel;
        uint256 newLevel;

        if      (sales >= PLATINUM_SALES) newLevel = 4;
        else if (sales >= GOLD_SALES)     newLevel = 3;
        else if (sales >= SILVER_SALES)   newLevel = 2;
        else if (sales >= BRONZE_SALES)   newLevel = 1;
        else return;

        if (newLevel <= current) return;

        rep.badgeLevel = newLevel;

        if (rep.badgeTokenId == 0) {
            _tokenIds.increment();
            uint256 tokenId = _tokenIds.current();
            _mint(seller, tokenId);
            _setTokenURI(tokenId, badgeURIs[newLevel]);
            rep.badgeTokenId = tokenId;
            emit BadgeMinted(seller, tokenId, newLevel);
        } else {
            _setTokenURI(rep.badgeTokenId, badgeURIs[newLevel]);
            emit BadgeUpgraded(seller, rep.badgeTokenId, newLevel);
        }
    }

    // ── Views ─────────────────────────────────────────────

    function getSellerReputation(address seller) external view returns (
        uint256 avgRating, uint256 reviewCount, uint256 completedSales,
        uint256 badgeLevel, uint256 badgeTokenId
    ) {
        SellerReputation memory rep = _sellerReps[seller];
        avgRating      = rep.reviewCount > 0 ? (rep.totalRatingPoints * 100) / rep.reviewCount : 0;
        reviewCount    = rep.reviewCount;
        completedSales = rep.completedSales;
        badgeLevel     = rep.badgeLevel;
        badgeTokenId   = rep.badgeTokenId;
    }

    function getReview(uint256 reviewId)               external view returns (Review memory) { return _reviews[reviewId]; }
    function getSellerReviewIds(address seller)         external view returns (uint256[] memory) { return _sellerReviewIds[seller]; }
    function getBuyerReviewIds(address buyer)           external view returns (uint256[] memory) { return _buyerReviewIds[buyer]; }
    function getProductReviewIds(uint256 productId)     external view returns (uint256[] memory) { return _productReviews[productId]; }
    function getTotalReviews()                          external view returns (uint256) { return _reviewIds.current(); }

    function getBadgeName(uint256 level) external pure returns (string memory) {
        if (level == 1) return "Bronze";
        if (level == 2) return "Silver";
        if (level == 3) return "Gold";
        if (level == 4) return "Platinum";
        return "None";
    }

    // ── Admin ─────────────────────────────────────────────

    function setBadgeURI(uint256 level, string calldata uri) external onlyOwner {
        require(level < 5, "RS: Invalid level");
        badgeURIs[level] = uri;
    }

    function setContracts(address _escrow, address _registry) external onlyOwner {
        if (_escrow    != address(0)) escrowOrder     = IEscrowOrderRS(_escrow);
        if (_registry  != address(0)) productRegistry = IProductRegistryRS(_registry);
    }
}
