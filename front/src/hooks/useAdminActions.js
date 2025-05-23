// src/hooks/useAdminActions.js
import { useState, useRef } from 'react';
import { ethers } from 'ethers';
import { useToast } from '@chakra-ui/react';

export function useAdminActions(
  contract,
  showNotification,
  fetchContractData,
  isOwnerConnected, // To check if the current user is the owner
  lotteryStatus,    // To check if lottery is open/closed
  players,          // To check if there are players before picking a winner
  currentPrizeTierConfigCount // To know if prize tiers are already set
) {
  const [isLoading, setIsLoading] = useState(false);
  const [newAdminTicketPrice, setNewAdminTicketPrice] = useState("");
  const requestWinnerToastIdRef = useRef(null);
  const toast = useToast();

  const handleGenericAdminTx = async (txFunction, successMsg, errorMsgBase) => {
    if (!contract) {
      showNotification("合约未初始化。", "error");
      return;
    }
    setIsLoading(true);
    try {
      const tx = await txFunction();
      showNotification(`正在处理操作: ${tx.hash}...`, "info");
      await tx.wait();
      showNotification(successMsg, "success");
      if (fetchContractData) {
        fetchContractData(contract); // Refresh contract data
      }
      // Potentially refresh other data like players if relevant
    } catch (error) {
      console.error(`${errorMsgBase}失败:`, error);
      let friendlyErrorMessage = `${errorMsgBase}失败: ${error.message || '未知错误'}`;
      if (error.code === 4001) {
        showNotification("您已取消交易。", "error");
      }  else if (error.reason) {
        if (error.reason.includes("Currently picking a winner")) {
          friendlyErrorMessage = "操作失败：正在等待上一轮开奖结果 (VRF请求进行中)，请稍后再试。";
        } else {
          friendlyErrorMessage = `${errorMsgBase}失败: ${error.reason}`;
        }
      } else if (error.data?.message) {
        friendlyErrorMessage = `${errorMsgBase}失败: ${error.data.message.includes("Currently picking a winner") ? "正在等待上一轮开奖结果 (VRF请求进行中)，请稍后再试。" : error.data.message}`;
      }
      showNotification(friendlyErrorMessage, "error");
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
    if (!contract || !isOwnerConnected || !lotteryStatus || !players || players.length === 0) {
      showNotification("无法抽取中奖者：条件不满足。", "warning");
      if (requestWinnerToastIdRef.current && toast.isActive(requestWinnerToastIdRef.current)) {
        toast.close(requestWinnerToastIdRef.current);
      }
      return;
    }
    setIsLoading(true);
    // 关闭可能存在的旧toast
    if (requestWinnerToastIdRef.current && toast.isActive(requestWinnerToastIdRef.current)) {
      toast.close(requestWinnerToastIdRef.current);
    }
    // 发起请求时的初始Toast
    requestWinnerToastIdRef.current = toast({
      title: "开奖请求已发送",
      description: `正在等待 ${contract.s_requestConfirmations ? await contract.s_requestConfirmations() : '3'} 个区块确认...`, // 从合约读取确认数
      status: "info", // 使用 info 状态
      duration: 10000, // 持续一段时间，或者直到被事件更新
      isClosable: true,
      position: "top",
    });
    try {
      const tx = await contract.requestWinner();
      await tx.wait();
    } catch (error) {
      console.error("抽取中奖者失败:", error);
      const errorMessageText = error.reason || error.data?.message || error.message || '未知错误';
      showNotification(`抽取中奖者失败: ${errorMessageText}`, "danger");
      if (requestWinnerToastIdRef.current && toast.isActive(requestWinnerToastIdRef.current)) {
        toast.close(requestWinnerToastIdRef.current);
        requestWinnerToastIdRef.current = null;
      }
    } finally {
      // 注意：这里的 setIsLoading(false) 会在交易被打包后立即执行。
      // 真正的“加载完成”应该由 VRF 回调后的事件来驱动 isWinnerPickingInProgress 状态的改变。
      // AdminPanel 的按钮禁用逻辑应更多地依赖 isWinnerPickingInProgress。
      // 但为了防止按钮在VRF回调前被重复点击，这里的isLoading可以暂时保留，
      // 或者完全依赖 isWinnerPickingInProgress。
      // 为简单起见，暂时保留，但强调 isWinnerPickingInProgress 的重要性。
      setIsLoading(false); 
    }
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
    setNewAdminTicketPrice("");
  };

  // Modified to accept prizeTiersInput as an argument
  const handleSetPrizeConfiguration = async (currentPrizeTiersInput) => {
    if (lotteryStatus || (players && players.length > 0)) {
      showNotification("无法设置奖品等级：彩票已开启或已有玩家参与。请等待本轮结束后再试。", "error");
      return;
    }
    const percentages = currentPrizeTiersInput.map(tier => parseInt(tier.percentage, 10));
    const counts = currentPrizeTiersInput.map(tier => parseInt(tier.count, 10));

    if (percentages.some(isNaN) || counts.some(isNaN) || percentages.some(p => p <= 0 || p > 100) || counts.some(c => c <= 0)) {
      showNotification("请输入有效的奖品等级百分比 (1-100) 和获奖人数 (>0)。", "error");
      return;
    }
    if (percentages.reduce((sum, p) => sum + p, 0) > 100) {
      showNotification("总百分比不能超过100%。", "error");
      return;
    }

    await handleGenericAdminTx(
      () => contract.setPrizeConfiguration(percentages, counts),
      "奖品等级配置已成功设置！",
      "设置奖品等级配置"
    );
    // Optionally reset input fields after successful submission or let user see what was set
    // setPrizeTiersInput([{ percentage: '', count: '' }]);
  };

  return {
    isLoadingAdminAction: isLoading, // Renamed to avoid conflict with App's isLoading
    newAdminTicketPrice,
    setNewAdminTicketPrice,
    handleOpenLottery,
    handlePickWinner,
    handleSetTicketPrice,
    handleSetPrizeConfiguration,
    requestWinnerToastIdRef, // Expose ref if App.jsx needs to interact with it (e.g., close on WinnerPicked event)
  };
}