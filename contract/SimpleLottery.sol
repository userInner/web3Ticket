// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimpleLottery with Chainlink VRF
 * @dev A basic decentralized lottery contract that uses Chainlink VRF V2+
 * for secure random number generation to pick a winner.
 * For this contract to work, it needs to be funded with LINK tokens,
 * and the contract address must be added as a consumer to an active VRF V2+ subscription.
 */

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts@1.3.0/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts@1.3.0/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract SimpleLottery is VRFConsumerBaseV2Plus {
    uint256 public ticketPrice;
    address payable[] public players; // Array to store player addresses
    uint256 public prizePool;
    bool public lotteryOpen;
    uint256 public lastWinnerAmount; // Stores the amount the last winner received
    bool public isPickingWinner;     // Indicates if there was a last winner
    address public lastWinner;       // Stores the address of the last winner

    // VRF Configuration
    uint256 public s_subscriptionId;
    bytes32 public s_keyHash = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae; // AKA Gas Lane
    // These can be made configurable by owner if needed
    uint32 public s_callbackGasLimit = 200000; // Adjust based on fulfillRandomWords complexity
    uint16 public s_requestConfirmations = 3;  // Min 3 for mainnets, 1 for testnets often ok
    uint32 public s_numWords = 1;              // Requesting one random word

    // VRF State
    mapping(uint256 => bool) public s_fulfilledRequests; // requestId => fulfilled
    
    uint256 public s_lastRequestId; // Stores the ID of the last VRF request

    event LotteryEntered(address indexed player, uint256 amount);
    event WinnerPicked(address indexed winner, uint256 prizeAmount);
    event LotteryReset();
    event RandomWordsRequested(uint256 indexed requestId, address indexed requester);
    event RandomWordsFulfilled(uint256 indexed requestId, uint256[] randomWords);

    modifier whenLotteryOpen() {
        require(!isPickingWinner, "SimpleLottery: Currently picking a winner, please wait");
        require(lotteryOpen, "SimpleLottery: Lottery is not open");
        _;
    }

    modifier whenLotteryClosed() {
        require(!isPickingWinner, "SimpleLottery: Currently picking a winner, please wait");
        require(!lotteryOpen, "SimpleLottery: Lottery is currently open");
        _;
    }

    /**
     * @dev Sets the initial ticket price and the owner of the contract.
     * @param _initialTicketPrice The price for one lottery ticket in Wei.
     * @param _subscriptionId The VRF subscription ID.
     */
    constructor(
        uint256 _initialTicketPrice,
        uint256 _subscriptionId
    ) VRFConsumerBaseV2Plus(0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B) { // Pass coordinator to base contract
        require(_initialTicketPrice > 0, "SimpleLottery: Ticket price must be greater than 0");
        ticketPrice = _initialTicketPrice;
        lotteryOpen = true; // Lottery starts open by default
        isPickingWinner = false; // No winner picked at the start
        prizePool = 0;
        s_subscriptionId = _subscriptionId;
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
     * @dev Owner requests a random winner from Chainlink VRF.
     * The lottery must have at least one player.
     * This will close the lottery for new entries.
     */
    function requestWinner() public onlyOwner whenLotteryOpen {
        require(players.length > 0, "SimpleLottery: No players to pick from");
        require(s_subscriptionId != 0, "SimpleLottery: Subscription ID not set");
        // Note: Ensuring Chainlink subscription is funded with LINK is an off-chain responsibility.

        lotteryOpen = false; // Close lottery to new entries while waiting for randomness

        // Request randomness from Chainlink VRF
        s_lastRequestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: s_keyHash,
                subId: s_subscriptionId,
                requestConfirmations: s_requestConfirmations,
                callbackGasLimit: s_callbackGasLimit,
                numWords: s_numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({
                        nativePayment: false // use link pay for VRF
                    })
                )
            })
        );
        isPickingWinner = true; // Set to true to indicate a winner is being picked
        emit RandomWordsRequested(s_lastRequestId, msg.sender);
    }

    /**
     * @dev Callback function for Chainlink VRF to fulfill the random words request.
     * This function should only be callable by the VRFCoordinator (via VRFConsumerBaseV2Plus).
     * It picks the winner, transfers the prize, and resets the lottery.
     */
    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] calldata _randomWords
    ) internal override {
        require(s_fulfilledRequests[_requestId] == false, "SimpleLottery: Request already fulfilled or invalid");
        s_fulfilledRequests[_requestId] = true;

        emit RandomWordsFulfilled(_requestId, _randomWords);

        // Ensure players array is not empty. This should be guaranteed by requestWinner's check
        // and lotteryOpen=false preventing modifications.
        // If players.length is 0 here, the modulo operation below would revert, which is a safe failure.
        require(players.length > 0, "SimpleLottery: No players to pick from during fulfillment (unexpected state)");

        uint256 winnerIndex = _randomWords[0] % players.length;
        address payable winner = players[winnerIndex];

        uint256 prizeAmountToAward = prizePool; // Capture current prize pool amount

        lastWinner = winner;
        lastWinnerAmount = prizeAmountToAward;
        isPickingWinner = false; // Set to false to indicate a winner has been picked
        _resetLottery(); // Resets players, prizePool, and ensures lotteryOpen is false

        if (prizeAmountToAward > 0) {
            (bool success, ) = winner.call{value: prizeAmountToAward}("");
            // If transfer fails, the entire fulfillRandomWords transaction reverts.
            // This means s_fulfilledRequests[_requestId] remains false, prizePool and players are not reset.
            // Lottery remains closed (lotteryOpen = false from requestWinner).
            // Owner needs to investigate the cause (e.g., winner contract cannot receive Ether).
            require(success, "SimpleLottery: Failed to send Ether to the winner");
        }
        // If prizeAmountToAward is 0 (e.g., no entries but somehow players.length > 0, or an error),
        // a winner is still picked but receives 0. This is logged by WinnerPicked event.

        emit WinnerPicked(winner, prizeAmountToAward);
    }

    /**
     * @dev Resets the lottery state for a new round.
     * Can be called by the owner if they want to manually reset without picking a winner (e.g., to change ticket price).
     * Or called internally by pickWinner.
     */
    function _resetLottery() internal {
        players = new address payable[](0); // Clear the players array
        prizePool = 0;
        lotteryOpen = false; // Ensures lottery remains closed until explicitly opened by owner
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