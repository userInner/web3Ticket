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
  players           // To check if there are players before picking a winner
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
    if (requestWinnerToastIdRef.current && toast.isActive(requestWinnerToastIdRef.current)) {
      toast.close(requestWinnerToastIdRef.current);
    }
    requestWinnerToastIdRef.current = toast({
      title: "正在抽取中奖者",
      description: "已发送请求，正在等待链上随机数...",
      status: "loading",
      duration: null,
      isClosable: false,
      position: "top",
    });
    try {
      const tx = await contract.requestWinner();
      showNotification("抽取中奖者请求已发送，等待VRF回调...", "info", 10000);
      await tx.wait();
    } catch (error) {
      console.error("抽取中奖者失败:", error);
      const errorMessageText = error.reason || error.data?.message || error.message || '未知错误';
      showNotification(`抽取中奖者失败: ${errorMessageText}`, "danger");
      if (requestWinnerToastIdRef.current && toast.isActive(requestWinnerToastIdRef.current)) {
        toast.close(requestWinnerToastIdRef.current);
      }
    } finally {
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

  return {
    isLoadingAdminAction: isLoading, // Renamed to avoid conflict with App's isLoading
    newAdminTicketPrice,
    setNewAdminTicketPrice,
    handleOpenLottery,
    handlePickWinner,
    handleSetTicketPrice,
    requestWinnerToastIdRef, // Expose ref if App.jsx needs to interact with it (e.g., close on WinnerPicked event)
  };
}