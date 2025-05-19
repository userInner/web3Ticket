// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, VStack, Text, Box, Spinner, Button as ChakraButton, useColorMode } from '@chakra-ui/react'; // 导入 Chakra UI 组件, 确保 useColorMode 从这里导入
import { ethers } from 'ethers';
import { lotteryContractAddress, lotteryContractABI } from './config'; // 导入配置
import Header from './components/Header'; // 导入 Header 组件
import { useAppContext } from './context/AppContext'; // 导入 useAppContext
import { useLotteryData } from './hooks/useLotteryData'; // 导入数据 Hook
import { useContractEvents } from './hooks/useContractEvents'; // 导入事件 Hook
import Notifications from './components/Notifications'; // 导入通知组件
import { useWallet } from './hooks/useWallet'; // 自定义 Hook 用于钱包连接
import './App.css'; // 你可以添加一些基础样式
// Page Components
import LotteryPage from './components/pages/LotteryPage';
import AdminPage from './components/pages/AdminPage';
import HistoryPage from './components/pages/HistoryPage';
// Common Components
import Footer from './components/Footer';

function App() {
  const { showNotification, errorMessage, successMessage } = useAppContext(); // 从 Context 获取
  const { colorMode, toggleColorMode } = useColorMode(); // 获取颜色模式切换函数

  // 使用 useWallet Hook 管理钱包状态和连接逻辑
  const { currentAccount, provider, signer, connectWallet, setCurrentAccount, setProvider, setSigner } = useWallet();

  const [contract, setContract] = useState(null); // 存储合约实例
  const [isLoading, setIsLoading] = useState(false); // 用于加载状态
  const [newAdminTicketPrice, setNewAdminTicketPrice] = useState(""); // 管理员设置新票价的输入

    // 使用自定义 Hook 获取合约数据
  const {
    ticketPrice, prizePool, lotteryStatus, owner, players, historicalWinners,
    isLoadingData, fetchContractData, fetchPlayers, fetchHistoricalWinners
  } = useLotteryData(contract, provider);

  // 使用自定义 Hook 处理合约事件
  useContractEvents(contract, fetchContractData, fetchPlayers, fetchHistoricalWinners);

 useEffect(() => {
     document.title = import.meta.env.VITE_APP_TITLE || 'My Lottery DApp';
  }, []);
  // 2. 当账户或 provider/signer 变化时，初始化合约实例并获取数据
 

  useEffect(() => {
    const initContract = async () => {
      if (provider && signer && currentAccount) {
        try {
          const lotteryContract = new ethers.Contract(
            lotteryContractAddress,
            lotteryContractABI,
            signer // 对于写操作需要 signer，只读可以用 provider
          );
          setContract(lotteryContract);
          console.log("合约实例已创建:", lotteryContract);
          // 可以在这里添加获取网络ID的检查，确保用户连接到正确的网络（例如 Sepolia）
          const network = await provider.getNetwork();
          console.log("当前网络:", network.name, network.chainId);
          // if (network.chainId !== YOUR_SEPOLIA_CHAIN_ID) { // 例如 Sepolia chainId is 11155111
          //   showNotification(`请连接到 Sepolia 测试网络! 当前网络: ${network.name}`, "error");
          //   return;
          // }
          // 数据获取现在完全由 useLotteryData Hook 在其内部的 useEffect 中处理

        } catch (error) {
            console.error("初始化合约失败:", error);
            showNotification(`初始化合约失败: ${error.message}`, "error");
        }
      }
    };
    initContract();
    // 当钱包断开连接时，清除合约实例
    if (!currentAccount || !provider || !signer) {
        setContract(null);
    }
  }, [currentAccount, provider, signer, showNotification]);
  // 注意：上面的 useEffect 依赖项中，如果 currentAccount, provider, signer 来自 useWallet，
  // 并且 useWallet 内部的 useEffect 依赖了 showNotification，
  // 确保 showNotification 是稳定的引用（useAppContext 应该能保证这一点）。

  // 4. 购买彩票的函数
  const handleEnterLottery = async () => {
    if (!contract || !signer) {
      showNotification("请先连接钱包并确保合约已初始化。", "error");
      return;
    }
    if (!lotteryStatus) {
        showNotification("抱歉，当前彩票已关闭。", "error");
        return;
    }

    setIsLoading(true);
    try {
      const priceInWei = await contract.ticketPrice(); // 获取最新的票价 (Wei)

      // 发送交易
      const tx = await contract.enterLottery({
        value: priceInWei // 发送与票价等值的 Ether
      });

      showNotification(`正在处理您的彩票购买交易: ${tx.hash}，请稍候...`, "info");
      await tx.wait(); // 等待交易被矿工确认

      showNotification(`彩票购买成功！交易哈希: ${tx.hash}`, "success");
      // 交易成功后，重新获取最新的奖池等数据 (事件监听器也会做一部分)
      fetchContractData(contract);
      fetchPlayers(contract);

    } catch (error) {
      console.error("购买彩票失败:", error);
      // 用户拒绝交易等常见错误
      if (error.code === 4001) {
         showNotification("您已取消交易。", "error");
      } else if (error.reason) { // Ethers v6 specific for contract reverts
        showNotification(`购买彩票失败: ${error.reason}`, "error");
      } else if (error.data?.message || error.message) {
        // 尝试从 error.data.message (常见于 Hardhat/Foundry 错误) 或 error.message 获取 revert原因
        const revertMessage = error.data?.message || error.message;
        if (revertMessage.includes("Must send exact ticket price")) {
            showNotification("购买失败：发送的金额与票价不符。", "error");
        } else if (revertMessage.includes("Lottery is not open")) {
            showNotification("购买失败：彩票当前未开放。", "error");
        } else if (revertMessage.includes("Caller is not the owner")) {
            showNotification("操作失败：您不是合约所有者。", "error");
        }
        else {
            showNotification(`购买彩票失败: ${revertMessage}`, "error");
        }
      }
      else {
        showNotification(`购买彩票失败，未知错误。详情请查看控制台。`, "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 5. 监听合约事件
  // 合并 isLoading 和 isLoadingData
  const combinedIsLoading = isLoading || isLoadingData;
  // 6. 管理员操作函数
  const handleGenericAdminTx = async (txFunction, successMsg, errorMsgBase) => {
    if (!contract || !signer) {
      showNotification("请先连接钱包并确保合约已初始化。", "error");
      return;
    }
    setIsLoading(true);
    try {
      const tx = await txFunction();
      showNotification(`正在处理操作: ${tx.hash}...`, "info");
      await tx.wait();
      showNotification(successMsg, "success");
      fetchContractData(contract); // 刷新合约数据
      // Potentially refresh other data like players if relevant
    } catch (error) {
      console.error(`${errorMsgBase}失败:`, error);
      if (error.code === 4001) {
        showNotification("您已取消交易。", "error");
      } else if (error.reason) {
        showNotification(`${errorMsgBase}失败: ${error.reason}`, "error");
      } else if (error.data?.message) {
        showNotification(`${errorMsgBase}失败: ${error.data.message}`, "error");
      } else {
        showNotification(`${errorMsgBase}失败: ${error.message || '未知错误'}`, "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenLottery = async () => {
    await handleGenericAdminTx(
      () => contract.openLottery(),
      "新一轮彩票已成功开启！",
      "开启彩票"
    );
  };

  const handlePickWinner = async () => {
    if (players.length === 0 && lotteryStatus) {
        showNotification("当前没有玩家参与，无法开奖。", "warning");
        return;
    }
    if (!lotteryStatus && prizePool === "0.0" && players.length === 0) {
        showNotification("彩票已结束或未开始，且无奖池和玩家。", "warning");
        return;
    }
    await handleGenericAdminTx(
      () => contract.pickWinner(),
      "中奖者已成功抽取！请查看事件通知。", // 事件监听器会显示具体中奖者
      "抽取中奖者"
    );
    // Event listener for WinnerPicked will update UI
  };

  const handleSetTicketPrice = async () => {
    if (!newAdminTicketPrice || isNaN(parseFloat(newAdminTicketPrice)) || parseFloat(newAdminTicketPrice) <= 0) {
      showNotification("请输入有效的新票价 (正数)。", "error");
      return;
    }
    const priceInWei = ethers.parseEther(newAdminTicketPrice);
    await handleGenericAdminTx(
      () => contract.setTicketPrice(priceInWei),
      `票价已成功设置为 ${newAdminTicketPrice} ETH！`,
      "设置票价"
    );
    setNewAdminTicketPrice(""); // 清空输入框
  };

  const isOwnerConnected = contract && currentAccount && owner && currentAccount.toLowerCase() === owner.toLowerCase();

 return (
    <Router>
      <Container maxW="container.lg" py={{ base: '6', md: '12' }} centerContent>
        <VStack spacing={{ base: '6', md: '8' }} align="stretch" w="100%">
          <Box display="flex" justifyContent="space-between" alignItems="center" w="100%">
            {/* Placeholder for potential logo or extra space */}
            <Box /> 
            <ChakraButton onClick={toggleColorMode} size="sm" variant="outline">
              切换到 {colorMode === 'light' ? '深色' : '浅色'}模式
            </ChakraButton>
          </Box>

          <Header
            currentAccount={currentAccount}
            connectWallet={connectWallet}
            isLoading={combinedIsLoading}
            isOwnerConnected={isOwnerConnected} // Pass this to Header for Admin link
          />

          <Notifications />

          {combinedIsLoading && !contract && !currentAccount && ( // 初始加载合约时显示
            <VStack py="20">
              <Spinner size="xl" color="brand.500" thickness="4px" />
              <Text>正在连接到区块链网络...</Text>
            </VStack>
          )}

          <Box as="main" w="100%">
            <Routes>
              <Route 
                path="/" 
                element={
                  <LotteryPage 
                    contract={contract}
                    currentAccount={currentAccount}
                    owner={owner}
                    ticketPrice={ticketPrice}
                    prizePool={prizePool}
                    lotteryStatus={lotteryStatus}
                    isLoadingData={isLoadingData}
                    fetchContractData={fetchContractData}
                    players={players}
                    handleEnterLottery={handleEnterLottery}
                    isLoading={isLoading}
                  />
                } 
              />
              <Route 
                path="/admin" 
                element={
                  isOwnerConnected ? (
                    <AdminPage 
                      isOwnerConnected={isOwnerConnected}
                      isLoading={isLoading}
                      lotteryStatus={lotteryStatus}
                      players={players}
                      handleOpenLottery={handleOpenLottery}
                      handlePickWinner={handlePickWinner}
                      newAdminTicketPrice={newAdminTicketPrice}
                      setNewAdminTicketPrice={setNewAdminTicketPrice}
                      handleSetTicketPrice={handleSetTicketPrice}
                      currentAccount={currentAccount}
                    />
                  ) : (
                    <Navigate to="/" replace /> // If not owner, redirect to home
                  )
                } 
              />
              <Route 
                path="/history" 
                element={
                  <HistoryPage 
                    historicalWinners={historicalWinners} 
                    currentAccount={currentAccount}
                  />
                } 
              />
            </Routes>
          </Box>

          {!currentAccount && !combinedIsLoading && (
              <Text textAlign="center" fontSize="lg" color="gray.500" py="10">
                  请先连接您的 MetaMask 钱包以开始。
              </Text>
          )}

          <VStack spacing="2" pt="8" color={colorMode === 'dark' ? "gray.400" : "gray.500"} fontSize="sm">
            <Text>注意：本 DApp 仅用于学习和演示目的，实际使用请谨慎。</Text>
            <Text>免责声明：本 DApp 不提供任何投资建议，参与彩票需谨慎。</Text>
            <Text>请确保在测试网络上进行操作，避免损失真实资产。</Text>
          </VStack>

          <Footer
            lotteryContractAddress={lotteryContractAddress}
          />
        </VStack>
      </Container>
    </Router>
  );
}

export default App;