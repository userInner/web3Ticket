import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAppContext } from '../context/AppContext';

export function useLotteryData(contract, provider) {
  const { showNotification } = useAppContext();

  const [ticketPrice, setTicketPrice] = useState("0");
  const [prizePool, setPrizePool] = useState("0");
  const [lotteryStatus, setLotteryStatus] = useState(false);
  const [owner, setOwner] = useState("");
  const [players, setPlayers] = useState([]);
  const [historicalWinners, setHistoricalWinners] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const fetchContractData = useCallback(async (contractInstanceOrNull) => {
    const contractToUse = contractInstanceOrNull || contract;
    if (!contractToUse) return;

    setIsLoadingData(true);
    try {
      const price = await contractToUse.ticketPrice();
      setTicketPrice(ethers.formatEther(price));

      const pool = await contractToUse.getPrizePool();
      setPrizePool(ethers.formatEther(pool));

      const status = await contractToUse.lotteryOpen();
      setLotteryStatus(status);

      const contractOwner = await contractToUse.owner();
      setOwner(contractOwner);

      console.log("Hook: Fetched contract data");
    } catch (error) {
      console.error("Hook: 获取合约数据失败:", error);
      showNotification(`获取合约数据失败: ${error.message}`, "error");
    } finally {
      setIsLoadingData(false);
    }
  }, [contract, showNotification]);

  const fetchPlayers = useCallback(async (contractInstanceOrNull) => {
    const contractToUse = contractInstanceOrNull || contract;
    if (!contractToUse) return;
    try {
      const playerList = await contractToUse.getPlayers();
      setPlayers(playerList);
      console.log("Hook: Fetched players");
    } catch (error) {
      console.error("Hook: 获取玩家列表失败:", error);
      showNotification("获取玩家列表失败。", "error");
    }
  }, [contract, showNotification]);

  const fetchHistoricalWinners = useCallback(async (contractInstanceOrNull) => {
    const contractToUse = contractInstanceOrNull || contract;
    if (!contractToUse || !provider) return;
    try {
      const latestBlock = await provider.getBlockNumber();
      const filter = contractToUse.filters.WinnerPicked();
      let allEvents = [];
      const blockRangeLimit = 1000; // 根据你的 RPC 节点调整，MetaMask 通常是 1000-2000
      // 你可能需要一个已知的大致合约部署区块号，或者一个最大回溯深度
      // const contractDeploymentBlock = 0; // 替换为你的合约部署区块号，或者一个合理的起始点
      let fromBlock = Math.max(0, latestBlock - (blockRangeLimit * 10)); // 示例：最多查最近 10 * blockRangeLimit 区块
      // 如果想查更久远，需要更复杂的循环逻辑，或者知道合约部署区块

      for (let i = latestBlock; i > fromBlock; i -= blockRangeLimit) {
        const toBlockQuery = i;
        const fromBlockQuery = Math.max(fromBlock, i - blockRangeLimit + 1);
        if (fromBlockQuery > toBlockQuery) break; // 防止无限循环或无效范围

        try {
          console.log(`Querying WinnerPicked events from block ${fromBlockQuery} to ${toBlockQuery}`);
          const chunkEvents = await contractToUse.queryFilter(filter, fromBlockQuery, toBlockQuery);
          allEvents = allEvents.concat(chunkEvents);
        } catch (chunkError) {
          console.error(`Error querying event chunk from ${fromBlockQuery} to ${toBlockQuery}:`, chunkError);
          // 可以选择在这里中断，或者跳过这个 chunk
          break; 
        }
        if (fromBlockQuery === fromBlock) break; // 到达了我们设定的最早查询点
      }
      const winnersData = allEvents.map(event => ({
          address: event.args.winner,
          amount: ethers.formatEther(event.args.prizeAmount || 0), // 使用 prizeAmount，并提供一个默认值以防万一
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
      })).sort((a, b) => b.blockNumber - a.blockNumber); // 按区块号降序排列（最新的在前）

      setHistoricalWinners(winnersData);
      console.log("Hook: Fetched historical winners");
    } catch (error) {
      console.error("Hook: 获取历史中奖者失败:", error);
      // showNotification("获取历史中奖者失败。", "error");
      if (!error.message.includes("limited to a 1000 blocks range")) { // 只对非区块范围错误提示
        showNotification("获取历史中奖者失败。", "error");
      }
    }
  }, [contract, provider, showNotification]);

  // Initial fetch and refetch when contract changes
  useEffect(() => {
    if (contract && provider) {
      console.log("useLotteryData: useEffect for players and historical winners triggered.");
      fetchPlayers(contract);
      fetchHistoricalWinners(contract);
    }
  }, [contract, provider]); // 只依赖 contract 和 provider

  useEffect(() => {
    if (contract && provider) {
      console.log("useLotteryData fetchContractData useEffect triggered."); // 添加日志
      fetchContractData(contract);
    }
  }, [contract, provider]); // 只依赖 contract 和 provider

  return { ticketPrice, prizePool, lotteryStatus, owner, players, historicalWinners, isLoadingData, fetchContractData, fetchPlayers, fetchHistoricalWinners, setPlayers, setHistoricalWinners, setLotteryStatus, setPrizePool };
}