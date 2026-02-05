// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CertiChain
 * @notice Decentralized document verification using ERC-721 NFTs
 * @dev Documents are represented as NFTs with their SHA-256 hash stored on-chain
 */
contract CertiChain is 
    ERC721, 
    ERC721URIStorage, 
    AccessControl, 
    ReentrancyGuard,
    Pausable 
{
    // ============ Roles ============
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // ============ State ============
    uint256 private _nextTokenId;
    
    struct DocumentCertificate {
        bytes32 documentHash;
        address issuer;
        address holder;
        uint256 issuedAt;
        bool isRevoked;
        string revocationReason;
    }

    // tokenId => DocumentCertificate
    mapping(uint256 => DocumentCertificate) public documents;
    
    // documentHash => exists (prevents duplicates)
    mapping(bytes32 => bool) public hashExists;
    
    // documentHash => tokenId (for lookup by hash)
    mapping(bytes32 => uint256) public hashToTokenId;

    // ============ Events ============
    event DocumentIssued(
        uint256 indexed tokenId,
        bytes32 indexed documentHash,
        address indexed issuer,
        address holder,
        uint256 timestamp
    );

    event DocumentRevoked(
        uint256 indexed tokenId,
        address indexed revoker,
        string reason,
        uint256 timestamp
    );

    event IssuerAdded(address indexed issuer, address indexed grantedBy);
    event IssuerRemoved(address indexed issuer, address indexed revokedBy);

    // ============ Errors ============
    error InvalidHash();
    error InvalidAddress();
    error DocumentAlreadyExists();
    error DocumentNotFound();
    error NotDocumentIssuer();
    error DocumentAlreadyRevoked();

    // ============ Constructor ============
    constructor() ERC721("CertiChain Document", "CERT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
        _nextTokenId = 1;
    }

    // ============ Admin Functions ============
    
    /**
     * @notice Grant issuer role to an address
     * @param issuer Address to grant issuer role
     */
    function addIssuer(address issuer) external onlyRole(ADMIN_ROLE) {
        if (issuer == address(0)) revert InvalidAddress();
        _grantRole(ISSUER_ROLE, issuer);
        emit IssuerAdded(issuer, msg.sender);
    }

    /**
     * @notice Revoke issuer role from an address
     * @param issuer Address to revoke issuer role
     */
    function removeIssuer(address issuer) external onlyRole(ADMIN_ROLE) {
        _revokeRole(ISSUER_ROLE, issuer);
        emit IssuerRemoved(issuer, msg.sender);
    }

    /**
     * @notice Pause contract (emergency stop)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // ============ Core Functions ============

    /**
     * @notice Issue a new document certificate
     * @param documentHash SHA-256 hash of the document
     * @param holder Address of the document holder
     * @param uri Token URI (metadata)
     * @return tokenId The ID of the minted token
     */
    function issueDocument(
        bytes32 documentHash,
        address holder,
        string calldata uri
    ) 
        external 
        onlyRole(ISSUER_ROLE) 
        nonReentrant 
        whenNotPaused
        returns (uint256) 
    {
        // CHECKS
        if (documentHash == bytes32(0)) revert InvalidHash();
        if (holder == address(0)) revert InvalidAddress();
        if (hashExists[documentHash]) revert DocumentAlreadyExists();

        // EFFECTS
        uint256 tokenId = _nextTokenId++;
        
        documents[tokenId] = DocumentCertificate({
            documentHash: documentHash,
            issuer: msg.sender,
            holder: holder,
            issuedAt: block.timestamp,
            isRevoked: false,
            revocationReason: ""
        });

        hashExists[documentHash] = true;
        hashToTokenId[documentHash] = tokenId;

        // INTERACTIONS
        _safeMint(holder, tokenId);
        _setTokenURI(tokenId, uri);

        emit DocumentIssued(tokenId, documentHash, msg.sender, holder, block.timestamp);

        return tokenId;
    }

    /**
     * @notice Revoke a document certificate
     * @param tokenId ID of the document to revoke
     * @param reason Reason for revocation
     */
    function revokeDocument(
        uint256 tokenId,
        string calldata reason
    ) 
        external 
        onlyRole(ISSUER_ROLE) 
        nonReentrant 
        whenNotPaused 
    {
        DocumentCertificate storage doc = documents[tokenId];
        
        // CHECKS
        if (doc.issuedAt == 0) revert DocumentNotFound();
        if (doc.issuer != msg.sender && !hasRole(ADMIN_ROLE, msg.sender)) {
            revert NotDocumentIssuer();
        }
        if (doc.isRevoked) revert DocumentAlreadyRevoked();

        // EFFECTS
        doc.isRevoked = true;
        doc.revocationReason = reason;

        emit DocumentRevoked(tokenId, msg.sender, reason, block.timestamp);
    }

    // ============ View Functions ============

    /**
     * @notice Verify a document's authenticity
     * @param tokenId ID of the document
     * @param documentHash Hash to verify against
     * @return isValid Whether the hash matches
     * @return isRevoked Whether the document is revoked
     */
    function verifyDocument(
        uint256 tokenId,
        bytes32 documentHash
    ) external view returns (bool isValid, bool isRevoked) {
        DocumentCertificate memory doc = documents[tokenId];
        
        if (doc.issuedAt == 0) {
            return (false, false);
        }

        isValid = (doc.documentHash == documentHash);
        isRevoked = doc.isRevoked;
    }

    /**
     * @notice Get document information
     * @param tokenId ID of the document
     */
    function getDocumentInfo(uint256 tokenId) 
        external 
        view 
        returns (
            bytes32 documentHash,
            address issuer,
            address holder,
            uint256 issuedAt,
            bool isRevoked,
            string memory revocationReason
        ) 
    {
        DocumentCertificate memory doc = documents[tokenId];
        if (doc.issuedAt == 0) revert DocumentNotFound();
        
        return (
            doc.documentHash,
            doc.issuer,
            doc.holder,
            doc.issuedAt,
            doc.isRevoked,
            doc.revocationReason
        );
    }

    /**
     * @notice Get token ID by document hash
     * @param documentHash Hash to lookup
     */
    function getTokenIdByHash(bytes32 documentHash) external view returns (uint256) {
        if (!hashExists[documentHash]) revert DocumentNotFound();
        return hashToTokenId[documentHash];
    }

    /**
     * @notice Get total documents issued
     */
    function totalDocuments() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    // ============ Required Overrides ============

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
