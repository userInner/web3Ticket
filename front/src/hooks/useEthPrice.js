// d:\project\Front\github\web3Ticket\front\src\hooks\useEthPrice.js
import { useState, useEffect, useCallback } from 'react';

const CRYPTO_PRICE_API_URL = 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USDT'; // 使用 CryptoCompare
// 或者 Binance: 'https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT';

export function useEthPrice(refreshInterval = 60000) { // 默认每60秒刷新一次
  const [ethToUsdtPrice, setEthToUsdtPrice] = useState(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [priceError, setPriceError] = useState(null);

  const fetchPrice = useCallback(async () => {
    setIsLoadingPrice(true);
    setPriceError(null);
    try {
      const response = await fetch(CRYPTO_PRICE_API_URL);
      if (!response.ok) {
        throw new Error(`Crypto Price API request failed with status ${response.status}`);
      }
      const data = await response.json();
      console.log('CoinGecko API Response:', JSON.stringify(data, null, 2)); // Log the full response

      // 根据选择的 API 调整数据提取逻辑
      // 示例: CryptoCompare (fsym=ETH&tsyms=USDT) 返回 {"USDT": price}
      if (data && typeof data.USDT !== 'undefined') {
        setEthToUsdtPrice(data.USDT);
      // 示例: Binance (symbol=ETHUSDT) 返回 {"symbol":"ETHUSDT","price":"3000.50"}
      // } else if (data && data.price && data.symbol === 'ETHUSDT') {
      //   setEthToUsdtPrice(parseFloat(data.price));
      } else {
        // More specific error logging
        if (!data) console.error("CoinGecko API returned no data.");
        // 根据 API 调整这里的错误判断
        else if (typeof data.USDT === 'undefined' /* && (for Binance) typeof data.price === 'undefined' */) {
            console.error("API data does not contain expected price key (e.g., USDT or price). Data:", data);
        }
        
        throw new Error('Invalid data format from Crypto Price API');
      }
    } catch (error) {
      console.error("Failed to fetch ETH price:", error);
      setPriceError(error.message);
      setEthToUsdtPrice(null); // Reset price on error
    } finally {
      setIsLoadingPrice(false);
    }
  }, []);

  useEffect(() => {
    fetchPrice(); // Initial fetch
    const intervalId = setInterval(fetchPrice, refreshInterval);
    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [fetchPrice, refreshInterval]);

  return { ethToUsdtPrice, isLoadingPrice, priceError, refreshEthPrice: fetchPrice };
}
