// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {SqueekLeaderboard} from "../src/SqueekLeaderboard.sol";

interface BroadcastVm {
    function startBroadcast() external;
    function stopBroadcast() external;
}

contract Deploy {
    BroadcastVm private constant vm = BroadcastVm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external returns (SqueekLeaderboard leaderboard) {
        require(block.chainid == 11155111, "Deploy only to Sepolia");
        vm.startBroadcast();
        leaderboard = new SqueekLeaderboard();
        vm.stopBroadcast();
    }
}
