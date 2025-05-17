import React from 'react';
import { useAppContext } from '../context/AppContext';
function HistoricalWinners({ historicalWinners }) {
  const { shortenAddress } = useAppContext();
  if (historicalWinners.length === 0) {
    return null; // Don't show if no historical winners
  }

  return (
    <div className="historical-winners">
      <h3>历史中奖记录</h3>
      <ul>
        {historicalWinners.map((winnerInfo, index) => (
          <li key={index}>
            区块 {winnerInfo.blockNumber}: {winnerInfo.address} 赢得 {winnerInfo.amount} ETH (Tx:{' '}
           <a href={`https://holesky.etherscan.io/tx/${winnerInfo.transactionHash}`} target="_blank" rel="noopener noreferrer">{winnerInfo.transactionHash}</a>
            )
          </li>
        ))}
      </ul>
    </div>
  );
}

export default HistoricalWinners;