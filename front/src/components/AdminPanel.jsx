import React from 'react';
import { Box, Button, Heading, VStack, Input, HStack, Text, useColorModeValue, Divider } from '@chakra-ui/react';

function AdminPanel({
  isOwnerConnected,
  isLoading,
  lotteryStatus,
  players,
  handleOpenLottery,
  handlePickWinner,
  newAdminTicketPrice,
  setNewAdminTicketPrice,
  handleSetTicketPrice,
}) {
  const cardBg = useColorModeValue('gray.50', 'gray.750'); // 稍有区别的背景
  const headingColor = useColorModeValue('gray.700', 'whiteAlpha.900');
  const inputBg = useColorModeValue('white', 'gray.600');
  const inputBorderColor = useColorModeValue('gray.300', 'gray.500');
  if (!isOwnerConnected) {
    return null; // Don't show if not owner
  }

  return (
   <Box p="6" bg={cardBg} borderRadius="xl" boxShadow="lg" w="100%" mt="6">
      <VStack spacing="6" align="stretch">
        <Heading as="h2" size="lg" color={headingColor} textAlign="center">
          管理员操作
        </Heading>
        <Divider />
        <VStack spacing="4">
          <Button onClick={handleOpenLottery} isLoading={isLoading} isDisabled={lotteryStatus} colorScheme="green" w="full">
            {lotteryStatus ? "彩票已开启" : "开启新一轮抽奖"}
          </Button>
          <Button
            onClick={handlePickWinner}
            isLoading={isLoading}
            isDisabled={!lotteryStatus || players.length === 0}
            colorScheme="purple"
            w="full"
          >
            抽取中奖者
          </Button>
        </VStack>
        <VStack spacing="3" align="stretch">
            <Text fontWeight="medium" color={headingColor}>设置票价:</Text>
            <HStack>
                <Input
                    type="number" // 更适合输入数字
                    value={newAdminTicketPrice}
                    onChange={(e) => setNewAdminTicketPrice(e.target.value)}
                    placeholder="新票价 (ETH)"
                    isDisabled={isLoading}
                    bg={inputBg}
                    borderColor={inputBorderColor}
                />
                <Button onClick={handleSetTicketPrice} isLoading={isLoading} colorScheme="blue" isDisabled={isLoading || lotteryStatus}>
                    设置
                </Button>
            </HStack>
        </VStack>
      </VStack>
    </Box>
  );
}

export default AdminPanel;