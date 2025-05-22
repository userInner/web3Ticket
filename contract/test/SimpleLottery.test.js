const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers"); // Not strictly used in this version, but good to have


// The Mock VRF Coordinator artifact will be loaded via ethers.getContractFactory("VRFCoordinatorV2Mock")
// const VRFCoordinatorV2Mock = require("../artifacts/contracts/mocks/VRFCoordinatorV2Mock.sol/VRFCoordinatorV2Mock.json"); // This line is likely not needed
// Helper function to simulate VRF fulfillment
// In a real test environment for VRFConsumerBaseV2Plus, you'd typically
// deploy a mock VRFCoordinatorV2Plus contract and have it call fulfillRandomWords.
// For simplicity here, we'll directly call the internal function after impersonating
// the coordinator address set in the VRFConsumerBaseV2Plus constructor.
// async function simulateVrfFulfillment(lottery, requestId, randomWords, vrfCoordinatorAddress) {
//     const vrfCoordinatorSigner = await ethers.getImpersonatedSigner(vrfCoordinatorAddress);

//     // Fund the impersonated account if needed (usually not for local Hardhat Network)
//     // await ethers.provider.send("hardhat_setBalance", [
//     //     vrfCoordinatorAddress,
//     //     "0x10000000000000000000000", // Sufficient balance
//     // ]);

//     // The fulfillRandomWords function in VRFConsumerBaseV2Plus has a check:
//     // if (msg.sender != s_vrfCoordinator) { revert VRF2PlusCoordinatorWrongSender(); }
//     // So, we must call it from the coordinator's address.
//     await lottery.connect(vrfCoordinatorSigner).fulfillRandomWords(requestId, randomWords);
// }

async function simulateVrfFulfillment(mockCoordinator, lotteryAddress, requestId, randomWords) {
    // Call the fulfillRandomWords function on the Mock Coordinator
    // The Mock Coordinator will then call rawFulfillRandomWords on the lottery contract
    await mockCoordinator.fulfillRandomWordsWithOverride(requestId, lotteryAddress, randomWords);
}


