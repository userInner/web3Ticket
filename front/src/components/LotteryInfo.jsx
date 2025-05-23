import React from 'react';
import { Box, Heading, Text, Button, VStack, useColorModeValue, Divider, Spinner } from '@chakra-ui/react';
import { useAppContext } from '../context/AppContext';

function LotteryInfo({
  owner,
  ticketPrice,
  prizePool,
  lotteryStatus,
  isLoading,
  fetchContractData,
  contract
}) {
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.700', 'whiteAlpha.900');

    return (
   <Box p="6" bg={cardBg} borderRadius="xl" boxShadow="lg" w="100%">
      <VStack spacing="4" align="stretch">
        <Heading as="h2" size="lg" color={headingColor} textAlign="center" mb="2">
          彩票信息
        </Heading>
       <Divider />
        <Text fontSize="md" color={textColor}><strong>彩票价格:</strong> {ticketPrice} ETH</Text>
        <Text fontSize="md" color={textColor}><strong>当前奖池:</strong> {prizePool} ETH</Text>
        <Text fontSize="md" color={textColor}><strong>彩票状态:</strong> 
          <Text as="span" fontWeight="bold" color={lotteryStatus ? 'green.400' : 'red.400'}>
            {lotteryStatus ? " 开放购买" : " 已关闭"}
          </Text>
        </Text>
        <Button onClick={() => fetchContractData(contract)} isLoading={isLoading} loadingText="刷新中" variant="outline" colorScheme="brand" isDisabled={!contract}>
          刷新彩票信息
        </Button>
      </VStack>
    </Box>
  );
}

export default LotteryInfo;