import React from 'react';
import { useAppContext } from '../context/AppContext'; // 导入 useAppContext

function Footer({ lotteryContractAddress }) { // 移除 shortenAddress from props
  const { shortenAddress } = useAppContext(); // 从 Context 获取 shortenAddress
  return (
    <footer>
      <p>去中心化彩票 DApp</p>
      <p>© {new Date().getFullYear()}</p>
      <p>由 [CryptoCG] 开发</p>
      <p>使用 Ethers.js 和 React 构建</p>
      {lotteryContractAddress && (
       <p>
          合约地址: {lotteryContractAddress}
        </p>
      )}
    </footer>
  );
}

export default Footer;