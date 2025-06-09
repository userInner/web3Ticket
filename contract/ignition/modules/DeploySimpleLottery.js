// d:\project\Front\github\web3Ticket\contract\ignition\modules\DeploySimpleLottery.js
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("hardhat"); // Optional: for parsing Ether or getting signers

// Default values for parameters, can be overridden during deployment
const DEFAULT_TICKET_PRICE = 10n; // Default ticket price: 10 Wei
// This default subscription ID is not directly used for SimpleLottery's constructor in this module,
// as a new subscription will be created on the deployed mock.
// const DEFAULT_VRF_SUBSCRIPTION_ID = 103347391691282388823727249687879454776874257868798696992098437432248880977930n;
const DEFAULT_MOCK_LINK_FUND_AMOUNT = ethers.parseUnits("10", 18); // Fund mock subscription with 10 LINK
const MOCK_BASE_FEE = ethers.parseUnits("0.25", 18); // 0.25 LINK, example value
const MOCK_GAS_PRICE_LINK = ethers.parseUnits("0.000000001", 9); // 1 gwei LINK, example value (1e9)

// npx hardhat ignition deploy ./ignition/modules/DeploySimpleLottery.js --network sepolia --parameters '{ "initialTicketPrice": "10", "vrfSubscriptionId": 103347391691282388823727249687879454776874257868798696992098437432248880977930 }'

// Renaming module to reflect its new purpose of deploying with a mock coordinator
module.exports = buildModule("DeployLotteryWithMockCoordinator_V2", (m) => { // Changed module name
  // Define parameters for the deployment.
  // These can be provided at deployment time.
  // m.getAccount(0) will use the first account from Hardhat's configured accounts as the default owner.
  // const initialOwner = m.getParameter("initialOwner", m.getAccount(0)); // Not used by SimpleLottery constructor

  const initialTicketPrice = m.getParameter(
    "initialTicketPrice",
    DEFAULT_TICKET_PRICE
  );
  // The vrfSubscriptionId parameter from getParameter is not used here,
  // as we create a new subscription on the mock.

  // 1. Deploy the VRFCoordinatorV2Mock contract
  const mockCoordinator = m.contract("VRFCoordinatorV2Mock", [
    MOCK_BASE_FEE,
    MOCK_GAS_PRICE_LINK,
  ]);

  // 2. Create a subscription on the mock coordinator.
  //    The mock's createSubscription will internally assign an ID (the first one will be 1).
  //    The owner of this subscription will be the deployer of this module (m.getAccount(0)).
  const MOCK_CREATED_SUBSCRIPTION_ID = 1n; // Assumption: first subscription ID from mock is 1
  m.call(mockCoordinator, "createSubscription", []);

  // 3. Fund the created subscription on the mock coordinator
  m.call(
    mockCoordinator,
    "fundSubscription",
    [MOCK_CREATED_SUBSCRIPTION_ID, DEFAULT_MOCK_LINK_FUND_AMOUNT] // Pass subId and amount
  );

  // Deploy the SimpleLottery contract.
  // The arguments array must match the order and type of the contract's constructor parameters.
  // SimpleLottery constructor: (uint256 _initialTicketPrice, uint256 _vrfSubscriptionId, address _vrfCoordinatorAddress)
  const simpleLottery = m.contract("SimpleLottery", [
    initialTicketPrice,
    MOCK_CREATED_SUBSCRIPTION_ID, // Use the subscription ID created on the mock
    mockCoordinator, // Pass the future for the mockCoordinator; Ignition resolves its address
  ]);

  // 5. Add the deployed SimpleLottery contract as a consumer to the subscription on the mock.
  m.call(mockCoordinator, "addConsumer", [
    MOCK_CREATED_SUBSCRIPTION_ID,
    simpleLottery, // Pass the future for simpleLottery; Ignition resolves its address
  ]);

  // Return the deployed contract instances for potential use by other modules or test scripts
  return { simpleLottery, mockCoordinator };
});