import React from 'react';
import { Box, Button, Heading, VStack, useColorModeValue, Text, useColorMode } from '@chakra-ui/react';

function PurchaseTicket({ lotteryStatus, handleEnterLottery, isLoading }) {
    const cardBg = useColorModeValue('white', 'gray.700');
    const headingColor = useColorModeValue('gray.700', 'whiteAlpha.900');
    const { colorMode } = useColorMode(); // 获取当前颜色模式

    if (!lotteryStatus) {
        return (
            <Box p="6" bg={useColorModeValue('gray.50', 'gray.750')} borderRadius="xl" boxShadow="md" w="100%" textAlign="center">
                <Text color={useColorModeValue('gray.500', 'gray.400')}>当前彩票未开放购买。</Text>
            </Box>
        );
    }

  return (
    <Box p="6" bg={cardBg} borderRadius="xl" boxShadow="lg" w="100%">
        <VStack spacing="4">
            <Heading as="h3" size="md" color={headingColor}>参与抽奖</Heading>
            <Button 
                onClick={handleEnterLottery} 
                isLoading={isLoading} 
                loadingText="处理中..." 
                colorScheme="brand" 
                size="lg" 
                w="full" 
                variant={colorMode === 'dark' ? 'neon' : 'solid'} // 根据颜色模式选择变体
            >
                购买彩票
            </Button>
        </VStack>
    </Box>
  );
}

export default PurchaseTicket;