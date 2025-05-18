import { useEffect } from 'react';
import { ethers } from 'ethers';
import { useAppContext } from '../context/AppContext';
import { VStack, Text } from '@chakra-ui/react'; 

export function useContractEvents(contract, fetchContractData, fetchPlayers, fetchHistoricalWinners, requestWinnerToastIdRef, toast) {
  const { showNotification } = useAppContext();

  useEffect(() => {
    if (!contract) return;

    const onLotteryEntered = (player, amount, event) => {
      console.log("Hook Event: LotteryEntered", { player, amount: ethers.formatEther(amount) });
      showNotification(`玩家 ${player.slice(0, 6)}...${player.slice(-4)} 已成功参与!`, "success");
      if (fetchContractData) fetchContractData(contract);
      if (fetchPlayers) fetchPlayers(contract);
    };

    const onWinnerPicked = (winner, amountWon, event) => {
      console.log("Hook Event: WinnerPicked", { winner, amountWon: ethers.formatEther(amountWon) });
      // showNotification(`🎉 恭喜中奖者: ${winner.slice(0,6)}...${winner.slice(-4)}! 赢得 ${ethers.formatEther(amountWon)} ETH!`, "success", 10000);
      toast.close(requestWinnerToastIdRef.current);
      if (fetchContractData) fetchContractData(contract);
      if (fetchPlayers) fetchPlayers(contract); // Players list should be empty or reset
      if (fetchHistoricalWinners) fetchHistoricalWinners(contract);
    };

    contract.on("LotteryEntered", onLotteryEntered);
    contract.on("WinnerPicked", onWinnerPicked);

    return () => {
      contract.off("LotteryEntered", onLotteryEntered);
      contract.off("WinnerPicked", onWinnerPicked);
    };
  }, [contract, fetchContractData, fetchPlayers, fetchHistoricalWinners, showNotification]);
}