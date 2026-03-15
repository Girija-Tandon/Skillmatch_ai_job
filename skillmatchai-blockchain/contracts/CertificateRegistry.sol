// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CertificateRegistry
 * @author SkillMatchAI Team
 * @notice Tamper-proof certificate validation on Polygon blockchain
 * @dev Stores SHA-256 hashes of validated certificates permanently
 */
contract CertificateRegistry {

    // ── Data Structures ──────────────────────────────────────────────────────

    struct Certificate {
        string   fileHash;     // SHA-256 hash of the certificate file
        string   userId;       // Platform user ID who owns this cert
        uint256  timestamp;    // Unix timestamp of registration
        bool     isValid;      // Current validity (false = revoked)
        string   ipfsHash;     // IPFS CID for file storage
        address  registeredBy; // Which admin registered this
    }

    // ── State Variables ───────────────────────────────────────────────────────

    mapping(string => Certificate) private certificates;
    mapping(address => bool) public admins;
    address public owner;

    uint256 public totalRegistered;
    uint256 public totalRevoked;

    // ── Events ────────────────────────────────────────────────────────────────

    event CertificateRegistered(
        string indexed fileHash,
        string userId,
        uint256 timestamp,
        address registeredBy
    );

    event CertificateRevoked(
        string indexed fileHash,
        uint256 timestamp,
        address revokedBy
    );

    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

    // ── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "CertificateRegistry: Only owner");
        _;
    }

    modifier onlyAdmin() {
        require(
            admins[msg.sender] || msg.sender == owner,
            "CertificateRegistry: Only admin or owner"
        );
        _;
    }

    modifier validHash(string memory hash) {
        require(bytes(hash).length == 64, "CertificateRegistry: Hash must be 64 chars (SHA-256)");
        _;
    }

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;
        emit AdminAdded(msg.sender);
    }

    // ── Admin Management ──────────────────────────────────────────────────────

    function addAdmin(address _admin) external onlyOwner {
        require(_admin != address(0), "Invalid address");
        require(!admins[_admin], "Already an admin");
        admins[_admin] = true;
        emit AdminAdded(_admin);
    }

    function removeAdmin(address _admin) external onlyOwner {
        require(_admin != owner, "Cannot remove owner");
        admins[_admin] = false;
        emit AdminRemoved(_admin);
    }

    // ── Core Functions ────────────────────────────────────────────────────────

    /**
     * @notice Register a validated certificate on the blockchain
     * @param fileHash SHA-256 hash of the certificate file (64 hex chars)
     * @param userId   Platform user ID who owns this certificate
     * @param ipfsHash IPFS CID where the file is stored (can be empty)
     */
    function registerCertificate(
        string memory fileHash,
        string memory userId,
        string memory ipfsHash
    ) external onlyAdmin validHash(fileHash) {
        require(bytes(userId).length > 0, "userId cannot be empty");
        require(
            !certificates[fileHash].isValid,
            "Certificate already registered and valid"
        );

        certificates[fileHash] = Certificate({
            fileHash:     fileHash,
            userId:       userId,
            timestamp:    block.timestamp,
            isValid:      true,
            ipfsHash:     ipfsHash,
            registeredBy: msg.sender
        });

        totalRegistered++;

        emit CertificateRegistered(fileHash, userId, block.timestamp, msg.sender);
    }

    /**
     * @notice Verify a certificate's authenticity
     * @param fileHash SHA-256 hash of the certificate file
     * @return isValid    Whether the certificate is currently valid
     * @return timestamp  When it was registered (0 if never registered)
     * @return userId     Who owns this certificate
     * @return ipfsHash   IPFS location of the file
     */
    function verifyCertificate(string memory fileHash)
        external
        view
        returns (
            bool   isValid,
            uint256 timestamp,
            string memory userId,
            string memory ipfsHash
        )
    {
        Certificate memory cert = certificates[fileHash];
        return (
            cert.isValid,
            cert.timestamp,
            cert.userId,
            cert.ipfsHash
        );
    }

    /**
     * @notice Revoke a certificate (mark as invalid)
     * @param fileHash SHA-256 hash of the certificate to revoke
     */
    function revokeCertificate(string memory fileHash)
        external
        onlyAdmin
        validHash(fileHash)
    {
        require(
            certificates[fileHash].timestamp > 0,
            "Certificate not found"
        );
        require(
            certificates[fileHash].isValid,
            "Certificate already revoked"
        );

        certificates[fileHash].isValid = false;
        totalRevoked++;

        emit CertificateRevoked(fileHash, block.timestamp, msg.sender);
    }

    /**
     * @notice Check if a hash has ever been registered (even if revoked)
     */
    function isRegistered(string memory fileHash) external view returns (bool) {
        return certificates[fileHash].timestamp > 0;
    }

    /**
     * @notice Get full certificate details (admin only for privacy)
     */
    function getCertificateDetails(string memory fileHash)
        external
        view
        onlyAdmin
        returns (Certificate memory)
    {
        return certificates[fileHash];
    }

    /**
     * @notice Get contract statistics
     */
    function getStats()
        external
        view
        returns (uint256 registered, uint256 revoked, uint256 active)
    {
        return (totalRegistered, totalRevoked, totalRegistered - totalRevoked);
    }
}
