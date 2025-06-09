
// Simple Attacker contract for testing reentrancy and contract entry
// Place this in a separate file like `Attacker.sol` in your contracts folder
// and compile it, or define it as a string and compile dynamically in tests (more complex).
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ISimpleLottery {
    function enterLottery() external payable;
}

contract Attacker {
    ISimpleLottery public lottery;
    address payable public owner;

    constructor(address payable _lotteryAddress) {
        lottery = ISimpleLottery(_lotteryAddress);
        owner = payable(msg.sender);
    }

    function attack() public payable {
        lottery.enterLottery{value: msg.value}();
    }

    // Fallback to receive Ether
    receive() external payable {}

    function withdraw() public {
        owner.transfer(address(this).balance);
    }
}