import React from 'react';
import { VStack, Text, Box, Spinner } from '@chakra-ui/react';
import LotteryInfo from '../LotteryInfo';
import PlayerList from '../PlayerList';
import PurchaseTicket from '../PurchaseTicket';

function LotteryPage({
  contract,
  currentAccount,
  owner,
  ticketPrice,
  prizePool,
  lotteryStatus,
  isLoadingData,
  fetchContractData,
  players,
  handleEnterLottery,
  isLoading, // For purchase ticket button
}) {
  if (!contract || !currentAccount) {
    return (
      <VStack>
        <Spinner size="xl" color="brand.500" thickness="4px" />
        <Text>请先连接钱包并等待合约加载...</Text>
      </VStack>
    );
  }

  return (
    <VStack spacing={{ base: '6', md: '8' }} align="stretch" w="100%">
      <LotteryInfo
        owner={owner}
        ticketPrice={ticketPrice}
        prizePool={prizePool}
        lotteryStatus={lotteryStatus}
        isLoading={isLoadingData}
        fetchContractData={() => fetchContractData(contract)}
        contract={contract}
      />
      <PlayerList
        players={players}
        lotteryStatus={lotteryStatus}
      />
      {lotteryStatus && (
        <PurchaseTicket
          lotteryStatus={lotteryStatus}
          handleEnterLottery={handleEnterLottery}
          isLoading={isLoading}
        />
      )}
    </VStack>
  );
}

export default LotteryPage;