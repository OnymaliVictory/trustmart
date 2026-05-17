// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ProductRegistry
 * @author TrustMart Team
 * @notice Manages product listings for TrustMart decentralized marketplace on Kite Chain
 * @dev Products are stored on-chain with IPFS/URL image references
 */
contract ProductRegistry is Ownable, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;

    Counters.Counter private _productIds;

    // ─────────────────────────────────────────────────────────
    //  STATE VARIABLES
    // ─────────────────────────────────────────────────────────

    uint256 public listingFee = 0.001 ether;    // Anti-spam fee in KITE
    uint256 public platformFeePercent = 250;    // 2.5% (basis points)
    address public feeReceiver;

    enum Category {
        Electronics,
        Clothing,
        Food,
        Books,
        Sports,
        Home,
        Services,
        Other
    }

    struct Product {
        uint256 id;
        address payable seller;
        string name;
        string description;
        string imageUrl;
        uint256 price;          // Price in wei (KITE)
        uint256 stock;
        Category category;
        bool isActive;
        uint256 createdAt;
        uint256 totalSold;
        uint256 totalRating;    // Sum of all ratings (1-5 each)
        uint256 reviewCount;
    }

    mapping(uint256 => Product) private _products;
    mapping(address => uint256[]) private _sellerProducts;
    mapping(address => bool) public authorizedContracts;
    mapping(address => bool) public verifiedSellers;

    // ─────────────────────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────────────────────

    event ProductCreated(
        uint256 indexed productId,
        address indexed seller,
        string name,
        uint256 price,
        uint256 stock,
        Category category
    );
    event ProductUpdated(uint256 indexed productId, uint256 newPrice, uint256 newStock);
    event ProductStatusChanged(uint256 indexed productId, bool isActive);
    event StockUpdated(uint256 indexed productId, uint256 newStock);
    event RatingUpdated(uint256 indexed productId, uint256 newAvgRating, uint256 reviewCount);
    event SellerVerified(address indexed seller);
    event ContractAuthorized(address indexed contractAddr, bool status);
    event ListingFeeUpdated(uint256 newFee);
    event PlatformFeeUpdated(uint256 newFeePercent);

    // ─────────────────────────────────────────────────────────
    //  MODIFIERS
    // ─────────────────────────────────────────────────────────

    modifier onlyProductSeller(uint256 productId) {
        require(_products[productId].seller == msg.sender, "PR: Not seller");
        _;
    }

    modifier productExists(uint256 productId) {
        require(productId > 0 && productId <= _productIds.current(), "PR: Not found");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedContracts[msg.sender], "PR: Not authorized");
        _;
    }

    // ─────────────────────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────────────────────

    constructor(address _feeReceiver) {
        require(_feeReceiver != address(0), "PR: Invalid fee receiver");
        feeReceiver = _feeReceiver;
    }

    // ─────────────────────────────────────────────────────────
    //  PRODUCT MANAGEMENT
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Create a new product listing
     * @param name Product name (max 100 chars)
     * @param description Product description (max 1000 chars)
     * @param imageUrl IPFS CID or URL for product image
     * @param price Price per unit in wei (KITE)
     * @param stock Number of units available (1-10000)
     * @param category Product category enum
     * @return productId The newly created product ID
     */
    function createProduct(
        string calldata name,
        string calldata description,
        string calldata imageUrl,
        uint256 price,
        uint256 stock,
        Category category
    ) external payable whenNotPaused nonReentrant returns (uint256) {
        require(msg.value >= listingFee, "PR: Insufficient listing fee");
        require(bytes(name).length > 0 && bytes(name).length <= 100, "PR: Invalid name length");
        require(bytes(description).length <= 1000, "PR: Description too long");
        require(bytes(imageUrl).length > 0 && bytes(imageUrl).length <= 500, "PR: Invalid image URL");
        require(price > 0, "PR: Price must be > 0");
        require(stock > 0 && stock <= 10000, "PR: Stock out of range [1,10000]");

        _productIds.increment();
        uint256 productId = _productIds.current();

        _products[productId] = Product({
            id: productId,
            seller: payable(msg.sender),
            name: name,
            description: description,
            imageUrl: imageUrl,
            price: price,
            stock: stock,
            category: category,
            isActive: true,
            createdAt: block.timestamp,
            totalSold: 0,
            totalRating: 0,
            reviewCount: 0
        });

        _sellerProducts[msg.sender].push(productId);

        // Transfer listing fee to feeReceiver
        (bool success, ) = payable(feeReceiver).call{value: msg.value}("");
        require(success, "PR: Fee transfer failed");

        emit ProductCreated(productId, msg.sender, name, price, stock, category);
        return productId;
    }

    /**
     * @notice Update existing product details
     */
    function updateProduct(
        uint256 productId,
        uint256 newPrice,
        uint256 newStock,
        string calldata newDescription,
        string calldata newImageUrl
    ) external productExists(productId) onlyProductSeller(productId) whenNotPaused {
        require(newPrice > 0, "PR: Price must be > 0");
        require(newStock <= 10000, "PR: Stock out of range");
        require(bytes(newDescription).length <= 1000, "PR: Description too long");

        Product storage p = _products[productId];
        p.price = newPrice;
        p.stock = newStock;
        p.description = newDescription;
        if (bytes(newImageUrl).length > 0) p.imageUrl = newImageUrl;

        emit ProductUpdated(productId, newPrice, newStock);
    }

    /**
     * @notice Enable or disable a product listing
     */
    function setProductStatus(uint256 productId, bool active)
        external
        productExists(productId)
        onlyProductSeller(productId)
    {
        _products[productId].isActive = active;
        emit ProductStatusChanged(productId, active);
    }

    // ─────────────────────────────────────────────────────────
    //  AUTHORIZED CONTRACT CALLS (EscrowOrder, ReputationSystem)
    // ─────────────────────────────────────────────────────────

    function decreaseStock(uint256 productId, uint256 quantity)
        external
        productExists(productId)
        onlyAuthorized
    {
        Product storage p = _products[productId];
        require(p.stock >= quantity, "PR: Insufficient stock");
        p.stock -= quantity;
        p.totalSold += quantity;
        emit StockUpdated(productId, p.stock);
    }

    function restoreStock(uint256 productId, uint256 quantity)
        external
        productExists(productId)
        onlyAuthorized
    {
        _products[productId].stock += quantity;
        emit StockUpdated(productId, _products[productId].stock);
    }

    function updateRating(uint256 productId, uint256 totalRating, uint256 reviewCount)
        external
        productExists(productId)
        onlyAuthorized
    {
        _products[productId].totalRating = totalRating;
        _products[productId].reviewCount = reviewCount;
        uint256 avg = reviewCount > 0 ? (totalRating * 100) / reviewCount : 0;
        emit RatingUpdated(productId, avg, reviewCount);
    }

    // ─────────────────────────────────────────────────────────
    //  VIEW FUNCTIONS
    // ─────────────────────────────────────────────────────────

    function getProduct(uint256 productId)
        external
        view
        productExists(productId)
        returns (Product memory)
    {
        return _products[productId];
    }

    function getSellerProducts(address seller) external view returns (uint256[] memory) {
        return _sellerProducts[seller];
    }

    function getTotalProducts() external view returns (uint256) {
        return _productIds.current();
    }

    /**
     * @notice Fetch paginated products
     * @param from Starting product ID (1-indexed)
     * @param count Number of products to fetch
     */
    function getProductsBatch(uint256 from, uint256 count)
        external
        view
        returns (Product[] memory)
    {
        uint256 total = _productIds.current();
        if (from < 1) from = 1;
        if (from > total) return new Product[](0);

        uint256 end = from + count - 1;
        if (end > total) end = total;
        uint256 resultCount = end - from + 1;

        Product[] memory result = new Product[](resultCount);
        for (uint256 i = 0; i < resultCount; i++) {
            result[i] = _products[from + i];
        }
        return result;
    }

    /**
     * @notice Get only active products for a seller
     */
    function getActiveSellerProducts(address seller) external view returns (Product[] memory) {
        uint256[] memory ids = _sellerProducts[seller];
        uint256 activeCount;
        for (uint256 i = 0; i < ids.length; i++) {
            if (_products[ids[i]].isActive) activeCount++;
        }

        Product[] memory result = new Product[](activeCount);
        uint256 idx;
        for (uint256 i = 0; i < ids.length; i++) {
            if (_products[ids[i]].isActive) {
                result[idx++] = _products[ids[i]];
            }
        }
        return result;
    }

    // ─────────────────────────────────────────────────────────
    //  ADMIN
    // ─────────────────────────────────────────────────────────

    function authorizeContract(address contractAddr, bool status) external onlyOwner {
        require(contractAddr != address(0), "PR: Zero address");
        authorizedContracts[contractAddr] = status;
        emit ContractAuthorized(contractAddr, status);
    }

    function verifySeller(address seller) external onlyOwner {
        verifiedSellers[seller] = true;
        emit SellerVerified(seller);
    }

    function setListingFee(uint256 newFee) external onlyOwner {
        listingFee = newFee;
        emit ListingFeeUpdated(newFee);
    }

    function setPlatformFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 1000, "PR: Max 10%");
        platformFeePercent = newFeePercent;
        emit PlatformFeeUpdated(newFeePercent);
    }

    function setFeeReceiver(address newReceiver) external onlyOwner {
        require(newReceiver != address(0), "PR: Zero address");
        feeReceiver = newReceiver;
    }

    function adminDeactivateProduct(uint256 productId)
        external
        onlyOwner
        productExists(productId)
    {
        _products[productId].isActive = false;
        emit ProductStatusChanged(productId, false);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
