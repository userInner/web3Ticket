// d:\project\Front\github\web3Ticket\front\src\components\pages\LotteryPage.jsx
import React from 'react';
import {
  VStack, Text, Box, Spinner, Heading, Button, List, ListItem, ListIcon,
  UnorderedList, Alert, AlertIcon, HStack, Tag, SimpleGrid, Icon,
  useColorModeValue, Divider, Flex, Tooltip
} from '@chakra-ui/react';
import { StarIcon, InfoOutlineIcon, TimeIcon, CheckCircleIcon, WarningIcon, LockIcon } from '@chakra-ui/icons';
import LotteryInfo from '../LotteryInfo'; // 假设这个组件会进一步细化或其内容被整合
import PlayerList from '../PlayerList';   // 同上
import PurchaseTicket from '../PurchaseTicket'; // 同上

// 辅助组件：信息展示项
const InfoItem = ({ icon, label, value, valueColor, iconColor = "blue.500" }) => (
  <HStack spacing="3" alignItems="center">
    <Icon as={icon} w={5} h={5} color={iconColor} />
    <Text fontSize="md" color={useColorModeValue("gray.600", "gray.300")}>{label}:</Text>
    <Text fontSize="lg" fontWeight="bold" color={valueColor || useColorModeValue("gray.800", "whiteAlpha.900")}>
      {value}
    </Text>
  </HStack>
);

// 辅助组件：状态标签
const StatusTag = ({ status, isPickingWinner }) => {
  if (isPickingWinner) {
    return <Tag size="lg" colorScheme="orange" variant="solid" borderRadius="full"><Spinner size="xs" mr="2" />开奖中</Tag>;
  }
  if (status) {
    return <Tag size="lg" colorScheme="green" variant="solid" borderRadius="full"><CheckCircleIcon mr="2" />开放中</Tag>;
  }
  return <Tag size="lg" colorScheme="red" variant="solid" borderRadius="full"><LockIcon mr="2" />已关闭</Tag>;
};


