# Web3Ticket - 我的抽奖应用 (My Lottery App)

欢迎来到 Web3Ticket！这是一个基于 Web3 技术的去中心化抽奖前端应用。用户可以通过此应用与部署在区块链上的抽奖智能合约进行交互。
![alt text](admin.png) ![alt text](history.png) ![alt text](home.png)

## ✨ 功能特性 (Features)

*   连接 Web3 钱包 (例如 MetaMask)
*   查看当前可参与的抽奖活动
*   购买抽奖彩票
*   查看历史抽奖结果
*   (根据你的项目具体功能，可以添加更多特性，例如：管理员创建和管理抽奖活动等)

## 🛠️ 技术栈 (Tech Stack)

*   **前端框架**: (例如: React, Vue, Svelte - **请根据你的项目实际情况填写**)
*   **构建工具**: Vite (根据 `.gitignore` 中的 `.vite/` 推断)
*   **包管理器**: npm 或 yarn (请根据你的项目选择)
*   **Web3 集成**: (例如: ethers.js, web3.js - **请根据你的项目实际情况填写**)
*   **目标区块链**: (例如: Ethereum, Polygon, BNB Chain - **请根据你的项目实际情况填写**)
*   **UI 库/组件**: (例如: Material-UI, Tailwind CSS, Ant Design - 如果有使用，请填写)

## 🚀 开始使用 (Getting Started)

### 前提条件 (Prerequisites)

在开始之前，请确保你已经安装了以下软件：

*   Node.js (推荐 v16.x 或更高版本)
*   npm (通常随 Node.js 一起安装) 或 yarn
*   一个支持 Web3 的浏览器或浏览器扩展，例如 MetaMask

### 安装 (Installation)

1.  **克隆仓库** (如果项目已在版本控制中):
    ```bash
    git clone <你的仓库URL>
    cd d:\project\Front\web3Ticket\my-lottery-app
    ```
    如果项目是本地创建的，直接进入项目目录 `d:\project\Front\web3Ticket\my-lottery-app`。

2.  **安装项目依赖**:
    打开终端，进入项目根目录 `d:\project\Front\web3Ticket\my-lottery-app\`，然后运行：
    ```bash
    npm install
    ```
    或者，如果你使用 yarn：
    ```bash
    yarn install
    ```

3.  **配置环境变量**:
    在项目根目录 `d:\project\Front\web3Ticket\my-lottery-app\` 下，你可能需要创建一个 `.env.local` 文件来配置环境变量。如果项目中有 `.env.example` 文件，可以复制它并重命名为 `.env.local`。
    例如：
    ```env
    # .env.local
    VITE_APP_TITLE="Web3Ticket Lottery"
    VITE_CONTRACT_ADDRESS="你的抽奖智能合约地址"
    # 根据你的项目需要，添加其他必要的环境变量
    ```
    *重要提示: `.gitignore` 文件已配置忽略 `.env` 和 `.env*.local` 文件，这意味着这些包含敏感信息或本地配置的文件不会被提交到 Git 仓库。*

### 运行开发服务器 (Running in Development)

配置完成后，你可以启动本地开发服务器：

```bash
npm run dev
```
或者，如果你使用 yarn：
```bash
yarn dev
```
应用通常会在 `http://localhost:5173` (Vite 默认端口) 或你在 `vite.config.js` (或 `.ts`) 中配置的其他端口上运行。在浏览器中打开此地址即可查看应用。

### 构建生产版本 (Building for Production)

当你准备好部署应用时，可以构建生产优化版本：

```bash
npm run build
```
或者，如果你使用 yarn：
```bash
yarn build
```
构建产物会生成在项目根目录下的 `dist` 文件夹 (`d:\project\Front\web3Ticket\my-lottery-app\dist\`) 中。这个 `dist` 目录包含了所有静态资源，可以部署到任何静态文件托管服务上。

## 🧹 代码检查与格式化 (Linting and Formatting)

如果你的项目配置了 ESLint, Prettier 或其他代码检查/格式化工具，请在此处说明如何运行它们。例如：
```bash
# npm run lint
# npm run format
```

## 🤝 贡献 (Contributing)

如果你想为这个项目做出贡献，请遵循标准的 Fork & Pull Request 工作流程。任何贡献都将受到欢迎！

## 📄 许可证 (License)

本项目采用 (例如: MIT) 许可证。请在此处填写你选择的许可证类型。