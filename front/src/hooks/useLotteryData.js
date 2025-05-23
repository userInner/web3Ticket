import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAppContext } from '../context/AppContext';

export function useLotteryData(contract, provider) {
  const { showNotification } = useAppContext();

  // --- 现有状态 ---
  const [ticketPrice, setTicketPrice] = useState("0");
  const [prizePool, setPrizePool] = useState("0");
  const [lotteryStatus, setLotteryStatus] = useState(false);
  const [owner, setOwner] = useState("");
  const [players, setPlayers] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // --- 新增/修改的状态以适应新合约 ---
  const [prizeTiers, setPrizeTiers] = useState([]); // 存储奖品等级配置
  const [lastDrawResults, setLastDrawResults] = useState([]); // 存储最近一期各等级获奖者和奖金
  const [isWinnerPickingInProgress, setIsWinnerPickingInProgress] = useState(false);
  const [historicalDraws, setHistoricalDraws] = useState([]); // 存储历史开奖记录 (基于 TierWinnerPicked)

  const fetchLotteryData = useCallback(async () => {
    if (!contract || !provider) {
      console.log("useLotteryData: Contract or provider not available for fetching data.");
      setIsLoadingData(false); // 确保在没有合约或提供者时停止加载
      return;
    }

    setIsLoadingData(true);
    try {
      console.log("Hook: Fetching all contract data...");

      // 1. 获取基础彩票信息
      const price = await contract.ticketPrice();
      setTicketPrice(ethers.formatEther(price));

      const pool = await contract.getPrizePool();
      setPrizePool(ethers.formatEther(pool));

      const status = await contract.getLotteryStatus(); // 使用 getLotteryStatus
      setLotteryStatus(status);

      const contractOwner = await contract.owner();
      setOwner(contractOwner);

      const pickingInProgress = await contract.isWinnerPickingInProgress();
      setIsWinnerPickingInProgress(pickingInProgress);

      const playerList = await contract.getPlayers();
      setPlayers(playerList);

      // 2. 获取奖品等级配置
      const tierCountBigInt = await contract.getPrizeTierConfigurationCount();
      const tierCount = Number(tierCountBigInt);
      const fetchedTiers = [];
      if (tierCount > 0) {
        for (let i = 0; i < tierCount; i++) {
          const config = await contract.getPrizeTierConfig(i);
          fetchedTiers.push({
            percentage: Number(config.percentage),
            count: Number(config.count),
          });
        }
      }
      setPrizeTiers(fetchedTiers);

      // 3. 获取最近一期开奖结果
      const fetchedLastDrawResults = [];
      if (tierCount > 0) { // 只有在配置了等级后才查询
        for (let i = 0; i < tierCount; i++) {
          const winnersArray = await contract.getLastDrawTierWinners(i);
          const prizePerWinnerBigInt = await contract.getLastDrawTierPrizePerWinner(i);
          fetchedLastDrawResults.push({
            tierIndex: i,
            winners: winnersArray,
            prizePerWinner: ethers.formatEther(prizePerWinnerBigInt),
          });
        }
      }
      setLastDrawResults(fetchedLastDrawResults);

      // 4. 获取历史开奖数据 (TierWinnerPicked 事件)
      // 注意: 这部分逻辑会比较复杂，如果事件量大，需要优化
      const latestBlock = await provider.getBlockNumber();
      const filter = contract.filters.TierWinnerPicked(); // 使用新的事件
      let allTierWinnerEvents = [];
      const blockRangeLimit = 1000;
      let fromBlock = Math.max(0, latestBlock - (blockRangeLimit * 20)); // 查询最近20个范围，可调整

      for (let i = latestBlock; i > fromBlock; i -= blockRangeLimit) {
        const toBlockQuery = i;
        const fromBlockQuery = Math.max(fromBlock, i - blockRangeLimit + 1);
        if (fromBlockQuery > toBlockQuery) break;
        try {
          // console.log(`Querying TierWinnerPicked events from block ${fromBlockQuery} to ${toBlockQuery}`);
          const chunkEvents = await contract.queryFilter(filter, fromBlockQuery, toBlockQuery);
          allTierWinnerEvents = allTierWinnerEvents.concat(chunkEvents);
        } catch (chunkError) {
          console.error(`Error querying TierWinnerPicked event chunk from ${fromBlockQuery} to ${toBlockQuery}:`, chunkError);
          // 根据需要处理错误，例如部分加载或中断
          if (chunkError.message && chunkError.message.includes("query returned more than 10000 results")) {
            console.warn("Query range too large for TierWinnerPicked, consider reducing blockRangeLimit or total depth.");
          }
          break;
        }
        if (fromBlockQuery === fromBlock) break;
      }

      // 简单处理历史事件：按区块号和请求ID（如果需要更精细的分组）
      // 这里我们先简单地将所有 TierWinnerPicked 事件按区块号排序
      const processedHistoricalDraws = allTierWinnerEvents.map(event => ({
        requestId: event.args.requestId.toString(),
        tierIndex: Number(event.args.tierIndex),
        winner: event.args.winner,
        prizeAmount: ethers.formatEther(event.args.prizeAmount),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      })).sort((a, b) => b.blockNumber - a.blockNumber); // 最新的在前
      setHistoricalDraws(processedHistoricalDraws);

      console.log("Hook: Fetched all contract data successfully.");

    } catch (error) {
      console.error("Hook: 获取合约数据失败:", error);
      let friendlyMessage = `获取彩票数据失败: ${error.message || '未知错误'}`;
      if (error.code === 'CALL_EXCEPTION') {
        friendlyMessage = "调用合约函数失败，请检查网络或合约状态。";
      }
      showNotification(friendlyMessage, "error");
    } finally {
      setIsLoadingData(false);
    }
  }, [contract, provider, showNotification]); // provider is a dependency for getBlockNumber

  // Initial fetch and refetch when contract changes
  useEffect(() => {
    if (contract && provider) {
      console.log("useLotteryData: Initial data fetch or contract/provider changed.");
      fetchLotteryData();
    }
  }, [contract, provider, fetchLotteryData]); // fetchLotteryData is memoized

  // Event Listeners
  useEffect(() => {
    if (!contract) return;

    console.log("Hook: Setting up event listeners...");

    const onLotteryEntered = (player, amount) => {
      console.log(`Event: LotteryEntered - Player: ${player}, Amount: ${ethers.formatEther(amount)}`);
      showNotification(`新玩家 ${player.slice(0,6)}... 加入!`, "success");
      // Optimistic update or refetch specific data
      fetchLotteryData(); // Or more targeted: fetchPlayers(), fetchPrizePool()
    };

    const onTierWinnerPicked = (requestId, tierIndex, winner, prizeAmount) => {
      console.log(`Event: TierWinnerPicked - RequestID: ${requestId}, Tier: ${tierIndex}, Winner: ${winner}, Prize: ${ethers.formatEther(prizeAmount)}`);
      // This event fires for each winner.
      // You might want to update a temporary "current draw progress" state here.
      // For simplicity, we'll rely on AllWinnersDistributed to refresh the final state.
    };

    const onAllWinnersDistributed = (requestId) => {
      console.log(`Event: AllWinnersDistributed - RequestID: ${requestId}`);
      showNotification("开奖完成！奖金已分配。", "success");
      fetchLotteryData(); // Refresh all data, especially lastDrawResults and lotteryStatus
    };

    const onLotteryReset = (requestId) => {
      console.log(`Event: LotteryReset - RequestID: ${requestId}`);
      showNotification("彩票已重置，可以开始新一轮。", "info");
      fetchLotteryData(); // Refresh all data
    };

    const onPrizeConfigurationSet = (totalTiers, totalWinners) => {
      console.log(`Event: PrizeConfigurationSet - Tiers: ${totalTiers}, Total Winners: ${totalWinners}`);
      showNotification("奖品等级配置已更新。", "info");
      fetchLotteryData(); // Refresh prizeTiers and related info
    };

    contract.on("LotteryEntered", onLotteryEntered);
    contract.on("TierWinnerPicked", onTierWinnerPicked);
    contract.on("AllWinnersDistributed", onAllWinnersDistributed);
    contract.on("LotteryReset", onLotteryReset);
    contract.on("PrizeConfigurationSet", onPrizeConfigurationSet);

    return () => {
      console.log("Hook: Cleaning up event listeners...");
      contract.off("LotteryEntered", onLotteryEntered);
      contract.off("TierWinnerPicked", onTierWinnerPicked);
      contract.off("AllWinnersDistributed", onAllWinnersDistributed);
      contract.off("LotteryReset", onLotteryReset);
      contract.off("PrizeConfigurationSet", onPrizeConfigurationSet);
    };
  }, [contract, showNotification, fetchLotteryData]); // fetchLotteryData is a dependency if used inside listeners

  return {
    // Existing
    ticketPrice,
    prizePool,
    lotteryStatus,
    owner,
    players,
    isLoadingData,
    // New
    prizeTiers,
    lastDrawResults,
    isWinnerPickingInProgress,
    historicalDraws, // This now contains TierWinnerPicked event data
    // Actions
    refreshLotteryData: fetchLotteryData, // Expose a manual refresh function
    // Setters (if needed for optimistic updates, though generally prefer refetching)
    // setPlayers,
    // setLotteryStatus,
    // setPrizePool,
  };
}