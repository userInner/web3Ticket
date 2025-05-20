// src/App.jsx
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, VStack, Text, Box, Spinner, Button as ChakraButton, useColorMode, useToast, Flex } from '@chakra-ui/react'; // 导入 Chakra UI 组件, 确保 useColorMode 和 useToast 从这里导入
import { ethers } from 'ethers';
import { lotteryContractAddress, lotteryContractABI } from './config'; // 导入配置
import Header from './components/Header'; // 导入 Header 组件
import { useAppContext } from './context/AppContext'; // 导入 useAppContext
import { useLotteryData } from './hooks/useLotteryData'; // 导入数据 Hook
import { useContractEvents } from './hooks/useContractEvents'; // 导入事件 Hook
import { useAdminActions } from './hooks/useAdminActions'; // 导入管理员操作 Hookimport { useMemo } from 'react'; // 导入 useMemo
import Notifications from './components/Notifications'; // 导入通知组件
import { useWallet } from './hooks/useWallet'; // 自定义 Hook 用于钱包连接
import './App.css'; // 你可以添加一些基础样式
import { parseContractError } from './utils/errorUtils'; // 导入错误解析函数
// Page Components
import LotteryPage from './components/pages/LotteryPage';
import AdminPage from './components/pages/AdminPage';
import HistoryPage from './components/pages/HistoryPage';
// Common Components
import Footer from './components/Footer';

