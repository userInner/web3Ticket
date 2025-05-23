import {
  VStack, Text, Heading, Box, Spinner, useColorModeValue,Flex,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, Tag, Link as ChakraLink, HStack, //Add HStack here
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, UnorderedList, ListItem, Tooltip
} from '@chakra-ui/react';
import { InfoOutlineIcon } from '@chakra-ui/icons';
const WinnerAddress = ({ address }) => (
  <Tooltip label={address} placement="top" hasArrow>
    <ChakraLink href={`https://sepolia.etherscan.io/address/${address}`} isExternal color="blue.400" _hover={{ textDecoration: "underline" }} isTruncated maxW="150px" display="inline-block">
      {`${address.substring(0, 8)}...${address.slice(-6)}`}
    </ChakraLink>
  </Tooltip>
);

const WinnerList = ({ winners = [] }) => (
  <UnorderedList styleType="none" pl={0} spacing={1} mt={1}>
    {winners.map((winner, index) => ( <ListItem key={index}><WinnerAddress address={winner} /></ListItem>))}
  </UnorderedList> 
);



function HistoryPage({ groupedHistoricalData, isLoadingHistory }) { // Receive groupedHistoricalData
  const cardBg = useColorModeValue("white", "gray.700");
  const headingColor = useColorModeValue("gray.700", "whiteAlpha.900");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  if (isLoadingHistory) {
    return (
      <VStack justifyContent="center" alignItems="center" minH="calc(100vh - 200px)">
        <Spinner size="xl" color="brand.500" thickness="4px" />
        <Text fontSize="lg" color={textColor}>加载历史数据...</Text>
      </VStack>
    );
  }

  return (
    <VStack spacing={{ base: 6, md: 8 }} align="stretch" w="100%" py={6} flexGrow={1}>
      <Heading as="h2" size="xl" color={headingColor} textAlign="center" mb="4">
        历史开奖记录  
      </Heading>

      {groupedHistoricalData && groupedHistoricalData.length > 0 ? (
        <Accordion allowMultiple defaultIndex={[0]}> {/* Optionally open the first item by default */}
          {groupedHistoricalData.map((draw) => (
            <AccordionItem key={draw.requestId} boxShadow="md" borderRadius="lg" bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <h2>
                <AccordionButton p={4} _expanded={{ bg: useColorModeValue("gray.100", "gray.600"), color: headingColor }}>
                  <Box flex="1" textAlign="left">
                    <Text fontWeight="semibold" color={headingColor}>
                      开奖 #{draw.requestId} - 区块 {draw.blockNumber}
                    </Text>
                    {draw.transactionHash && (
                       <ChakraLink href={`https://sepolia.etherscan.io/tx/${draw.transactionHash}`} isExternal fontSize="xs" color="blue.400" ml={2} onClick={(e) => e.stopPropagation()}>
                         (查看交易)
                       </ChakraLink>
                    )}
                  </Box>
                  <AccordionIcon color="blue.400" />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4} px={{base: 2, md: 4}} w="100%" overflow="hidden">
                {draw.tiers && draw.tiers.length > 0 ? (
                  draw.tiers.map((tier, index) => (
                    <Box key={index} mb={4} p={4} borderWidth="1px" borderColor={borderColor} borderRadius="md" bg={useColorModeValue("gray.50", "gray.750")} overflowX="auto" w="100%">
                      <Flex justifyContent="space-between" alignItems="center" mb={2} wrap="wrap">
                        <Text fontWeight="bold" fontSize="lg" color={headingColor}>等级 {tier.tierIndex + 1}</Text>
                        <Tag colorScheme="green" variant="solid" size="md">
                          每人: {tier.prizePerWinner} ETH
                        </Tag>
                      </Flex>
                      <VStack align="start" spacing={1} mt={2}>
                        <Text fontSize="sm" color={textColor} fontWeight="medium">获奖地址:</Text>
                        <WinnerList winners={tier.winners} />
                      </VStack>
                    </Box>
                  ))
                ) : (
                  <HStack spacing={2} color={textColor} fontStyle="italic" justify="center">
                    <InfoOutlineIcon />
                    <Text>此开奖无等级数据。</Text>
                  </HStack>
                )}
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <HStack spacing={2} color={textColor} fontStyle="italic" justify="center">
          <InfoOutlineIcon />
          <Text>暂无历史开奖记录。</Text>
        </HStack>
      )}
    </VStack>
  );
}

export default HistoryPage;