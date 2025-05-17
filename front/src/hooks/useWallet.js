import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAppContext } from '../context/AppContext'; // 假设 AppContext 在这里可用

export function useWallet() {
  const { showNotification } = useAppContext(); // 从 Context 获取 showNotification
  const [currentAccount, setCurrentAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) {
        showNotification("请安装 MetaMask 浏览器插件!", "error");
        return;
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setCurrentAccount(accounts[0]);
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(web3Provider);
        const web3Signer = await web3Provider.getSigner();
        setSigner(web3Signer);
        showNotification(`钱包已连接: ${accounts[0].substring(0, 6)}...`, "success");
      } else {
        showNotification("没有找到授权账户。", "error");
      }
    } catch (error) {
      console.error("连接钱包失败:", error);
      showNotification(`连接钱包失败: ${error.message || "请检查 MetaMask 并重试。"}`, "error");
    }
  }, [showNotification]);

  const disconnectWallet = useCallback(() => {
    setCurrentAccount(null);
    setProvider(null);
    setSigner(null);
    // 注意：这里不直接操作 contract 状态，App.jsx 中依赖 contract 的 useEffect 会处理
    showNotification("钱包已断开。", "info");
  }, [showNotification]);

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(web3Provider);
          web3Provider.getSigner().then(setSigner);
          showNotification(`账户已切换: ${accounts[0].substring(0,6)}...`, "info");
        } else {
          disconnectWallet(); // 使用封装的断开连接函数
        }
      };

      const handleChainChanged = (_chainId) => {
        console.log("网络已更改:", _chainId);
        showNotification("网络已更改，请刷新页面或重新连接钱包以确保数据同步。", "warning", 7000);
        // 也可以选择更激进地断开连接
        disconnectWallet();
        // window.location.reload(); // 强制刷新是一种简单粗暴但有效的方式
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [showNotification, disconnectWallet]);

  return { currentAccount, provider, signer, connectWallet, disconnectWallet, setCurrentAccount, setProvider, setSigner };
}