function App() {
  const { showNotification, errorMessage, successMessage } = useAppContext(); // 从 Context 获取
  const { colorMode, toggleColorMode } = useColorMode(); // 获取颜色模式切换函数
  const toast = useToast(); // 正确地从 @chakra-ui/react 导入并使用

  // 使用 useWallet Hook 管理钱包状态和连接逻辑
  const { currentAccount, provider, signer, connectWallet, disconnectWallet, setCurrentAccount, setProvider, setSigner } = useWallet(); // 从 useWallet 获取 disconnectWallet

  const [isLoading, setIsLoading] = useState(false); // 用于购买彩票等非管理员操作的加载状态

  // 使用 useMemo 稳定合约实例的创建
  const lotteryContract = useMemo(() => {
    if (signer && import.meta.env.VITE_CONTRACT_ADDRESS && lotteryContractABI) { // 使用导入的 lotteryContractABI
      console.log("App.jsx: 使用 useMemo 创建/获取合约实例");
      return new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, lotteryContractABI, signer); // 使用导入的 lotteryContractABI
    }
    console.log("App.jsx: 合约实例为 null (useMemo)，因为 signer, 地址或 ABI 缺失");
    return null;
  }, [signer]); // 依赖 signer

  // 使用自定义 Hook 获取合约数据
  // The lotteryContract instance (from useMemo above) will be passed here
  const {
    ticketPrice, prizePool, lotteryStatus, owner, players, historicalWinners,
    isLoadingData, fetchContractData, fetchPlayers, fetchHistoricalWinners
  } = useLotteryData(lotteryContract, provider); // Pass the memoized lotteryContract
  const isOwnerConnected = lotteryContract && currentAccount && owner && currentAccount.toLowerCase() === owner.toLowerCase();

  // 使用自定义 Hook 处理合约事件
  // 将 requestWinnerToastIdRef 从 useAdminActions 传递给 useContractEvents
  const {
    isLoadingAdminAction,
    newAdminTicketPrice, // Get state from useAdminActions
    setNewAdminTicketPrice, // Get setter from useAdminActions
    handleOpenLottery,
    handlePickWinner,
    handleSetTicketPrice,
    requestWinnerToastIdRef, // 从 useAdminActions 获取 ref
  } = useAdminActions( // 将 lotteryContract 传递给 useAdminActions
    lotteryContract, showNotification, fetchContractData, isOwnerConnected, lotteryStatus, players // Pass memoized lotteryContract
  );

  useContractEvents(lotteryContract, fetchContractData, fetchPlayers, fetchHistoricalWinners, requestWinnerToastIdRef, toast); // Pass memoized lotteryContract
  useEffect(() => {
    document.title = import.meta.env.VITE_APP_TITLE || 'My Lottery DApp';
  }, []);

  // 4. 购买彩票的函数
  const handleEnterLottery = async () => {
    if (!lotteryContract || !signer) { // Use memoized lotteryContract
      showNotification("请先连接您的钱包。", "warning");
      await connectWallet(); // 尝试连接钱包
      return;
    }
    if (!lotteryStatus) {
      showNotification("抱歉，当前彩票已关闭。", "error");
      return;
    }

    console.log("购买彩票函数被调用");
    setIsLoading(true);
    try {
      const priceInWei = await lotteryContract.ticketPrice(); // Use memoized lotteryContract

      // 发送交易
      const tx = await lotteryContract.enterLottery({ // Use memoized lotteryContract
        value: priceInWei // 发送与票价等值的 Ether
      });

      showNotification(`正在处理您的彩票购买交易: ${tx.hash}，请稍候...`, "info");
      await tx.wait(); // 等待交易被矿工确认

      showNotification(`彩票购买成功！交易哈希: ${tx.hash}`, "success");
      // 交易成功后，重新获取最新的奖池等数据.
      // fetchContractData and fetchPlayers (from useLotteryData) use the lotteryContract instance
      // they were initialized with, so no need to pass it again.
      fetchContractData();
      fetchPlayers();

    } catch (error) {
      console.error("购买彩票失败:", error);
      const userFriendlyMessage = parseContractError(error);
      showNotification(userFriendlyMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 5. 监听合约事件
  // 合并 isLoading 和 isLoadingData
  const combinedIsLoading = isLoading || isLoadingData || isLoadingAdminAction;
  return (
    <Router>
      <Flex direction="column" minH="100vh">
        <Header
          currentAccount={currentAccount}
          connectWallet={connectWallet}
          disconnectWallet={disconnectWallet}
          isLoading={combinedIsLoading}
          isOwnerConnected={isOwnerConnected}
          colorMode={colorMode} // 传递 colorMode
          toggleColorMode={toggleColorMode} // 传递 toggleColorMode
        />

        <Box as="main" flex="1" w="100%" overflowY="auto"> {/* flex="1" makes it grow, overflowY for scrolling */}
          <Container maxW="container.lg" py={{ base: '6', md: '12' }} display="flex" flexDirection="column" flexGrow={1}>
            <VStack spacing={{ base: '6', md: '8' }} align="stretch" w="100%" flexGrow={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center" w="100%">
            <Box />
          </Box>

          <Notifications />

          {combinedIsLoading && !lotteryContract && !currentAccount && ( // Use memoized lotteryContract
            <VStack py="20" flexGrow={1} justifyContent="center" alignItems="center"> {/* Make loading take space */}
              <Spinner size="xl" color="brand.500" thickness="4px" />
              <Text>正在连接到区块链网络...</Text>
            </VStack>
          )}

          {!(combinedIsLoading && !lotteryContract && !currentAccount) && ( // Use memoized lotteryContract
            <Box flexGrow={1}> {/* Use memoized lotteryContract */}
            <Routes>
              <Route
                path="/"
                element={
                  <LotteryPage
                    contract={lotteryContract} // Pass memoized lotteryContract
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
                      // Pass props from useAdminActions and App state
                      isOwnerConnected={isOwnerConnected}
                      isLoading={isLoadingAdminAction} // Use isLoading from useAdminActions
                      lotteryStatus={lotteryStatus}
                      players={players}
                      handleOpenLottery={handleOpenLottery}
                      handlePickWinner={handlePickWinner}
                      // newAdminTicketPrice and setNewAdminTicketPrice are now managed by useAdminActions
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
          )}

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
            </VStack> 
          </Container> 
        </Box>

      <Footer lotteryContractAddress={lotteryContractAddress} />
      </Flex>   
    </Router>
  );
}

export default App;