import React from 'react';
import { Box, Heading, Text, Button, VStack, useColorModeValue, Divider, Spinner, HStack, Input, Tooltip } from '@chakra-ui/react';
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
  isPickingWinner, // Added this prop in previous steps
}) {
  const cardBg = useColorModeValue('gray.50', 'gray.750'); // 稍有区别的背景
  const headingColor = useColorModeValue('gray.700', 'whiteAlpha.900');
  const inputBg = useColorModeValue('white', 'gray.600');
  const inputBorderColor = useColorModeValue('gray.300', 'gray.500');
  // const toast = useToast(); // AdminPanel should not directly use toast, notifications are handled by App/hooks
  if (!isOwnerConnected) {
    return null; // Don't show if not owner
  }

  return (
   <Box p="6" bg={cardBg} borderRadius="xl" boxShadow="lg" w="100%" mt="6">
      <VStack spacing="6" align="stretch">
        <Heading as="h2" size="lg" color={headingColor} textAlign="center" mb="2">
          管理员操作
        </Heading>
        <Divider />
        <VStack spacing="4" align="stretch">
          <Tooltip
            label={isPickingWinner ? "正在等待上一轮中奖结果，请稍后再试" : ""}
            isDisabled={!isPickingWinner || !(lotteryStatus || isLoading || isPickingWinner)} // 只有在因为 isPickingWinner 禁用时才显示
            hasArrow
            placement="top"
          >
            <Box w="full"> {/* Tooltip 需要一个直接的子元素来附加，Button 可能需要包裹 */}
              <Button
                onClick={handleOpenLottery}
                isLoading={isLoading}
                isDisabled={lotteryStatus || isLoading || isPickingWinner}
                colorScheme="green"
                w="full"
              >
                {lotteryStatus ? "彩票已开启" : "开启新一轮抽奖"}
              </Button>
            </Box>
          </Tooltip>
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