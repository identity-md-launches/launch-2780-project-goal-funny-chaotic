// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {SqueekLeaderboard} from "../src/SqueekLeaderboard.sol";

interface TestVm {
    function prank(address) external;
    function expectRevert(bytes4) external;
    function expectEmit(bool, bool, bool, bool) external;
}

contract SqueekLeaderboardTest {
    TestVm constant vm = TestVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    SqueekLeaderboard board;
    event ScoreSubmitted(address indexed player, uint64 score, string nickname, uint256 rank);

    function setUp() public {
        board = new SqueekLeaderboard();
    }

    function submit(uint160 player, uint64 score) internal {
        vm.prank(address(player));
        board.submitScore(score, "Hamster");
    }

    function testInitiallyEmptyAndVersioned() public view {
        require(board.getLeaderboard().length == 0);
        require(board.version() == 1);
    }

    function testOrdersAndStoresAllFields() public {
        submit(1, 20);
        submit(2, 50);
        submit(3, 35);
        SqueekLeaderboard.Entry[] memory rows = board.getLeaderboard();
        require(rows.length == 3 && rows[0].player == address(2) && rows[1].score == 35 && rows[2].score == 20);
        require(keccak256(bytes(rows[0].nickname)) == keccak256("Hamster"));
    }

    function testUpdatesWithoutDuplicates() public {
        submit(1, 20);
        submit(2, 50);
        vm.prank(address(1));
        board.submitScore(80, "Poo Baron");
        SqueekLeaderboard.Entry[] memory rows = board.getLeaderboard();
        require(rows.length == 2 && rows[0].player == address(1) && rows[0].score == 80);
        require(keccak256(bytes(rows[0].nickname)) == keccak256("Poo Baron"));
    }

    function testTiePreservesEarlierPosition() public {
        submit(1, 10);
        submit(2, 20);
        submit(3, 20);
        submit(1, 20);
        SqueekLeaderboard.Entry[] memory rows = board.getLeaderboard();
        require(rows[0].player == address(2) && rows[1].player == address(3) && rows[2].player == address(1));
    }

    function testCappedAt50AndEvictedBestPersists() public {
        for (uint160 i = 1; i <= 50; ++i) {
            submit(i, uint64(i * 10));
        }
        submit(51, 501);
        require(board.getLeaderboard().length == 50 && board.getLeaderboard()[0].player == address(51));
        require(board.personalBest(address(1)) == 10);
        submit(1, 999);
        require(board.getLeaderboard().length == 50 && board.getLeaderboard()[0].player == address(1));
    }

    function testRejectsNonQualifyingAndTiedBottom() public {
        for (uint160 i = 1; i <= 50; ++i) {
            submit(i, 10);
        }
        vm.expectRevert(SqueekLeaderboard.BelowLeaderboard.selector);
        submit(51, 10);
        vm.expectRevert(SqueekLeaderboard.BelowLeaderboard.selector);
        submit(51, 9);
    }

    function testRejectsNonImprovement() public {
        submit(1, 30);
        vm.expectRevert(SqueekLeaderboard.NotPersonalBest.selector);
        submit(1, 30);
        vm.expectRevert(SqueekLeaderboard.NotPersonalBest.selector);
        submit(1, 20);
    }

    function testInvalidScores() public {
        vm.expectRevert(SqueekLeaderboard.InvalidScore.selector);
        board.submitScore(0, "Bob");
        vm.expectRevert(SqueekLeaderboard.InvalidScore.selector);
        board.submitScore(1_000_000_001, "Bob");
    }

    function testNicknameRules() public {
        string[7] memory bad = ["", " Bob", "Bob ", "<script>", "line\nfeed", "abcdefghijklmnopqrstuvwxyz", "Bob/1"];
        for (uint256 i; i < bad.length; ++i) {
            vm.expectRevert(SqueekLeaderboard.InvalidNickname.selector);
            board.submitScore(5, bad[i]);
        }
        board.submitScore(5, "Sir Squeek_2.0-jr");
    }

    function testEmitsRank() public {
        vm.expectEmit(true, false, false, true);
        emit ScoreSubmitted(address(this), 100, "Chef", 1);
        board.submitScore(100, "Chef");
    }

    function testFuzzSortedUniqueBounded(uint64[60] memory scores) public {
        for (uint160 i; i < 60; ++i) {
            uint64 score = uint64(uint256(scores[i]) % 1_000_000_000) + 1;
            vm.prank(address(i + 1));
            try board.submitScore(score, "Fuzzer") {} catch {}
        }
        SqueekLeaderboard.Entry[] memory rows = board.getLeaderboard();
        require(rows.length == 50);
        for (uint256 i; i < rows.length; ++i) {
            if (i > 0) require(rows[i - 1].score >= rows[i].score);
            require(rows[i].score == board.personalBest(rows[i].player));
            for (uint256 j = i + 1; j < rows.length; ++j) {
                require(rows[i].player != rows[j].player);
            }
        }
    }
}
