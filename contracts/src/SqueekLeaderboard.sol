// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @notice A public, self-reported arcade leaderboard. No fees or token transfers.
/// @dev This stores claims; it does not prove that an off-chain game was played honestly.
contract SqueekLeaderboard {
    uint256 public constant MAX_ENTRIES = 50;
    uint64 public constant MAX_SCORE = 1_000_000_000;

    struct Entry {
        address player;
        uint64 score;
        string nickname;
    }
    Entry[] private entries;
    mapping(address => uint64) public personalBest;

    error InvalidScore();
    error InvalidNickname();
    error NotPersonalBest();
    error BelowLeaderboard();
    event ScoreSubmitted(address indexed player, uint64 score, string nickname, uint256 rank);

    function version() external pure returns (uint256) {
        return 1;
    }

    function getLeaderboard() external view returns (Entry[] memory) {
        return entries;
    }

    /// @notice Updates only a player's best score. Ties keep earlier players first.
    /// @param nickname 1–24 ASCII bytes: letters, digits, internal spaces, dot, dash, underscore.
    function submitScore(uint64 score, string calldata nickname) external {
        if (score == 0 || score > MAX_SCORE) revert InvalidScore();
        bytes memory n = bytes(nickname);
        if (n.length == 0 || n.length > 24 || n[0] == 0x20 || n[n.length - 1] == 0x20) revert InvalidNickname();
        for (uint256 j; j < n.length; ++j) {
            bytes1 ch = n[j];
            if (!((ch >= 0x41 && ch <= 0x5a) || (ch >= 0x61 && ch <= 0x7a) || (ch >= 0x30 && ch <= 0x39) || ch == 0x20
                        || ch == 0x2e || ch == 0x2d || ch == 0x5f)) revert InvalidNickname();
        }
        if (score <= personalBest[msg.sender]) revert NotPersonalBest();
        uint256 length = entries.length;
        uint256 existing = length;
        for (uint256 i; i < length; ++i) {
            if (entries[i].player == msg.sender) {
                existing = i;
                break;
            }
        }
        if (existing == length && length == MAX_ENTRIES && score <= entries[length - 1].score) {
            revert BelowLeaderboard();
        }
        if (existing < length) {
            for (uint256 i = existing; i + 1 < length; ++i) {
                entries[i] = entries[i + 1];
            }
            entries.pop();
        } else if (length == MAX_ENTRIES) {
            entries.pop();
        }
        entries.push(Entry(msg.sender, score, nickname));
        uint256 position = entries.length - 1;
        while (position > 0 && entries[position - 1].score < score) {
            entries[position] = entries[position - 1];
            --position;
        }
        entries[position] = Entry(msg.sender, score, nickname);
        personalBest[msg.sender] = score;
        emit ScoreSubmitted(msg.sender, score, nickname, position + 1);
    }
}
