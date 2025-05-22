// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimpleLottery with Chainlink VRF
 * @dev A basic decentralized lottery contract that uses Chainlink VRF V2+
 * for secure random number generation to pick a winner.
 * For this contract to work, it needs to be funded with LINK tokens,
 * and the contract address must be added as a consumer to an active VRF V2+ subscription.
 */

// Update the import paths below to match your node_modules or local contracts directory structure.
// For example, if installed via npm, use:
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol"; // Use this interface

contract SimpleLottery is VRFConsumerBaseV2Plus {

    uint256 public ticketPrice;
    address payable[] public players; // Array to store player addresses
    uint256 public prizePool;
    bool public lotteryOpen;

    // Prize Tier Structure
    struct PrizeTierConf {
        uint8 percentage; // Percentage of total prize pool (0-100)
        uint8 count;      // Number of winners for this tier
    }
    PrizeTierConf[] public prizeTierConfigurations;
    uint256 public totalWinnersToPick; // Sum of counts from all prizeTiers

    // Storage for winners of the last completed draw
    // tier index => list of winners
    mapping(uint256 => address payable[]) public lastDrawTierWinners;
    // tier index => prize amount per winner for that tier in the last draw
    mapping(uint256 => uint256) public lastDrawTierPrizePerWinner;

    // VRF Configuration
    uint256 public s_subscriptionId;
    bytes32 public s_keyHash = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae; // AKA Gas Lane
    uint32 public s_callbackGasLimit = 500000; // Increased for multiple winners
    uint16 public s_requestConfirmations = 3;  // Min 3 for mainnets, 1 for testnets often ok
    // s_numWords will be set by totalWinnersToPick when requesting

    // VRF State
    mapping(uint256 => bool) public s_fulfilledRequests; // requestId => fulfilled
    uint256 public s_lastRequestId; // Stores the ID of the last VRF request

    event LotteryEntered(address indexed player, uint256 amount);
    // Modified/New events
    event TierWinnerPicked(uint256 indexed requestId, uint256 indexed tierIndex, address indexed winner, uint256 prizeAmount);
    event AllWinnersDistributed(uint256 indexed requestId);
    event LotteryReset(uint256 indexed requestId); // Include requestId if reset is part of fulfillment
    event RandomWordsRequested(uint256 indexed requestId, address indexed requester, uint32 numWords);
    event RandomWordsFulfilled(uint256 indexed requestId, uint256[] randomWords);
    event PrizeConfigurationSet(uint256 totalTiers, uint256 totalWinners);

    modifier whenLotteryOpen() {
        require(s_lastRequestId == 0 || s_fulfilledRequests[s_lastRequestId], "SimpleLottery: Currently picking a winner or awaiting fulfillment, please wait");
        require(lotteryOpen, "SimpleLottery: Lottery is not open");
        _;
    }

    modifier whenLotteryClosed() {
        require(s_lastRequestId == 0 || s_fulfilledRequests[s_lastRequestId], "SimpleLottery: Currently picking a winner or awaiting fulfillment, please wait");
        require(!lotteryOpen, "SimpleLottery: Lottery is currently open");
        _;
    }

    /**
     * @dev Sets the initial ticket price and the owner of the contract.
     * @param _initialTicketPrice The price for one lottery ticket in Wei.
     * @param _vrfSubscriptionId The VRF subscription ID.
     */
    constructor(
        uint256 _initialTicketPrice,
        uint256 _vrfSubscriptionId,
        address _vrfCoordinatorAddress // Add this parameter
    ) VRFConsumerBaseV2Plus(_vrfCoordinatorAddress) { // Pass coordinator to base contract
        require(_initialTicketPrice > 0, "SimpleLottery: Ticket price must be greater than 0");
        ticketPrice = _initialTicketPrice;
        lotteryOpen = false; // Start closed, owner must configure prizes and open
        prizePool = 0;
        s_subscriptionId = _vrfSubscriptionId;
        // Owner needs to call setPrizeConfiguration and then openLottery
    }

    /**
     * @dev Sets the prize tier configuration.
     * Can only be called by the owner when the lottery is closed and no players have entered.
     * @param _percentages Array of percentages for each tier.
     * @param _counts Array of winner counts for each tier.
     */
    function setPrizeConfiguration(uint8[] calldata _percentages, uint8[] calldata _counts) public onlyOwner {
        require(!lotteryOpen, "SimpleLottery: Lottery must be closed");
        require(players.length == 0, "SimpleLottery: Lottery must be empty of players");
        require(_percentages.length == _counts.length, "SimpleLottery: Percentages and counts array length mismatch");
        require(_percentages.length > 0, "SimpleLottery: Must have at least one prize tier");

        _clearLastDrawWinnerData(); // Clear winner data from the *previous* configuration before setting a new one

        delete prizeTierConfigurations; // Clear previous configuration
        totalWinnersToPick = 0;
        uint256 totalPercentage = 0;

        for (uint256 i = 0; i < _percentages.length; i++) {
            require(_percentages[i] > 0 && _percentages[i] <= 100, "SimpleLottery: Percentage must be between 1 and 100");
            require(_counts[i] > 0, "SimpleLottery: Winner count for a tier must be > 0");
            prizeTierConfigurations.push(PrizeTierConf({
                percentage: _percentages[i],
                count: _counts[i]
            }));
            totalWinnersToPick += _counts[i];
            totalPercentage += _percentages[i];
        }
        require(totalPercentage <= 100, "SimpleLottery: Total percentage exceeds 100%");
        require(totalWinnersToPick > 0, "SimpleLottery: Total winners to pick must be > 0");

        emit PrizeConfigurationSet(_percentages.length, totalWinnersToPick);
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
        require(prizeTierConfigurations.length > 0, "SimpleLottery: Prize configuration not set");
        require(totalWinnersToPick > 0, "SimpleLottery: Total winners to pick is zero, check prize configuration");

        lotteryOpen = false; // Close lottery to new entries while waiting for randomness

        uint32 numWordsToRequest = uint32(totalWinnersToPick);
        // If players.length < totalWinnersToPick, we only need players.length random numbers
        // as we can only pick players.length unique winners.
        if (players.length < totalWinnersToPick) {
            numWordsToRequest = uint32(players.length);
        }
        // This also implies numWordsToRequest will be > 0 because players.length > 0 is checked.

        // Request randomness from Chainlink VRF
        // Original call for real Chainlink VRF V2+ Coordinator (using VRFV2PlusClient.RandomWordsRequest struct)
        // s_lastRequestId = s_vrfCoordinator.requestRandomWords(
        //     VRFV2PlusClient.RandomWordsRequest({
        //         keyHash: s_keyHash,
        //         subId: s_subscriptionId,
        //         requestConfirmations: s_requestConfirmations,
        //         callbackGasLimit: s_callbackGasLimit,
        //         numWords: numWordsToRequest,
        //         extraArgs: VRFV2PlusClient._argsToBytes(
        //             VRFV2PlusClient.ExtraArgsV1({
        //                 nativePayment: false // use link pay for VRF
        //             })
        //         )
        //     })
        // );

        // New call for VRFCoordinatorV2Mock (matching its direct function signature)
        // To call the 5-argument version, explicitly cast s_vrfCoordinator to VRFCoordinatorV2Interface
        s_lastRequestId = VRFCoordinatorV2Interface(address(s_vrfCoordinator)).requestRandomWords(
            s_keyHash,
            uint64(s_subscriptionId), // Cast s_subscriptionId (uint256) to uint64
            s_requestConfirmations,   // s_requestConfirmations is already uint16
            s_callbackGasLimit,       // s_callbackGasLimit is already uint32
            numWordsToRequest         // numWordsToRequest is already uint32 (uint32 in mock)
        );
        emit RandomWordsRequested(s_lastRequestId, msg.sender, numWordsToRequest);
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
        s_fulfilledRequests[_requestId] = true;
        emit RandomWordsFulfilled(_requestId, _randomWords);

        require(players.length > 0, "SimpleLottery: No players to pick from during fulfillment (unexpected state)");
        require(_randomWords.length > 0, "SimpleLottery: No random words received");

        // Create a modifiable list of players for this draw
        address payable[] memory currentEligiblePlayers = new address payable[](players.length);
        for(uint i = 0; i < players.length; i++) {
            currentEligiblePlayers[i] = players[i];
        }
        uint256 numEligible = currentEligiblePlayers.length; // Effective length of currentEligiblePlayers

        uint256 randomWordIdx = 0; // Index for _randomWords array

        for (uint256 i = 0; i < prizeTierConfigurations.length; i++) { // Iterate through each prize tier
            if (randomWordIdx >= _randomWords.length || numEligible == 0) {
                break; // No more random words or no more eligible players
            }

            PrizeTierConf storage tierConf = prizeTierConfigurations[i];
            uint256 winnersToPickForThisTier = tierConf.count;
            uint256 tierPrizePoolShare = (prizePool * tierConf.percentage) / 100;
            
            // Temporary storage for winners of this specific tier before final assignment
            address payable[] memory tierWinnersThisDraw = new address payable[](winnersToPickForThisTier);
            uint actualWinnersInTierCount = 0;

            for (uint256 j = 0; j < winnersToPickForThisTier; j++) {
                if (numEligible == 0 || randomWordIdx >= _randomWords.length) {
                    break; // No more eligible players or random words
                }

                uint256 selectedPlayerIndexInEligible = _randomWords[randomWordIdx] % numEligible;
                address payable winner = currentEligiblePlayers[selectedPlayerIndexInEligible];
                
                tierWinnersThisDraw[actualWinnersInTierCount] = winner;
                actualWinnersInTierCount++;

                // and then decrementing the effective size (numEligible).
                currentEligiblePlayers[selectedPlayerIndexInEligible] = currentEligiblePlayers[numEligible - 1];
                numEligible--; // Effectively shrinks the array from the end

                randomWordIdx++;
            }

            if (actualWinnersInTierCount > 0 && tierPrizePoolShare > 0) {
                uint256 prizePerWinnerInTier = tierPrizePoolShare / actualWinnersInTierCount;
                lastDrawTierPrizePerWinner[i] = prizePerWinnerInTier;

                for(uint k=0; k < actualWinnersInTierCount; k++){
                    address payable winnerToPay = tierWinnersThisDraw[k];
                    lastDrawTierWinners[i].push(winnerToPay); // Store winner in persistent storage
                    _distributePrizeAndEmitEvent(_requestId, i, winnerToPay, prizePerWinnerInTier);
                }
            }
        }

        emit AllWinnersDistributed(_requestId);
        _resetLotteryInternal(_requestId);
    }

    /**
     * @dev Internal helper to distribute prize and emit event for a single winner.
     * Extracted to reduce stack depth in fulfillRandomWords.
     */
    function _distributePrizeAndEmitEvent(
        uint256 _requestId,
        uint256 _tierIndex,
        address payable _winner,
        uint256 _prizeAmount
    ) internal {
        if (_prizeAmount > 0) { // Only transfer if prize is greater than 0
            (bool success, ) = _winner.call{value: _prizeAmount}("");
            require(success, "SimpleLottery: Failed to send Ether to a winner");
        }
        emit TierWinnerPicked(_requestId, _tierIndex, _winner, _prizeAmount);
    }

    function _clearLastDrawWinnerData() internal {
        for (uint256 i = 0; i < prizeTierConfigurations.length; i++) {
            delete lastDrawTierWinners[i];
            delete lastDrawTierPrizePerWinner[i];
        }
    }

    /**
     * @dev Resets the lottery state for a new round.
     * Called internally after winners are picked and prizes distributed.
     */
    function _resetLotteryInternal(uint256 _requestId) internal {
        players = new address payable[](0); // Clear the players array
        prizePool = 0;
        // prizeTierConfigurations and totalWinnersToPick are NOT reset here.
        // They represent the configuration of the draw that just finished.
        lotteryOpen = false; // Explicitly ensure lottery is closed for the next round
        emit LotteryReset(_requestId);
    }

    /**
     * @dev Allows the owner to manually open the lottery.
     */
    function openLottery() public onlyOwner whenLotteryClosed {
        require(prizeTierConfigurations.length > 0, "SimpleLottery: Prize configuration not set. Cannot open lottery.");
        lotteryOpen = true;
    }


    /**
     * @dev Allows the owner to update the ticket price.
     * Can only be done when the lottery is closed to avoid issues with current entries.
     * @param _newTicketPrice The new price for one lottery ticket in Wei.
     */
    function setTicketPrice(uint256 _newTicketPrice) public onlyOwner whenLotteryClosed {
        require(players.length == 0, "SimpleLottery: Cannot change price with active players/prize pool.");
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

    function getPrizeTierConfigurationCount() public view returns (uint256) {
        return prizeTierConfigurations.length;
    }

    function getPrizeTierConfig(uint256 _tierIndex) public view returns (PrizeTierConf memory) {
        require(_tierIndex < prizeTierConfigurations.length, "SimpleLottery: Invalid tier index");
        return prizeTierConfigurations[_tierIndex];
    }

    function getLastDrawTierWinners(uint256 _tierIndex) public view returns (address payable[] memory) {
        require(_tierIndex < prizeTierConfigurations.length, "SimpleLottery: Invalid tier index for last draw winners");
        // This will return an empty array if the tier index is valid but no winners were stored (e.g., not enough players for that tier)
        return lastDrawTierWinners[_tierIndex];
    }

    function getLastDrawTierPrizePerWinner(uint256 _tierIndex) public view returns (uint256) {
        require(_tierIndex < prizeTierConfigurations.length, "SimpleLottery: Invalid tier index for last draw prize");
        return lastDrawTierPrizePerWinner[_tierIndex];
    }

    function isWinnerPickingInProgress() public view returns (bool) {
        return s_lastRequestId != 0 && !s_fulfilledRequests[s_lastRequestId];
    }

    // Function for owner to withdraw any ETH funds not distributed (e.g. from rounding or if total percentage < 100)
    function withdrawEther(uint256 _amount) external onlyOwner {
        require(address(this).balance >= _amount, "SimpleLottery: Insufficient contract balance");
        // Ensure lottery is not active or awaiting fulfillment to prevent interference with prize pool
        require(s_lastRequestId == 0 || s_fulfilledRequests[s_lastRequestId], "SimpleLottery: Cannot withdraw during active winner picking process");
        require(!lotteryOpen || players.length == 0, "SimpleLottery: Cannot withdraw while lottery is open with players or prize pool");
        payable(owner()).transfer(_amount);
    }

    // Fallback to receive Ether (e.g., if someone sends directly, though enterLottery is primary)
    receive() external payable {}
}