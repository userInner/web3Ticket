import React, { useState, useEffect, useCallback, useRef } from 'react'; // Import React and useRef
import { ethers } from 'ethers';
import { useAppContext } from '../context/AppContext'; // 假设 AppContext 在这里可用
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react';
import { useWeb3Modal, useWeb3ModalAccount, useWeb3ModalProvider, useDisconnect } from '@web3modal/ethers/react';

// 1. Get projectId from https://cloud.walletconnect.com
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
if (!projectId) {
  console.error("VITE_WALLETCONNECT_PROJECT_ID is not set. Please set it in your .env file.");
  // alert("WalletConnect Project ID is not configured. Please contact support.");
}

// 2. Set chains
// Define your chains here. Make sure the RPC URLs are reliable.
const sepolia = {
  chainId: 11155111,
  name: 'Sepolia',
  currency: 'ETH',
  explorerUrl: 'https://sepolia.etherscan.io',
  rpcUrl: import.meta.env.VITE_RPC_URL // Example, use your preferred RPC
};

const mainnet = {
  chainId: 1,
  name: 'Ethereum',
  currency: 'ETH',
  explorerUrl: 'https://etherscan.io',
  rpcUrl: 'https://cloudflare-eth.com' // Example, use your preferred RPC
};

// 3. Create modal
const metadata = {
  name: 'Web3Ticket',
  description: 'Decentralized Lottery Application',
  url: window.location.origin, // or your domain
  icons: [`${window.location.origin}/logo.svg`] // Replace with your actual logo path
};

if (projectId) {
  createWeb3Modal({
    ethersConfig: defaultConfig({ metadata }),
    chains: [sepolia, mainnet], // Add or remove chains as needed
    projectId,
    enableAnalytics: true // Optional - defaults to your Cloud configuration
  });
}

export function useWallet() {
  const { showNotification } = useAppContext(); // 从 Context 获取 showNotification
  const [currentAccount, setCurrentAccount] = useState(null);
  const isConnectedRef = useRef(false);
  const previousChainIdRef = useRef(); // Initialize useRef at the top level
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const { open } = useWeb3Modal();
  const { address, chainId, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const { disconnect: w3mDisconnect } = useDisconnect();

  const connectWallet = useCallback(async () => {
    if (!projectId) {
      showNotification("WalletConnect 未配置，无法连接钱包。", "error");
      return;
    }
    await open(); // This will open the Web3Modal
  }, [open, showNotification]);

  const disconnectWallet = useCallback(() => {
    if (isConnected) {
      console.log("useWallet: Disconnecting wallet via Web3Modal...");
      w3mDisconnect(); // Trigger Web3Modal's disconnect
      // isConnectedRef.current 会在下面的 useEffect 中根据 isConnected 状态更新
      // 本地的状态重置也会在下面的 useEffect 中处理
    } else {
      console.log("useWallet: Wallet already disconnected or not connected.");
      // 确保本地状态也是断开的，以防万一
      setCurrentAccount(null);
      setProvider(null);
      setSigner(null);
      isConnectedRef.current = false;
    }
  }, [isConnected, w3mDisconnect]);

  // Effect to handle wallet connection state from Web3Modal
  useEffect(() => {
    if (isConnected && address && walletProvider) {
     // 仅当连接状态从 false 变为 true 时才执行初始化和通知
      if (!isConnectedRef.current) {
        setCurrentAccount(address);
        const ethersProvider = new ethers.BrowserProvider(walletProvider);
        setProvider(ethersProvider);
        ethersProvider.getSigner().then(web3Signer => {
          setSigner(web3Signer);
          showNotification(`钱包已连接: ${address.substring(0, 6)}... (链: ${chainId})`, "success");
        }).catch(err => {
          console.error("获取 signer 失败:", err);
          showNotification("获取钱包签名者失败。", "error");
          // 如果获取 signer 失败，重置状态
          setCurrentAccount(null);
          setProvider(null);
          setSigner(null);
        });
        isConnectedRef.current = true; // 更新 ref 状态为已连接
      } else {
        // 如果已经连接，但 address/chainId/walletProvider 变化了 (例如切换账户或网络)
        // Web3Modal 的 hooks 会自动更新 address/chainId。
        // 此时我们只需要确保本地状态同步即可，可能不需要重新获取 signer/provider 实例
        // 除非 Web3Modal 的 provider 实例本身变化了 (walletProvider)
        // 对于 ethers v6 + Web3Modal v3，通常 walletProvider 在连接稳定后是稳定的
        setCurrentAccount(address); // 确保账户是最新的
        // provider 和 signer 通常不需要在这里重新设置，除非 walletProvider 变化
      }
    } else {
      // 处理断开连接或初始状态
      if (isConnectedRef.current) { // 仅当连接状态从 true 变为 false 时才通知断开
        showNotification("钱包已断开。", "info");
      }
      // 总是重置本地状态
      setCurrentAccount(null);
      setProvider(null);
      setSigner(null);
      isConnectedRef.current = false; // 确保 ref 状态为未连接
    }
    // 注意：chainId 的变化由第二个 useEffect 处理通知
  }, [isConnected, address, chainId, walletProvider, showNotification]); // 依赖项保持不变，但内部逻辑更精确
  
  // Effect to handle chainId changes specifically for notification
  useEffect(() => {
    // 使用 previousChainIdRef 来检测 chainId 是否真正发生了变化
    if (chainId && previousChainIdRef.current && chainId !== previousChainIdRef.current) {
        showNotification(`网络已切换至 Chain ID: ${chainId}. 请确保应用支持此网络。`, "warning", 7000);
      }
    // 总是更新 ref 的当前值，以便下次比较
    previousChainIdRef.current = chainId;
  }, [chainId, showNotification]); // 依赖 chainId 和 showNotification

  // 确保 provider 和 signer 在断开连接时被清除
  useEffect(() => {
    if (!isConnected) {
      // Web3Modal 的 disconnect 已经处理了大部分，这里是确保本地状态同步
      setCurrentAccount(null);
      setProvider(null);
      setSigner(null);
    }
  }, [isConnected]); // 仅在 isConnected 变化时触发
  return { currentAccount, provider, signer, connectWallet, disconnectWallet, setCurrentAccount, setProvider, setSigner };
}