describe("SimpleLottery", function () {
    let SimpleLottery;
    let lottery;
    let owner;
    let player1, player2, player3, player4, player5, player6;
    let addrs;

    let mockVrfCoordinator; // Mock VRF Coordinator instance
    // Updated to match the default ticket price in DeploySimpleLottery.js
    const initialTicketPrice = 10n; // 10 Wei
    // We will create a subscription on the mock and use its ID
    let mockSubscriptionId; 
    // This is the Sepolia VRF Coordinator address used in the contract's constructor

    // Helper for `anyValue` in event emission checks
    const anyValue = () => true;


    beforeEach(async function () {
        [owner, player1, player2, player3, player4, player5, player6, ...addrs] = await ethers.getSigners();
        // 1. Deploy the Mock VRF Coordinator
        const MockVRFCoordinatorFactory = await ethers.getContractFactory("VRFCoordinatorV2Mock");
        // The VRFCoordinatorV2Mock from @chainlink/contracts takes _baseFee and _gasPriceLink
        const MOCK_BASE_FEE = ethers.parseUnits("0.25", 18); // Example base fee (0.25 LINK)
        const MOCK_GAS_PRICE_LINK = ethers.parseUnits("0.000000001", 9); // Example gas price link (1 gwei LINK)
        mockVrfCoordinator = await MockVRFCoordinatorFactory.deploy(MOCK_BASE_FEE, MOCK_GAS_PRICE_LINK);

        // 2. Create a subscription on the mock and get its ID
        // The mock's createSubscription typically makes msg.sender the owner and returns the subId or emits it.
        // For the Chainlink mock, it doesn't return the ID directly but increments an internal counter.
        // The first subscription created will have ID 1.
        await mockVrfCoordinator.connect(owner).createSubscription();
        mockSubscriptionId = 1n; // Assuming the first subscription ID is 1 for the mock

        // 3. Fund the mock subscription
        await mockVrfCoordinator.connect(owner).fundSubscription(mockSubscriptionId, ethers.parseUnits("10", 18)); // Fund with 10 LINK (mock)

        // 4. Deploy SimpleLottery, passing the Mock Coordinator's address and the created subscription ID
        SimpleLottery = await ethers.getContractFactory("SimpleLottery");
        lottery = await SimpleLottery.deploy(initialTicketPrice, mockSubscriptionId, mockVrfCoordinator.target); // Pass mock coordinator address

        // 5. Add the lottery contract as a consumer to the subscription on the mock
        await mockVrfCoordinator.connect(owner).addConsumer(mockSubscriptionId, lottery.target);
    });

    describe("Deployment", function () {
        it("Should set the right ticket price", async function () {
            // Check if the ticket price is set correctly during deployment
            expect(await lottery.ticketPrice()).to.equal(initialTicketPrice);
        });

        it("Should set the right owner", async function () {
            // VRFConsumerBaseV2Plus (which SimpleLottery inherits) sets the deployer as the owner.
            // The owner() function is inherited.
            expect(await lottery.owner()).to.equal(owner.address);
        });

        it("Should start with lottery closed", async function () {
            // Check if the lotteryOpen state variable is initially false
            expect(await lottery.lotteryOpen()).to.equal(false);
        });

        it("Should start with empty players and prize pool", async function () {
            // Check if the players array is empty and prizePool is zero
            expect(await lottery.getPlayers()).to.be.empty;
            expect(await lottery.getPrizePool()).to.equal(0);
        });

        it("Should set the VRF subscription ID", async function () {
            // Check if the VRF subscription ID is set correctly during deployment
            expect(await lottery.s_subscriptionId()).to.equal(mockSubscriptionId);
        });
    });

    describe("Prize Configuration", function () {
        it("Owner should set prize configuration", async function () {
            const percentages = [60, 30, 10];
            const counts = [1, 2, 3];
            await expect(lottery.connect(owner).setPrizeConfiguration(percentages, counts))
                .to.emit(lottery, "PrizeConfigurationSet")
                .withArgs(percentages.length, counts.reduce((a, b) => a + b, 0));
            expect(await lottery.getPrizeTierConfigurationCount()).to.equal(3);
            expect(await lottery.totalWinnersToPick()).to.equal(6);
        });

        it("Should revert if non-owner tries to set prize configuration", async function () {
            const percentages = [100];
            const counts = [1];
            // Assuming Ownable is used and properly configured.
            // The error message might be "OwnableUnauthorizedAccount" or similar.
            await expect(lottery.connect(player1).setPrizeConfiguration(percentages, counts))
                .to.be.reverted; // Or revertedWith("Ownable: caller is not the owner") if using OZ Ownable
        });

        it("Should clear previous winner data when setting new configuration", async function () {
            // 1. Set initial config, run a lottery, have winners
            await lottery.connect(owner).setPrizeConfiguration([100], [1]);
            await lottery.connect(owner).openLottery();
            await lottery.connect(player1).enterLottery({ value: initialTicketPrice });
            const txReq = await lottery.connect(owner).requestWinner();
            const receiptReq = await txReq.wait();
            const requestId = receiptReq.logs.find(log => log.fragment && log.fragment.name === "RandomWordsRequested").args.requestId;
            // The simulateVrfFulfillment function needs the mockCoordinator, lottery address, requestId, and randomWords
            // The vrfCoordinatorAddress (real Sepolia one) is not needed here as we use the mock.
            // await simulateVrfFulfillment(lottery, requestId, [0], vrfCoordinatorAddress); // Old call
            await simulateVrfFulfillment(mockVrfCoordinator, lottery.target, requestId, [0]); // Player1 wins

            expect((await lottery.getLastDrawTierWinners(0)).length).to.equal(1);
            expect(await lottery.getLastDrawTierPrizePerWinner(0)).to.be.gt(0);

            // 2. Set new config
            const newPercentages = [50, 50];
            const newCounts = [1, 1];
            await lottery.connect(owner).setPrizeConfiguration(newPercentages, newCounts);

            // 3. Check if previous winner data for tier 0 is cleared (it should be)
            // The getter will revert if the tier index is out of bounds for the *new* config.
            // If the new config has fewer tiers, this check needs care.
            // Here, the old config had 1 tier (index 0). New config has 2 tiers (index 0, 1).
            // The data for the *old* tier 0 should be gone.
            // Accessing lastDrawTierWinners[0] will now refer to the new config's tier 0, which is empty.
            expect((await lottery.getLastDrawTierWinners(0))).to.be.empty;
            expect(await lottery.getLastDrawTierPrizePerWinner(0)).to.equal(0);
        });
    });

    describe("Lottery Operations", function () {
        beforeEach(async function () {
            // Configure a simple lottery for these tests
            await lottery.connect(owner).setPrizeConfiguration([100], [1]); // 1 winner, 100% prize
        });

        it("Owner should open the lottery", async function () {
            await lottery.connect(owner).openLottery();
            expect(await lottery.lotteryOpen()).to.equal(true);
        });

        it("Should revert if non-owner tries to open lottery", async function () {
            await expect(lottery.connect(player1).openLottery()).to.be.reverted;
        });

        it("Players should enter the lottery", async function () {
            await lottery.connect(owner).openLottery();
            await lottery.connect(player1).enterLottery({ value: initialTicketPrice });
            expect(await lottery.getPlayers()).to.deep.equal([player1.address]);
            expect(await lottery.getPrizePool()).to.equal(initialTicketPrice);

            await lottery.connect(player2).enterLottery({ value: initialTicketPrice });
            expect(await lottery.getPlayers()).to.deep.equal([player1.address, player2.address]);
            expect(await lottery.getPrizePool()).to.equal(initialTicketPrice * 2n);
        });

        it("Should revert if entering with incorrect ticket price", async function () {
            await lottery.connect(owner).openLottery();
            await expect(lottery.connect(player1).enterLottery({ value: initialTicketPrice - 1n }))
                .to.be.revertedWith("SimpleLottery: Must send exact ticket price"); // For 10 Wei, this would be value: 9n
        });

        it("Should revert if contracts try to enter", async function () {
            await lottery.connect(owner).openLottery();
            // Deploy a simple attacker contract
            const Attacker = await ethers.getContractFactory("Attacker");
            const attacker = await Attacker.deploy(lottery.target); // Use .target for address in ethers v6
            await expect(attacker.attack({ value: initialTicketPrice }))
                .to.be.revertedWith("SimpleLottery: Contracts cannot enter");
        });


        it("Owner should request a winner", async function () {
            await lottery.connect(owner).openLottery();
            await lottery.connect(player1).enterLottery({ value: initialTicketPrice });
            await expect(lottery.connect(owner).requestWinner())
                .to.emit(lottery, "RandomWordsRequested");
            expect(await lottery.lotteryOpen()).to.equal(false);
        });

        it("Should fulfill random words, pick winner, distribute prize, and reset", async function () {
            await lottery.connect(owner).openLottery();
            const p1InitialBalance = await ethers.provider.getBalance(player1.address);
            const p2InitialBalance = await ethers.provider.getBalance(player2.address);

            // Player 1 enters
            const txP1Enter = await lottery.connect(player1).enterLottery({ value: initialTicketPrice });
            const receiptP1Enter = await txP1Enter.wait();
            const gasCostP1Enter = receiptP1Enter.gasUsed * receiptP1Enter.gasPrice;

            // Player 2 enters
            await lottery.connect(player2).enterLottery({ value: initialTicketPrice });

            const prizePoolBefore = await lottery.getPrizePool();
            expect(prizePoolBefore).to.equal(initialTicketPrice * 2n);

            const txReq = await lottery.connect(owner).requestWinner();
            const receiptReq = await txReq.wait();
            // Find the requestId from the event logs
            const requestedEvent = receiptReq.logs.find(log => log.fragment && log.fragment.name === "RandomWordsRequested");
            const requestId = requestedEvent.args.requestId;

            // Simulate VRF fulfillment - let's say player1 (index 0) wins
            const randomWords = [0]; // randomWords[0] % players.length = 0 % 2 = 0
            // await simulateVrfFulfillment(lottery, requestId, randomWords, vrfCoordinatorAddress); // Old call
            await simulateVrfFulfillment(mockVrfCoordinator, lottery.target, requestId, randomWords);

            // Check winner
            const tier0Winners = await lottery.getLastDrawTierWinners(0);
            expect(tier0Winners).to.deep.equal([player1.address]);
            expect(await lottery.getLastDrawTierPrizePerWinner(0)).to.equal(prizePoolBefore); // 100% to tier 0

            // Check player1's balance (should have increased by prizePool - gas for entry)
            const p1FinalBalance = await ethers.provider.getBalance(player1.address);
            // Expected: initial - entry_tx_cost - entry_fee + prize
            expect(p1FinalBalance).to.be.closeTo(p1InitialBalance - gasCostP1Enter - initialTicketPrice + prizePoolBefore, ethers.parseUnits("100", "gwei")); // Adjusted tolerance for smaller values


            // Check lottery state reset
            expect(await lottery.getPlayers()).to.be.empty;
            expect(await lottery.getPrizePool()).to.equal(0);
            expect(await lottery.lotteryOpen()).to.equal(false); // Stays closed
            expect(await lottery.s_fulfilledRequests(requestId)).to.equal(true);
        });

        it("Should handle multiple prize tiers correctly", async function () {
            // Reconfigure for multiple tiers
            const percentages = [60, 40]; // Tier 0: 60%, Tier 1: 40%
            const counts = [1, 2];       // Tier 0: 1 winner, Tier 1: 2 winners
            await lottery.connect(owner).setPrizeConfiguration(percentages, counts);
            await lottery.connect(owner).openLottery();

            // 3 Players enter
            await lottery.connect(player1).enterLottery({ value: initialTicketPrice });
            await lottery.connect(player2).enterLottery({ value: initialTicketPrice });
            await lottery.connect(player3).enterLottery({ value: initialTicketPrice });

            const totalPrizePool = initialTicketPrice * 3n;

            const txReq = await lottery.connect(owner).requestWinner();
            const receiptReq = await txReq.wait();
            const requestId = receiptReq.logs.find(log => log.fragment && log.fragment.name === "RandomWordsRequested").args.requestId;

            // Simulate VRF:
            // Players: [P1, P2, P3]
            // Random words: [0, 1] (needs 3 words if enough players, but only 3 players, so 3 words requested)
            // Let's say random words are [0, 1, 0]
            // 1. rw[0] % 3 = 0 -> P1 wins Tier 0. Eligible: [P2, P3]
            // 2. rw[1] % 2 = 1 -> P3 wins Tier 1. Eligible: [P2]
            // 3. rw[2] % 1 = 0 -> P2 wins Tier 1. Eligible: []
            const randomWords = [0, 1, 0];
            // await simulateVrfFulfillment(lottery, requestId, randomWords, vrfCoordinatorAddress); // Old call
            await simulateVrfFulfillment(mockVrfCoordinator, lottery.target, requestId, randomWords);

            // Tier 0 (1 winner, 60%)
            const tier0Winners = await lottery.getLastDrawTierWinners(0);
            expect(tier0Winners).to.deep.equal([player1.address]);
            const tier0Prize = (totalPrizePool * 60n) / 100n;
            expect(await lottery.getLastDrawTierPrizePerWinner(0)).to.equal(tier0Prize);

            // Tier 1 (2 winners, 40%)
            const tier1Winners = Array.from(await lottery.getLastDrawTierWinners(1)); // Convert Result to standard Array
            expect(tier1Winners).to.have.members([player2.address, player3.address]);
            const tier1PrizePerWinner = ((totalPrizePool * 40n) / 100n) / 2n;
            expect(await lottery.getLastDrawTierPrizePerWinner(1)).to.equal(tier1PrizePerWinner);

            // Check contract balance (should be 0 or very small due to potential rounding)
            expect(await lottery.getContractBalance()).to.be.lte(2n); // Allow for potential rounding up to 2 wei with small numbers
        });

        it("Should handle fewer players than total winners to pick", async function () {
            const percentages = [50, 30, 20]; // Tier 0: 1, Tier 1: 2, Tier 2: 3 (Total 6 winners)
            const counts = [1, 2, 3];
            await lottery.connect(owner).setPrizeConfiguration(percentages, counts);
            await lottery.connect(owner).openLottery();

            // Only 2 players enter
            await lottery.connect(player1).enterLottery({ value: initialTicketPrice });
            await lottery.connect(player2).enterLottery({ value: initialTicketPrice });

            const totalPrizePool = initialTicketPrice * 2n;

            const txReq = await lottery.connect(owner).requestWinner();
            const receiptReq = await txReq.wait();
            const requestId = receiptReq.logs.find(log => log.fragment && log.fragment.name === "RandomWordsRequested").args.requestId;
            // numWords requested should be 2 (min(6, 2))

            // Simulate VRF:
            // Players: [P1, P2]
            // Random words: [0, 0]
            // 1. rw[0] % 2 = 0 -> P1 wins Tier 0. Eligible: [P2]
            // 2. rw[1] % 1 = 0 -> P2 wins Tier 1 (as Tier 1 needs 2, but only 1 eligible & 1 random word left for it)
            const randomWords = [0, 0];
            // await simulateVrfFulfillment(lottery, requestId, randomWords, vrfCoordinatorAddress); // Old call
            await simulateVrfFulfillment(mockVrfCoordinator, lottery.target, requestId, randomWords);

            // Tier 0 (1 winner, 50%)
            const tier0Winners = await lottery.getLastDrawTierWinners(0);
            expect(tier0Winners).to.deep.equal([player1.address]);
            const tier0Prize = (totalPrizePool * 50n) / 100n;
            expect(await lottery.getLastDrawTierPrizePerWinner(0)).to.equal(tier0Prize);

            // Tier 1 (should have 1 winner - P2, 30% of pool for this tier, P2 gets all of it)
            const tier1Winners = await lottery.getLastDrawTierWinners(1);
            expect(tier1Winners).to.deep.equal([player2.address]);
            const tier1PrizeShare = (totalPrizePool * 30n) / 100n;
            expect(await lottery.getLastDrawTierPrizePerWinner(1)).to.equal(tier1PrizeShare); // P2 gets the whole 30% share for this tier

            // Tier 2 (should have 0 winners)
            const tier2Winners = await lottery.getLastDrawTierWinners(2);
            expect(tier2Winners).to.be.empty;
            expect(await lottery.getLastDrawTierPrizePerWinner(2)).to.equal(0);

            // Remaining 20% for Tier 2 should still be in the contract
            const expectedRemaining = (totalPrizePool * 20n) / 100n;
            expect(await lottery.getContractBalance()).to.equal(expectedRemaining);
        });
    });

    describe("Owner Functions", function () {
        it("Owner should set ticket price when lottery is closed and empty", async function () {
            const newPrice = 50n; // Example new price: 50 Wei
            await lottery.connect(owner).setTicketPrice(newPrice);
            expect(await lottery.ticketPrice()).to.equal(newPrice);
        });

        it("Should revert setTicketPrice if players have entered", async function () {
            await lottery.connect(owner).setPrizeConfiguration([100], [1]);
            await lottery.connect(owner).openLottery();
            await lottery.connect(player1).enterLottery({ value: initialTicketPrice });
            // Lottery is open and has players. The `whenLotteryClosed` modifier will revert first.
            await expect(lottery.connect(owner).setTicketPrice(50n))
                .to.be.revertedWith("SimpleLottery: Lottery is currently open");
        });

        it("Owner should withdraw ETH not distributed", async function () {
            // Setup a scenario where ETH remains
            await lottery.connect(owner).setPrizeConfiguration([50], [1]); // Only 50% distributed
            await lottery.connect(owner).openLottery();
            await lottery.connect(player1).enterLottery({ value: initialTicketPrice });
            await lottery.connect(player2).enterLottery({ value: initialTicketPrice }); // Prize pool = 0.2 ETH

            const txReq = await lottery.connect(owner).requestWinner();
            const receiptReq = await txReq.wait();
            const requestId = receiptReq.logs.find(log => log.fragment && log.fragment.name === "RandomWordsRequested").args.requestId;
            // await simulateVrfFulfillment(lottery, requestId, [0], vrfCoordinatorAddress); // Old call
            await simulateVrfFulfillment(mockVrfCoordinator, lottery.target, requestId, [0]); // P1 wins

            // Prize pool was 2 * 10 Wei = 20 Wei. 50% distributed. 50% remaining.
            const prizePoolTotal = initialTicketPrice * 2n;
            const remainingInContract = prizePoolTotal / 2n;
            expect(await lottery.getContractBalance()).to.equal(remainingInContract);

            const ownerInitialEth = await ethers.provider.getBalance(owner.address);
            const withdrawTx = await lottery.connect(owner).withdrawEther(remainingInContract);
            const withdrawReceipt = await withdrawTx.wait();
            const withdrawGasCost = withdrawReceipt.gasUsed * withdrawReceipt.gasPrice;

            expect(await lottery.getContractBalance()).to.equal(0);
            expect(await ethers.provider.getBalance(owner.address))
                .to.equal(ownerInitialEth + remainingInContract - withdrawGasCost);
        });

        it("Should revert withdrawEther if lottery is open with players", async function () {
            await lottery.connect(owner).setPrizeConfiguration([100], [1]);
            await lottery.connect(owner).openLottery();
            await lottery.connect(player1).enterLottery({ value: initialTicketPrice });
            // Manually send some extra ETH to the contract for withdrawal attempt
            await owner.sendTransaction({ to: lottery.target, value: 100n }); // Send 100 Wei

            await expect(lottery.connect(owner).withdrawEther(100n))
                .to.be.revertedWith("SimpleLottery: Cannot withdraw while lottery is open with players or prize pool");
        });
    });

    describe("View Functions", function () {
        it("Should return correct values for view functions", async function () {
            expect(await lottery.getLotteryStatus()).to.be.false;
            await lottery.connect(owner).setPrizeConfiguration([60,40], [1,1]);
            const tier0Conf = await lottery.getPrizeTierConfig(0);
            expect(tier0Conf.percentage).to.equal(60);
            expect(tier0Conf.count).to.equal(1);

            await lottery.connect(owner).openLottery();
            expect(await lottery.getLotteryStatus()).to.be.true;
            await lottery.connect(player1).enterLottery({value: initialTicketPrice});
            expect(await lottery.getPlayers()).to.deep.equal([player1.address]);
            expect(await lottery.getPrizePool()).to.equal(initialTicketPrice);
        });
    });
});
