import React from 'react';
import { VStack, Text, Heading, Box } from '@chakra-ui/react';
import AdminPanel from '../AdminPanel';

function AdminPage({
  isOwnerConnected,
  isLoading,
  lotteryStatus,
  players,
  handleOpenLottery,
  handlePickWinner,
  newAdminTicketPrice,
  setNewAdminTicketPrice,
  handleSetTicketPrice,
  currentAccount, // To check if wallet is connected
}) {
  if (!currentAccount) {
    return <Text textAlign="center">请先连接钱包。</Text>;
  }
  if (!isOwnerConnected) {
    return <Text textAlign="center">抱歉，只有合约拥有者才能访问此页面。</Text>;
  }

  return (
    <VStack spacing={{ base: '6', md: '8' }} align="stretch" w="100%">
      <AdminPanel
        isOwnerConnected={isOwnerConnected} // AdminPanel itself also checks this, but good for page level
        isLoading={isLoading}
        lotteryStatus={lotteryStatus}
        players={players}
        handleOpenLottery={handleOpenLottery}
        handlePickWinner={handlePickWinner}
        newAdminTicketPrice={newAdminTicketPrice}
        setNewAdminTicketPrice={setNewAdminTicketPrice}
        handleSetTicketPrice={handleSetTicketPrice}
      />
    </VStack>
  );
}

export default AdminPage;