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
  isPickingWinner, // 接收 isWinnerPickingInProgress
  // Props for Prize Configuration Modal to pass to AdminPanel
  openPrizeConfigModal,
  isPrizeConfigModalOpen,
  setIsPrizeConfigModalOpen,
  modalPrizeTiersInput,
  handleAddModalPrizeTierInput,
  handleRemoveModalPrizeTierInput,
  handleModalPrizeTierInputChange,
  handleSubmitPrizeConfigurationFromModal,
  // Display current contract config
  currentPrizeTiers,
  currentPrizeTierConfigCount, // This comes from App.jsx (derived from useLotteryData)
  currentAccount, // To check if wallet is connected
}) {
  return (
    <VStack spacing={{ base: '6', md: '8' }} align="stretch" w="100%">
      {!currentAccount ? (
        <Text textAlign="center" py={10}>请先连接钱包。</Text>
      ) : !isOwnerConnected ? (
        <Text textAlign="center" py={10}>抱歉，只有合约拥有者才能访问此页面。</Text>
      ) : (
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
          isPickingWinner={isPickingWinner} // 传递给 AdminPanel
          // Pass Prize Config Modal props
          openPrizeConfigModal={openPrizeConfigModal}
          isPrizeConfigModalOpen={isPrizeConfigModalOpen}
          setIsPrizeConfigModalOpen={setIsPrizeConfigModalOpen}
          modalPrizeTiersInput={modalPrizeTiersInput}
          handleAddModalPrizeTierInput={handleAddModalPrizeTierInput}
          handleRemoveModalPrizeTierInput={handleRemoveModalPrizeTierInput}
          handleModalPrizeTierInputChange={handleModalPrizeTierInputChange}
          handleSubmitPrizeConfigurationFromModal={handleSubmitPrizeConfigurationFromModal}
          // Display current contract config
          currentPrizeTiers={currentPrizeTiers}
          currentPrizeTierConfigCount={currentPrizeTierConfigCount} // Pass it down
        />
      )}
    </VStack>
  );
}

export default AdminPage;