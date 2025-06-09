/**
 * Parses a contract interaction error and returns a user-friendly message.
 * @param {any} error The error object from ethers.js or similar.
 * @returns {string} A user-friendly error message.
 */
export const parseContractError = (error) => {
  console.error("Parsing Contract Error:", error); // Log the full error for debugging

  if (error?.code === 4001) { // MetaMask user rejected transaction
    return "您已取消交易。";
  }
  // Ethers v6 specific for contract reverts (error.reason)
  // Ethers v5 might have error.data.message or error.message for reverts
  const revertMessage = error?.reason || error?.data?.message || error?.message;

  if (revertMessage) {
    if (revertMessage.includes("Must send exact ticket price")) {
      return "购买失败：发送的金额与票价不符。";
    } else if (revertMessage.includes("Lottery is not open")) {
      return "操作失败：彩票当前未开放。";
    } else if (revertMessage.includes("Caller is not the owner")) {
      return "操作失败：您不是合约所有者。";
    } // Add more specific revert messages here
    return `操作失败: ${revertMessage.substring(0, 100)}${revertMessage.length > 100 ? '...' : ''}`; // Truncate long messages
  }
  return "操作失败，发生未知错误。详情请查看控制台。";
};