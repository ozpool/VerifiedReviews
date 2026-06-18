// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {VisitProofSBT} from "./VisitProofSBT.sol";

/// @title ReviewRegistry
/// @notice The on-chain review gate. A review is valid iff the submitter holds a
///         VisitProof for that business minted within the recency window. This
///         is where the product's trust model lives: the rule is enforced here,
///         not in any backend, so it holds even if the API is offline or hostile.
///
/// @dev Reviews are not stored on-chain — the emitted `ReviewSubmitted` event IS
///      the canonical record. Full prose + search index live off-chain in Mongo,
///      keyed by the content hash committed here.
///
/// Spec
/// State:  sbt (immutable), RECENCY_WINDOW (constant 60 days)
/// External: submit(businessId, contentHash, starRating)
/// Events: ReviewSubmitted
/// Errors: InvalidRating, NoVisitProof, VisitTooOld
/// Invariants:
///   - submit reverts unless msg.sender holds a VisitProof for businessId
///   - submit reverts unless that proof's visitedAt is within RECENCY_WINDOW
///   - no state is written; the contract holds no funds and no review storage
contract ReviewRegistry {
    /// @notice The soulbound visit-receipt contract this registry gates against.
    VisitProofSBT public immutable sbt;

    /// @notice Maximum age of a VisitProof that still permits a review.
    uint256 public constant RECENCY_WINDOW = 60 days;

    /// @notice Emitted on every accepted review. This is the canonical record.
    event ReviewSubmitted(
        uint256 indexed businessId,
        address indexed reviewer,
        bytes32 contentHash,
        uint8 starRating,
        uint256 timestamp
    );

    /// @dev Star rating outside the inclusive 1–5 range.
    error InvalidRating(uint8 starRating);

    /// @dev The submitter holds no VisitProof for this business.
    error NoVisitProof(address reviewer, uint256 businessId);

    /// @dev The submitter's most recent VisitProof is older than RECENCY_WINDOW.
    error VisitTooOld(uint64 visitedAt, uint256 nowTs);

    constructor(VisitProofSBT sbt_) {
        sbt = sbt_;
    }

    /// @notice Submit a review for `businessId`, committing `contentHash` and a
    ///         1–5 `starRating`. Reverts unless the caller holds a VisitProof for
    ///         that business minted within the last RECENCY_WINDOW.
    /// @param businessId  The business being reviewed.
    /// @param contentHash keccak256 commitment of the off-chain review content.
    /// @param starRating  Rating in the inclusive range [1, 5].
    function submit(uint256 businessId, bytes32 contentHash, uint8 starRating) external {
        // Checks
        if (starRating < 1 || starRating > 5) {
            revert InvalidRating(starRating);
        }

        (uint256 tokenId, uint64 visitedAt) = sbt.latestVisitOf(msg.sender, businessId);
        if (tokenId == 0) {
            revert NoVisitProof(msg.sender, businessId);
        }
        // visitedAt is set from block.timestamp at mint, so it is never in the
        // future and this subtraction cannot underflow.
        if (block.timestamp - visitedAt > RECENCY_WINDOW) {
            revert VisitTooOld(visitedAt, block.timestamp);
        }

        // No effects/interactions: the event log is the record.
        emit ReviewSubmitted(businessId, msg.sender, contentHash, starRating, block.timestamp);
    }
}
