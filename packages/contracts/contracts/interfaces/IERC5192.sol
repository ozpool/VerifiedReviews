// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ERC-5192: Minimal Soulbound NFTs
/// @dev https://eips.ethereum.org/EIPS/eip-5192
/// @notice Marks an ERC-721 as permanently (or temporarily) non-transferable.
///         Wallets and marketplaces read `locked` to hide transfer/sell actions.
interface IERC5192 {
    /// @notice Emitted when a token is locked (becomes non-transferable).
    event Locked(uint256 tokenId);

    /// @notice Emitted when a token is unlocked (becomes transferable).
    event Unlocked(uint256 tokenId);

    /// @notice Returns the locking status of a token.
    /// @dev Reverts (via the owner check) if `tokenId` does not exist.
    /// @param tokenId The identifier for a token.
    function locked(uint256 tokenId) external view returns (bool);
}
