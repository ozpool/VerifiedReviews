// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IERC5192} from "./interfaces/IERC5192.sol";

/// @title VisitProofSBT
/// @notice A non-transferable (soulbound, ERC-5192) receipt minted at a
///         business's point-of-sale. Each token records which business issued
///         it and when, so `ReviewRegistry` can gate reviews on a recent visit.
///
/// @dev Spec
/// State:
///   - visits[tokenId] = { businessId, visitedAt }
///   - latestVisit[account][businessId] = newest tokenId (0 = none)
///   - businessMinter[businessId] = the only address allowed to mint for it
///   - _nextTokenId : monotonically increasing, starts at 1 (0 is the sentinel)
/// External functions:
///   - setBusinessMinter(businessId, minter)  onlyRole(DEFAULT_ADMIN_ROLE)
///   - mint(to, businessId) -> tokenId         only the business's minter
///   - locked(tokenId) -> bool                 always true for existing tokens
/// Events: BusinessMinterSet, Locked (Transfer comes from ERC721)
/// Errors: NotBusinessMinter, Soulbound
/// Invariants:
///   - every minted token is locked forever (transfers revert; locked()==true)
///   - latestVisit[to][businessId] points at the most recent mint for that pair
///   - only businessMinter[businessId] may mint that business's tokens
contract VisitProofSBT is ERC721, AccessControl, IERC5192 {
    struct VisitData {
        uint256 businessId;
        uint64 visitedAt;
    }

    /// @notice Visit metadata recorded at mint, keyed by tokenId.
    mapping(uint256 tokenId => VisitData) public visits;

    /// @notice Newest tokenId minted to `account` for `businessId` (0 if none).
    mapping(address account => mapping(uint256 businessId => uint256 tokenId)) public latestVisit;

    /// @notice The single address authorized to mint a given business's tokens.
    mapping(uint256 businessId => address minter) public businessMinter;

    uint256 private _nextTokenId = 1;

    /// @notice Emitted when an admin (re)assigns a business's minter.
    event BusinessMinterSet(uint256 indexed businessId, address indexed minter);

    /// @dev Caller is not the assigned minter for `businessId`.
    error NotBusinessMinter(address caller, uint256 businessId);

    /// @dev Attempted a transfer of a soulbound token.
    error Soulbound();

    constructor(address admin) ERC721("VisitProof", "VISIT") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /// @notice Assign (or clear, with address(0)) the minter for a business.
    /// @dev Admin-only. Clearing to address(0) disables minting for that business.
    function setBusinessMinter(uint256 businessId, address minter)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        businessMinter[businessId] = minter;
        emit BusinessMinterSet(businessId, minter);
    }

    /// @notice Mint a VisitProof to `to` for `businessId`. Callable only by that
    ///         business's assigned minter.
    /// @return tokenId The id of the freshly minted soulbound token.
    function mint(address to, uint256 businessId) external returns (uint256 tokenId) {
        // Checks
        if (msg.sender != businessMinter[businessId]) {
            revert NotBusinessMinter(msg.sender, businessId);
        }

        // Effects
        tokenId = _nextTokenId++;
        visits[tokenId] = VisitData({businessId: businessId, visitedAt: uint64(block.timestamp)});
        latestVisit[to][businessId] = tokenId;

        // Interactions: _mint performs no external call (unlike _safeMint), so
        // there is no reentrancy surface and a mint to a non-receiver contract
        // wallet cannot be blocked.
        _mint(to, tokenId);
        emit Locked(tokenId);
    }

    /// @notice Convenience read for the gate: the newest token + its timestamp.
    /// @return tokenId 0 if the account has no VisitProof for this business.
    /// @return visitedAt The mint timestamp of that token (0 when tokenId is 0).
    function latestVisitOf(address account, uint256 businessId)
        external
        view
        returns (uint256 tokenId, uint64 visitedAt)
    {
        tokenId = latestVisit[account][businessId];
        visitedAt = visits[tokenId].visitedAt;
    }

    /// @inheritdoc IERC5192
    function locked(uint256 tokenId) external view returns (bool) {
        _requireOwned(tokenId); // reverts ERC721NonexistentToken if it doesn't exist
        return true;
    }

    /// @dev The single transfer chokepoint in OZ v5. Allow mint (from == 0) and
    ///      burn (to == 0); revert everything else to enforce soulbinding.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert Soulbound();
        }
        return super._update(to, tokenId, auth);
    }

    /// @dev Advertise ERC-721, AccessControl, and ERC-5192 support.
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return interfaceId == type(IERC5192).interfaceId || super.supportsInterface(interfaceId);
    }
}