function LotteryPage({
  currentAccount,
  owner,
  ticketPrice,
  prizePool,
  lotteryStatus,
  isLoadingData,
  players,
  handleEnterLottery,
  isLoadingTx,
  prizeTiers,
  lastDrawResults,
  isWinnerPickingInProgress,
  refreshLotteryData,
  lotteryDataError,
  ethToUsdtPrice,
  isLoadingEthPrice,
}) {
  const cardBg = useColorModeValue("white", "gray.700");
  const headingColor = useColorModeValue("gray.700", "whiteAlpha.900");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  if (isLoadingData && !prizePool && !currentAccount) {
    return (
      <VStack justifyContent="center" alignItems="center" minH="calc(100vh - 200px)"> {/* 减去Header/Footer大致高度 */}
        <Spinner size="xl" color="brand.500" thickness="4px" />
        <Text fontSize="lg" color={textColor}>请先连接钱包并等待合约加载...</Text>
      </VStack>
    );
  }

  const calculateUsdtValue = (ethAmount) => {
    if (!ethToUsdtPrice || !ethAmount) return null;
    const ethValue = parseFloat(ethAmount);
    if (isNaN(ethValue)) return null;
    return (ethValue * ethToUsdtPrice).toFixed(2);
  };

  const prizePoolUsdt = calculateUsdtValue(prizePool);

  return (
    <VStack spacing={{ base: '6', md: '8' }} align="stretch" w="100%" py={6}>
      {lotteryDataError && (
        <Alert status="error" borderRadius="md" boxShadow="md">
          <AlertIcon />
          {lotteryDataError}
        </Alert>
      )}

      {/* 卡片 1: 彩票核心信息 & 参与操作 */}
      <Box p={{ base: 4, md: 6 }} bg={cardBg} borderRadius="xl" boxShadow="xl">
        <VStack spacing={5} align="stretch">
          <Flex justifyContent="space-between" alignItems="center" wrap="wrap">
            <Heading as="h2" size="lg" color={headingColor} mb={{ base: 2, md: 0 }}>
              幸运殿堂 - Ticket Dapp
            </Heading>
            <StatusTag status={lotteryStatus} isPickingWinner={isWinnerPickingInProgress} />
          </Flex>

          <Divider borderColor={borderColor} />

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
            <InfoItem icon={TimeIcon} label="票价" value={`${ticketPrice} ETH`} />
            <InfoItem icon={StarIcon} label="当前奖池" value={`${prizePool} ETH`} />
            {prizePoolUsdt && !isLoadingEthPrice && (
                <InfoItem icon={InfoOutlineIcon} label="奖池估值" value={`≈ $${prizePoolUsdt} USDT`} valueColor="green.500" iconColor="green.500" />
            )}
            <InfoItem icon={InfoOutlineIcon} label="参与人数" value={`${players?.length || 0} 人`} />
          </SimpleGrid>

          <PurchaseTicket
            lotteryStatus={lotteryStatus}
            handleEnterLottery={handleEnterLottery}
            isLoading={isLoadingTx}
            isDisabled={!lotteryStatus || isLoadingTx || isWinnerPickingInProgress || !currentAccount}
            ticketPrice={ticketPrice} // Pass ticketPrice for display on button
          />
        </VStack>
      </Box>

      {/* 卡片 2: 奖品等级配置 */}
      <Box p={{ base: 4, md: 6 }} bg={cardBg} borderRadius="xl" boxShadow="xl">
        <Heading as="h3" size="md" mb={4} color={headingColor}>
          奖金分配规则
        </Heading>
        {prizeTiers && prizeTiers.length > 0 ? (
          <List spacing={3}>
            {prizeTiers.map((tier, index) => (
              <ListItem key={index} display="flex" alignItems="center" p={2} _hover={{ bg: useColorModeValue("gray.100", "gray.600") }} borderRadius="md">
                <ListIcon as={StarIcon} color="yellow.400" boxSize={5} />
                <Text ml={2} color={textColor}>
                  <strong>等级 {index + 1}:</strong> 瓜分奖池 <Tag colorScheme="teal" size="sm" variant="subtle">{tier.percentage}%</Tag>，
                  共 <Tag colorScheme="purple" size="sm" variant="subtle">{tier.count} 名</Tag> 幸运儿
                </Text>
              </ListItem>
            ))}
          </List>
        ) : (
          <Text color={textColor} fontStyle="italic">暂未配置奖品等级。</Text>
        )}
      </Box>

      {/* 卡片 3: 最近一期开奖结果 */}
      <Box p={{ base: 4, md: 6 }} bg={cardBg} borderRadius="xl" boxShadow="xl">
        <Heading as="h3" size="md" mb={4} color={headingColor}>
          上期开奖结果
        </Heading>
        {lastDrawResults && lastDrawResults.length > 0 && prizeTiers && prizeTiers.length > 0 ? (
            lastDrawResults.map((tierResult) => {
              const prizePerWinnerEth = tierResult.prizePerWinner;
              const prizePerWinnerUsdt = calculateUsdtValue(prizePerWinnerEth);
              return (
                <Box key={tierResult.tierIndex} mb={5} p={4} borderWidth="1px" borderColor={borderColor} borderRadius="lg" bg={useColorModeValue("gray.50", "gray.600")}>
                  <Flex justifyContent="space-between" alignItems="center" mb={2}>
                    <Text fontWeight="bold" fontSize="lg" color={headingColor}>等级 {tierResult.tierIndex + 1}</Text>
                    <Box textAlign="right">
                      <Text fontSize="md" fontWeight="semibold" color={textColor}>每人: {prizePerWinnerEth} ETH</Text>
                      {isLoadingEthPrice && <Text fontSize="xs" color="gray.400">加载 USDT...</Text>}
                      {prizePerWinnerUsdt && !isLoadingEthPrice && (
                        <Tag size="md" colorScheme="green" variant="solid" mt={1}>
                          ≈ ${prizePerWinnerUsdt} USDT
                        </Tag>
                      )}
                    </Box>
                  </Flex>
                  {tierResult.winners && tierResult.winners.length > 0 ? (
                    <VStack align="start" spacing={1} mt={2}>
                      <Text fontSize="sm" color={textColor} fontWeight="medium">获奖地址:</Text>
                      {tierResult.winners.map((winner, idx) => (
                        <Tooltip label={winner} placement="top" key={idx}>
                          <Text fontSize="sm" color={textColor} noOfLines={1} w="full" _hover={{ color: "blue.400", cursor: "pointer" }} onClick={() => navigator.clipboard.writeText(winner)}>
                            {`${winner.substring(0, 8)}...${winner.substring(winner.length - 6)}`}
                          </Text>
                        </Tooltip>
                      ))}
                    </VStack>
                  ) : (<Text fontSize="sm" color={textColor} fontStyle="italic">该等级无获奖者。</Text>)}
                </Box>
              );
            })
        ) : (
          <HStack spacing={2} color={textColor} fontStyle="italic">
            <InfoOutlineIcon />
            <Text>暂无上一期开奖数据或奖品等级未配置。</Text>
          </HStack>
        )}
        {ethToUsdtPrice && !isLoadingEthPrice && (
          <Text fontSize="xs" color="gray.500" mt={4} textAlign="right">
            <InfoOutlineIcon mr="1" verticalAlign="middle" />
            USDT 估值基于 ETH ≈ ${ethToUsdtPrice} (CoinGecko)
          </Text>
        )}
      </Box>

      {/* 刷新按钮可以放在一个更全局的位置，或者如果App.jsx中有自动刷新逻辑，这里可以省略 */}
      <Button
        onClick={refreshLotteryData}
        disabled={isLoadingData || isLoadingTx}
        variant="ghost"
        colorScheme="blue"
        size="sm"
        alignSelf="center"
        mt={2}
      >
        刷新彩票数据
      </Button>
    </VStack>
  );
}

export default LotteryPage;
// 这里的代码是一个React组件，使用Chakra UI库来构建一个彩票页面。它展示了彩票的核心信息、奖品等级配置和最近一期开奖结果。
// 组件使用了响应式设计，确保在不同屏幕尺寸下都能良好显示。它还包含了一些辅助组件来简化代码结构和提高可读性。