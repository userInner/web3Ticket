// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimpleLottery
 * @dev A basic decentralized lottery contract.
 * IMPORTANT: The random number generation in this contract (pickWinner function)
 * is NOT cryptographically secure and is vulnerable to manipulation.
 * For a production environment, use a secure source of randomness like Chainlink VRF.
 */
contract SimpleLottery {
    address public owner;
    uint256 public ticketPrice;
    address payable[] public players; // Array to store player addresses
    uint256 public prizePool;
    bool public lotteryOpen;
    uint256 public lastWinnerAmount; // Stores the amount the last winner received
    address public lastWinner; // Stores the address of the last winner

    event LotteryEntered(address indexed player, uint256 amount);
    event WinnerPicked(address indexed winner, uint256 prizeAmount);
    event LotteryReset();

    modifier onlyOwner() {
        require(msg.sender == owner, "SimpleLottery: Caller is not the owner");
        _;
    }

    modifier whenLotteryOpen() {
        require(lotteryOpen, "SimpleLottery: Lottery is not open");
        _;
    }

    modifier whenLotteryClosed() {
        require(!lotteryOpen, "SimpleLottery: Lottery is still open");
        _;
    }

    /**
     * @dev Sets the initial ticket price and the owner of the contract.
     * @param _initialTicketPrice The price for one lottery ticket in Wei.
     */
    constructor(uint256 _initialTicketPrice) {
        require(_initialTicketPrice > 0, "SimpleLottery: Ticket price must be greater than 0");
        owner = msg.sender;
        ticketPrice = _initialTicketPrice;
        lotteryOpen = true; // Lottery starts open by default
    }

    /**
     * @dev Allows a user to enter the lottery by sending the ticket price.
     */
    function enterLottery() public payable whenLotteryOpen {
        require(msg.value == ticketPrice, "SimpleLottery: Must send exact ticket price");
        require(msg.sender.code.length == 0, "SimpleLottery: Contracts cannot enter");
        require(tx.origin == msg.sender, "SimpleLottery: Contracts cannot enter"); // Basic protection against contract interaction

        players.push(payable(msg.sender));
        prizePool += msg.value;

        emit LotteryEntered(msg.sender, msg.value);
    }

    /**
     * @dev Generates a pseudo-random index to pick a winner.
     * WARNING: This is NOT secure for production. Use Chainlink VRF.
     */
    function _generateRandomIndex() private view returns (uint256) {
        // Simple pseudo-random number generation.
        // Combining block information with players length.
        // This is predictable and can be influenced by miners.
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, players.length, prizePool))) % players.length;
    }

    /**
     * @dev Picks a winner, transfers the prize pool, and resets the lottery.
     * Only the owner can call this function.
     * The lottery must have at least one player.
     */
    function pickWinner() public onlyOwner whenLotteryOpen {
        require(players.length > 0, "SimpleLottery: No players to pick from");

        uint256 winnerIndex = _generateRandomIndex();
        address payable winner = players[winnerIndex];

        // Transfer the prize pool to the winner
        // Using call to send Ether is generally safer against reentrancy if not handled carefully,
        // but for a simple transfer like this, .transfer() is okay.
        // However, .send() and .transfer() are limited to 2300 gas and might fail
        // if the recipient is a contract with a fallback function that requires more gas.
        // Using .call{value: ...}("") is the currently recommended way.
        lastWinner = winner;
        lastWinnerAmount = prizePool;
        _resetLottery();
        (bool success, ) = winner.call{value: prizePool}("");
        require(success, "SimpleLottery: Failed to send Ether to the winner");

        

        emit WinnerPicked(winner, prizePool);

        // Reset the lottery for the next round
    }

    /**
     * @dev Resets the lottery state for a new round.
     * Can be called by the owner if they want to manually reset without picking a winner (e.g., to change ticket price).
     * Or called internally by pickWinner.
     */
    function _resetLottery() internal {
        players = new address payable[](0); // Clear the players array
        prizePool = 0;
        // lotteryOpen can be set to true here or managed by a separate function
        // For now, let's assume pickWinner closes the lottery until owner re-opens or a new one starts.
        lotteryOpen = false; // Close the lottery after a winner is picked
        emit LotteryReset();
    }

    /**
     * @dev Allows the owner to manually open the lottery.
     */
    function openLottery() public onlyOwner whenLotteryClosed {
        lotteryOpen = true;
    }

    /**
     * @dev Allows the owner to update the ticket price.
     * Can only be done when the lottery is closed to avoid issues with current entries.
     * @param _newTicketPrice The new price for one lottery ticket in Wei.
     */
    function setTicketPrice(uint256 _newTicketPrice) public onlyOwner whenLotteryClosed {
        require(_newTicketPrice > 0, "SimpleLottery: New ticket price must be greater than 0");
        ticketPrice = _newTicketPrice;
    }

    // --- View Functions ---

    /**
     * @dev Gets the list of players currently in the lottery.
     * @return An array of addresses of players.
     */
    function getPlayers() public view returns (address payable[] memory) {
        return players;
    }

    /**
     * @dev Gets the current total prize pool amount.
     * @return The prize pool amount in Wei.
     */
    function getPrizePool() public view returns (uint256) {
        return prizePool;
    }

    /**
     * @dev Gets the current status of the lottery (open or closed).
     * @return True if the lottery is open, false otherwise.
     */
    function getLotteryStatus() public view returns (bool) {
        return lotteryOpen;
    }

    /**
     * @dev Gets the contract balance. Should be equal to prizePool if all funds are internal.
     * @return The contract's balance in Wei.
     */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}