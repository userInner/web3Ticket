import { useEffect } from 'react';
import { ethers } from 'ethers';
import { useAppContext } from '../context/AppContext';

export function useContractEvents(
  contract,
  refreshLotteryData,
  requestWinnerToastIdRef,
  toast
) {
  const { showNotification } = useAppContext();

  useEffect(() => {
    if (!contract) return;

    const onLotteryEntered = (player, amount, event) => {
      console.log(`Event: LotteryEntered - Player: ${player}, Amount: ${ethers.formatEther(amount)}`);
      showNotification(`新玩家 ${player.slice(0, 6)}... 加入!`, "success");
      if (refreshLotteryData) refreshLotteryData();
    };

    const onTierWinnerPicked = (requestId, tierIndex, winner, prizeAmount) => {
      console.log(`Event: TierWinnerPicked - RequestID: ${requestId}, Tier: ${tierIndex}, Winner: ${winner}, Prize: ${ethers.formatEther(prizeAmount)}`);
      // This event fires for each winner in each tier.
      // You might show a less prominent notification here or wait for AllWinnersDistributed.
      // For now, we'll let AllWinnersDistributed handle the main notification.
      // refreshLotteryData(); // Could refresh here, but might be too frequent.
    };

    const onAllWinnersDistributed = (requestId) => {
      console.log(`Event: AllWinnersDistributed - RequestID: ${requestId}`);
      showNotification("开奖完成！所有奖金已分配。", "success");
       if (requestWinnerToastIdRef.current) {
         toast.update(requestWinnerToastIdRef.current, {
           title: "开奖完成!",
           description: `所有奖金已分配 (请求ID: ${requestId.toString()}).`,
           status: "success",
           duration: 7000,
           isClosable: true,
         });
         requestWinnerToastIdRef.current = null; // Reset the ref
       }
       if (refreshLotteryData) refreshLotteryData(); // Ensure refreshLotteryData is called
    };

    const onLotteryReset = (requestId) => {
      console.log(`Event: LotteryReset - RequestID: ${requestId}`);
      showNotification("彩票已重置，可以开始新一轮。", "info");
      if (refreshLotteryData) refreshLotteryData();
    }

    const onPrizeConfigurationSet = (totalTiers, totalWinners) => {
      console.log(`Event: PrizeConfigurationSet - Tiers: ${totalTiers.toString()}, Total Winners: ${totalWinners.toString()}`);
      showNotification("奖品等级配置已更新。", "info");
      if (refreshLotteryData) refreshLotteryData();
    };

    contract.on("LotteryEntered", onLotteryEntered);
    contract.on("TierWinnerPicked", onTierWinnerPicked);
    contract.on("AllWinnersDistributed", onAllWinnersDistributed);
    contract.on("LotteryReset", onLotteryReset);
    contract.on("PrizeConfigurationSet", onPrizeConfigurationSet);

    return () => {
      console.log("useContractEvents: Cleaning up event listeners...");
      contract.off("LotteryEntered", onLotteryEntered);
      contract.off("TierWinnerPicked", onTierWinnerPicked);
      contract.off("AllWinnersDistributed", onAllWinnersDistributed);
      contract.off("LotteryReset", onLotteryReset);
      contract.off("PrizeConfigurationSet", onPrizeConfigurationSet);
    };
  }, [contract, refreshLotteryData, requestWinnerToastIdRef, requestWinnerToastIdRef, toast, showNotification]); // Added requestWinnerToastIdRef and toast as dependencies
}