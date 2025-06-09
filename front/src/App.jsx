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
import { useEthPrice } from './hooks/useEthPrice'; // 导入 ETH 价格 Hook
import Notifications from './components/Notifications'; // 导入通知组件
import { useWallet } from './hooks/useWallet'; // 自定义 Hook 用于钱包连接
import './App.css'; // 你可以添加一些基础样式
import { parseContractError } from './utils/errorUtils'; // 导入错误解析函数
// Page Components
import LotteryPage from './components/pages/LotteryPage'; // 导入 LotteryPage 组件
import AdminPage from './components/pages/AdminPage'; // 导入 AdminPage 组件
import HistoryPage from './components/pages/HistoryPage'; // 导入 HistoryPage 组件
// Common Components
import Footer from './components/Footer';

function App() {
  const { showNotification, errorMessage, successMessage } = useAppContext(); // 从 Context 获取
  const { colorMode, toggleColorMode } = useColorMode(); // 获取颜色模式切换函数
  const toast = useToast(); // 正确地从 @chakra-ui/react 导入并使用

  // 使用 useWallet Hook 管理钱包状态和连接逻辑
  const { currentAccount, provider, signer, connectWallet, disconnectWallet, setCurrentAccount, setProvider, setSigner } = useWallet(); // 从 useWallet 获取 disconnectWallet

  // 使用 useEthPrice Hook 获取 ETH 对 USDT 的价格
  const { ethToUsdtPrice, isLoadingPrice: isLoadingEthPrice, priceError: ethPriceError, refreshEthPrice } = useEthPrice();

  const [isTxLoading, setIsTxLoading] = useState(false); // Specific loading for user transactions
  // 使用 useMemo 稳定合约实例的创建
  const lotteryContract = useMemo(() => {
    const currentSignerOrProvider = signer || provider;
    if (currentSignerOrProvider && import.meta.env.VITE_CONTRACT_ADDRESS && lotteryContractABI) {
      console.log("App.jsx: Creating contract instance with:", currentSignerOrProvider);
      return new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, lotteryContractABI, currentSignerOrProvider);
    }
    console.log("App.jsx: Contract instance is null (useMemo).");
    return null;
  }, [signer, provider]); // 依赖 signer 和 provider

  // 使用自定义 Hook 获取合约数据
  // The lotteryContract instance (from useMemo above) will be passed here
  const {
    ticketPrice,
    prizePool,
    lotteryStatus,
    owner,
    players,
    isLoadingData,
    refreshLotteryData, // Updated from fetchContractData
    prizeTiers,         // New state
    lastDrawResults,    // New state
    isWinnerPickingInProgress, // New state
    historicalDraws,    // New state, replaces historicalWinners
    error: lotteryDataError // New state for errors from the hook
  } = useLotteryData(lotteryContract, provider); // Pass the memoized lotteryContract

  const isOwnerConnected = lotteryContract && currentAccount && owner && currentAccount.toLowerCase() === owner.toLowerCase();

  // 使用自定义 Hook 处理合约事件
  // 将 requestWinnerToastIdRef 从 useAdminActions 传递给 useContractEvents
  const {
    isLoadingAdminAction,
    newAdminTicketPrice, // Get state from useAdminActions
    setNewAdminTicketPrice, // Get setter from useAdminActions
    handleOpenLottery,
    handlePickWinner, // This is requestWinner
    handleSetTicketPrice,
    handleSetPrizeConfiguration, // Get this from useAdminActions
    requestWinnerToastIdRef, // 从 useAdminActions 获取 ref
  } = useAdminActions(
    lotteryContract, showNotification, refreshLotteryData, isOwnerConnected, lotteryStatus, players
  );

  // State for prize tier configuration input in AdminPanel, lifted from useAdminActions
  const [prizeTiersInput, setPrizeTiersInput] = useState([{ percentage: '', count: '' }]);
  // State for the prize configuration modal
  const [isPrizeConfigModalOpen, setIsPrizeConfigModalOpen] = useState(false);
  const [modalPrizeTiersInput, setModalPrizeTiersInput] = useState([{ percentage: '', count: '' }]);

  // Initialize prizeTiersInput from contract's prizeTiers when they load
  useEffect(() => {
    if (prizeTiers && prizeTiers.length > 0) {
      const currentConfig = prizeTiers.map(tier => ({ percentage: tier.percentage.toString(), count: tier.count.toString() }));
      setPrizeTiersInput(currentConfig);
      // Also initialize modal input if it's empty or matches default
      if (modalPrizeTiersInput.length === 1 && modalPrizeTiersInput[0].percentage === '' && modalPrizeTiersInput[0].count === '') {
        setModalPrizeTiersInput(currentConfig);
      }
    } else {
      setPrizeTiersInput([{ percentage: '', count: '' }]); // Default if no tiers configured
      setModalPrizeTiersInput([{ percentage: '', count: '' }]);
    }
  }, [prizeTiers]);

  // Handlers for the modal's prize tier input
  const handleAddModalPrizeTierInput = useCallback(() => {
    setModalPrizeTiersInput(prevTiers => [...prevTiers, { percentage: '', count: '' }]);
  }, []);

  const handleRemoveModalPrizeTierInput = useCallback((index) => {
    setModalPrizeTiersInput(prevTiers => prevTiers.filter((_, i) => i !== index));
  }, []);

  const handleModalPrizeTierInputChange = useCallback((index, field, value) => {
    setModalPrizeTiersInput(prevTiers =>
      prevTiers.map((tier, i) =>
        i === index ? { ...tier, [field]: value } : tier
      )
    );
  }, []);

  const openPrizeConfigModal = () => {
    // Initialize modal with current configuration from contract if available,
    // otherwise, use the last edited state (prizeTiersInput) or default.
    if (prizeTiers && prizeTiers.length > 0) {
      setModalPrizeTiersInput(prizeTiers.map(tier => ({ percentage: tier.percentage.toString(), count: tier.count.toString() })));
    } else {
      // If no contract config, use the current state of prizeTiersInput (which might have unsaved changes)
      // or a fresh default if prizeTiersInput is also default.
      setModalPrizeTiersInput(prizeTiersInput.length > 0 && prizeTiersInput[0].percentage !== '' ? prizeTiersInput : [{ percentage: '', count: '' }]);
    }
    setIsPrizeConfigModalOpen(true);
  };

  const handleSubmitPrizeConfigurationFromModal = async () => {
    await handleSetPrizeConfiguration(modalPrizeTiersInput); // from useAdminActions
    // If successful, useAdminActions will call refreshLotteryData, which updates prizeTiers,
    // which in turn updates prizeTiersInput and modalPrizeTiersInput via useEffect.
    setIsPrizeConfigModalOpen(false);
  };

  useContractEvents(lotteryContract, refreshLotteryData, requestWinnerToastIdRef, toast); // Updated to use refreshLotteryData
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
    setIsTxLoading(true);
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
      refreshLotteryData(); // Call the unified refresh function

    } catch (error) {
      console.error("购买彩票失败:", error);
      const userFriendlyMessage = parseContractError(error);
      showNotification(userFriendlyMessage, "error");
    } finally {
      setIsTxLoading(false);
    }
  };

  // 5. 监听合约事件
  // 辅助函数：按 requestId 分组历史 TierWinnerPicked 事件
  const groupHistoricalDraws = (draws) => {
    if (!draws || draws.length === 0) return [];
    const grouped = draws.reduce((acc, drawEvent) => {
      const { requestId, tierIndex, winner, prizeAmount, blockNumber, transactionHash } = drawEvent;
      if (!acc[requestId]) {
        acc[requestId] = {
          requestId: requestId,
          blockNumber: blockNumber,
          transactionHash: transactionHash, // Note: This might be the tx hash of one of the TierWinnerPicked events
          tiers: {} // Use an object for tiers for easy access by tierIndex
        };
      }
      if (!acc[requestId].tiers[tierIndex]) {
        acc[requestId].tiers[tierIndex] = {
          tierIndex: tierIndex,
          winners: [],
          prizePerWinner: '0' // Initialize, will be set by the first winner's prize in this tier for this draw
        };
      }
      acc[requestId].tiers[tierIndex].winners.push(winner);
      if (acc[requestId].tiers[tierIndex].prizePerWinner === '0' && parseFloat(prizeAmount) > 0) {
        acc[requestId].tiers[tierIndex].prizePerWinner = prizeAmount; // prizeAmount is already formatted ETH string
      }
      return acc;
    }, {});
    return Object.values(grouped).map(draw => ({ ...draw, tiers: Object.values(draw.tiers).sort((a,b) => a.tierIndex - b.tierIndex) })).sort((a, b) => parseInt(b.requestId) - parseInt(a.requestId));
  };
  const groupedHistoricalData = useMemo(() => groupHistoricalDraws(historicalDraws), [historicalDraws]);
  // 合并 isLoading 和 isLoadingData
  const combinedIsLoading = isTxLoading || isLoadingData || isLoadingAdminAction;
  return (
    <Router>
      <Flex direction="column" minH="100vh" bg={colorMode === 'dark' ? 'gray.800' : 'white'}> {/* Use colorMode for background */}
        <Header currentAccount={currentAccount} connectWallet={connectWallet} disconnectWallet={disconnectWallet} isLoading={combinedIsLoading} isOwnerConnected={isOwnerConnected} colorMode={colorMode} toggleColorMode={toggleColorMode} />

        <Box as="main" flex="1" w="100%" overflowY="auto"> {/* flex="1" makes it grow, overflowY for scrolling */}
          <Container 
            maxW="container.lg" 
            w="100%" 
            px={{ base: 4, md: 6 }} // Define consistent horizontal padding here
            py={{ base: '6', md: '12' }} 
            display="flex" 
            flexDirection="column" 
            flexGrow={1}>
            <VStack spacing={{ base: '6', md: '8' }} align="stretch" w="100%" flexGrow={1}> {/* 确保这个VStack也能flexGrow */}
          <Notifications />

          {/* This Box will contain the main content (loading/connect/routes) and grow to fill available space.
              It's set to be a flex column so its children can use flexGrow. */}
          <Box flexGrow={1} w="100%" display="flex" flexDirection="column">
            {combinedIsLoading && !lotteryContract && !currentAccount ? ( // Use memoized lotteryContract
              <VStack py="20" justifyContent="center" alignItems="center" flexGrow={1} w="100%"> {/* Use flexGrow to fill parent Box */}
                <Spinner size="xl" color="brand.500" thickness="4px" />
                <Text>正在连接到区块链网络...</Text>
              </VStack>
            ) : !currentAccount && !combinedIsLoading ? (
              <VStack py="10" justifyContent="center" alignItems="center" flexGrow={1} w="100%"> {/* Use flexGrow to fill parent Box */}
                <Text textAlign="center" fontSize="lg" color="gray.500">
                  请先连接您的 MetaMask 钱包以开始。
                </Text>
              </VStack>
            ) : (
              // This Box wraps the Routes and ensures it fills the available space from its parent Box.
              <Box w="100%" display="flex" flexDirection="column" flexGrow={1}>
                <Routes>
                  <Route
                    path="/"
                    element={
                      <LotteryPage
                        currentAccount={currentAccount}
                        owner={owner}
                        ticketPrice={ticketPrice}
                        prizePool={prizePool}
                        lotteryStatus={lotteryStatus}
                        isLoadingData={isLoadingData}
                        players={players}
                        handleEnterLottery={handleEnterLottery}
                        isLoadingTx={isTxLoading} // 用户交易的加载状态
                        prizeTiers={prizeTiers}
                        lastDrawResults={lastDrawResults}
                        isWinnerPickingInProgress={isWinnerPickingInProgress}
                        refreshLotteryData={refreshLotteryData} // 传递刷新函数
                        lotteryDataError={lotteryDataError} // 传递错误状态
                        // ETH 价格相关的 props
                        ethToUsdtPrice={ethToUsdtPrice}
                        isLoadingEthPrice={isLoadingEthPrice}
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
                          isPickingWinner={isWinnerPickingInProgress} // 传递 isWinnerPickingInProgress
                          // Props for Prize Configuration Modal
                          openPrizeConfigModal={openPrizeConfigModal}
                          isPrizeConfigModalOpen={isPrizeConfigModalOpen}
                          setIsPrizeConfigModalOpen={setIsPrizeConfigModalOpen}
                          modalPrizeTiersInput={modalPrizeTiersInput}
                          handleAddModalPrizeTierInput={handleAddModalPrizeTierInput}
                          handleRemoveModalPrizeTierInput={handleRemoveModalPrizeTierInput}
                          handleModalPrizeTierInputChange={handleModalPrizeTierInputChange}
                          handleSubmitPrizeConfigurationFromModal={handleSubmitPrizeConfigurationFromModal}
                          // Display current contract config
                          currentPrizeTiers={prizeTiers} // Pass the actual current tiers from contract
                          currentPrizeTierConfigCount={prizeTiers?.length || 0}
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
                        groupedHistoricalData={groupedHistoricalData} // Pass the grouped historical data
                        currentAccount={currentAccount}
                        isLoadingHistory={isLoadingData} // Pass the loading state for history
                      />
                    }
                  />
                </Routes>
              </Box>
            )}
            </Box>

          {/* Disclaimer VStack - remains at the bottom of the main content area */}
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
  ); // Added closing parenthesis for the return statement
}

export default App;