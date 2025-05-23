import { Tooltip, Box, Button, Heading, VStack, useColorModeValue, Text, IconButton, Icon } from '@chakra-ui/react';
// 替换 AddIcon 为一个更合适的礼物图标，例如从 react-icons 库导入:
import { FaGift } from 'react-icons/fa'; // Import a gift icon from react-icons
// import { AddIcon } from '@chakra-ui/icons'; // No longer using AddIcon as the primary icon

function PurchaseTicket({ lotteryStatus, handleEnterLottery, isLoading, isDisabled, ticketPrice }) {
    const cardBg = useColorModeValue('white', 'gray.700');
    const headingColor = useColorModeValue('gray.700', 'whiteAlpha.900');
    const textColor = useColorModeValue("gray.600", "gray.400");

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
            <Tooltip label={isDisabled ? "请先连接钱包或等待当前操作完成" : `购买一张彩票需 ${ticketPrice} ETH`} placement="top" hasArrow isDisabled={!isDisabled && lotteryStatus}>
              <Box w="full">
                <IconButton
                    aria-label="购买彩票"
                    icon={<Icon as={FaGift} w={{base: 8, md: 10}} h={{base: 8, md: 10}} />} // 图标大小通过 IconButton 的 size 或直接在 Icon 上设置
                    color="brand.500"
                    variant="ghost" // 移除按钮背景和边框
                    // colorScheme="brand" // 移除 colorScheme，因为颜色和悬停效果将通过 color 和 sx 控制
                    // size="lg" // Size prop might affect padding; direct icon sizing is more precise here
                    w="full"
                    onClick={handleEnterLottery}
                    isLoading={isLoading}
                    isDisabled={isDisabled}
                    _hover={{
                       transform: "scale(1.15)", // 更明显的放大效果
                        bg: "transparent", // 关键：确保 IconButton 在悬停时背景仍然透明
                    }}
                    _active={{ 
                        transform: "scale(1.05) translateY(1px)", // 点击时的反馈
                    }}
                    sx={{
                        // 当鼠标悬停在 IconButton 上时，改变内部 SVG 图标的样式
                        '&:hover svg': {
                            color: 'brand.400', // 悬停时图标颜色变亮/变化 (例如 brand.400)
                            filter: 'drop-shadow(0px 0px 8px var(--chakra-colors-brand-400))', // 添加光晕效果
                        },
                        // 确保图标本身也有指针样式，增强可点击性暗示
                        'svg': { cursor: 'pointer' }
                     }}
                  >
                    {/* Text is removed from button, shown below */}
                  </IconButton>

                  <Text textAlign="center" fontSize="sm" mt={1} color={textColor}>
                    ( {ticketPrice} ETH )
                  </Text>
                </Box>
            </Tooltip>
        </VStack>
    </Box>
  );
}

export default PurchaseTicket;