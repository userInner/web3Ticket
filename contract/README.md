# web3Ticket - 去中心化彩票平台智能合约

本项目是 "web3Ticket" 去中心化彩票平台的以太坊智能合约部分。它使用 Solidity 编写，并利用 Hardhat 进行开发、测试和部署。该合约旨在提供一个透明、公平且可配置的彩票系统。

## 主要特性

*   **去中心化彩票逻辑**: 完整的彩票生命周期管理，包括玩家入场、奖池累积、中奖者选择和奖金分配。
*   **安全随机性**: 集成 Chainlink VRF V2+ (可验证随机函数) 以保证中奖者选择的公平性和防篡改性。
*   **可配置多层级奖项**: 管理员可以灵活配置多个奖项等级，每个等级可设定不同的奖金百分比和中奖人数。
*   **所有权与权限控制**: 使用 OpenZeppelin Ownable 实现关键管理功能（如设置票价、配置奖项、开启/关闭彩票、提取资金等）的权限控制。
*   **防止合约参与**: 限制外部拥有账户 (EOA) 参与，防止恶意合约利用。
*   **透明的资金管理**: 奖池资金安全存储于合约中，并自动分配给中奖者。合约所有者可在特定条件下提取未分配的以太币。
*   **事件驱动**: 广泛使用 Solidity 事件记录关键操作，增强透明度和可审计性。

## 技术栈

*   **Solidity**: 智能合约编程语言。
*   **Hardhat**: 以太坊开发环境，用于编译、部署、测试和调试。
*   **Ethers.js**: 与以太坊区块链交互的 JavaScript 库。
*   **Chai**: BDD / TDD断言库，用于测试。
*   **Chainlink VRF V2+**: 用于获取可验证的随机数。
*   **OpenZeppelin Contracts**: 用于安全和标准化的合约组件 (如 Ownable)。

## 项目结构

```
contracts/
├── SimpleLottery.sol       # 主要的彩票逻辑合约
├── Attack.sol              # 用于测试合约能否参与彩票的辅助合约
└── mocks/
    └── VRFCoordinatorV2Mock.sol # Chainlink VRF 协调器的模拟合约，用于测试
ignition/
└── modules/
    └── DeploySimpleLottery.js # Hardhat Ignition 部署脚本
test/
└── SimpleLottery.test.js   # 针对 SimpleLottery.sol 的测试脚本
hardhat.config.js         # Hardhat 配置文件
package.json                # 项目依赖和脚本
README.md                   # 本文件
```

## 安装与设置
1.  **安装依赖**:
    ```bash
    npm install
    # 或者
    # yarn install
    ```
2. **新建配置文件**:
    1. contract下新建hardhat.config.js文件
    2. 内容：
    ```js
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    "sepolia": {
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      chainId: 11155111,
      accounts: [
        "","","","","","","",""
      ],
    },
  },
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true,
    }
  }
};
    ```
## 主要 Hardhat 命令

*   **清理缓存和构建文件**:
    ```bash
    npx hardhat clean
    ```
*   **编译合约**:
    ```bash
    npx hardhat compile
    ```
*   **运行测试**:
    ```bash
    npx hardhat test
    ```
*   **获取测试覆盖率报告**:
    ```bash
    npx hardhat coverage
    ```
*   **部署合约 (使用 Hardhat Ignition)**:
    以部署到 Sepolia 测试网为例：
    ```bash
    npx hardhat ignition deploy ./ignition/modules/DeploySimpleLottery.js --network sepolia
    ```
    确保在 `hardhat.config.js` 中配置了 `sepolia` 网络。

## 测试覆盖范围摘要

`SimpleLottery.test.js` 文件对 `SimpleLottery.sol` 智能合约进行了全面的单元测试和集成测试。

### 一、单元测试 (Unit Tests)
这些测试主要关注合约中单个函数或一小部分相关函数的行为，通常会隔离被测单元，并可能模拟其依赖。

*   **部署 (Deployment)**:
    *   验证合约部署后，初始票价 (`ticketPrice`)、拥有者 (`owner`)、彩票初始状态 (`lotteryOpen`)、初始玩家列表和奖池、VRF 订阅 ID (`s_subscriptionId`) 是否正确设置。
*   **奖项配置 (Prize Configuration)**:
    *   **所有者行为**: 验证合约所有者能否成功设置奖项配置 (`setPrizeConfiguration`)，检查事件和状态更新。
    *   **非所有者行为**: 验证非所有者尝试设置奖项配置时是否回滚。
    *   **状态清理**: 验证设置新奖项配置时是否清除上一轮中奖者数据。
*   **彩票操作 - 基础功能 (Lottery Operations - Basic Functions)**:
    *   **开启/关闭彩票**: 验证所有者能否正确操作，非所有者操作是否回滚。
    *   **玩家入场**: 验证玩家能否以正确的票价成功参与，玩家列表和奖池是否正确更新。
    *   **错误票价入场**: 验证玩家以不正确的票价参与时是否回滚。
*   **所有者专属功能 (Owner Functions)**:
    *   **设置票价**: 验证所有者在特定条件下能否成功设置新票价，以及错误条件下是否回滚。
    *   **提取未分配ETH**: 验证所有者在彩票结束后能否成功提取合约中未分配的ETH，以及错误条件下是否回滚。
*   **视图函数 (View Functions)**:
    *   验证 `getLotteryStatus`, `getPrizeTierConfig`, `getPlayers`, `getPrizePool` 等函数返回正确的数据。

### 二、集成测试 (Integration Tests)
这些测试主要关注合约与外部依赖（如其他合约或模拟服务）的交互，或者合约内部多个功能模块协同工作的端到端流程。

*   **VRF 交互与中奖者选择 (VRF Interaction & Winner Selection)**:
    *   **请求中奖者**: 验证所有者能否成功请求中奖者，彩票状态是否关闭，以及是否正确发出 `RandomWordsRequested` 事件。
    *   **模拟 VRF 回调与完整流程**: 测试从请求随机数、模拟 `VRFCoordinatorV2Mock` 回调 `fulfillRandomWords`，到合约内部处理随机数、挑选单个/多个中奖者、分配奖金，并最终重置彩票状态的完整流程。
    *   **多奖项层级处理**: 测试在配置了多个奖项层级和多个中奖名额的情况下，VRF回调后能否正确地为每个层级挑选出相应数量的中奖者，并按比例分配奖金。
    *   **玩家少于总中奖名额**: 测试当参与玩家数量少于配置的总中奖名额时，合约能否正确处理，只挑选现有玩家作为中奖者，并将剩余未分配的奖金保留在合约中。
*   **防止合约参与 (Contract Entry Prevention)**:
    *   通过部署一个 `Attacker.sol` 合约并尝试让其参与彩票，验证 `SimpleLottery.sol` 中阻止合约参与的机制是否有效。

## 未来可能的改进
*   Gas 优化。
*   增加更多边界条件测试。
*   集成更详细的事件日志分析。

```shell
npx hardhat clean
npx hardhat compile
npx hardhat ignition deploy ./ignition/modules/DeploySimpleLottery.js --network sepolia
npx hardhat test
```
