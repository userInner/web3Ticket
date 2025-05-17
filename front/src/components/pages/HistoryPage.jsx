import React from 'react';
import {
  VStack,
  Text,
  Heading,
  Box,
  List,
  ListItem,
  Link,
  useColorModeValue,
  Flex,
  Icon,
  Stack,
  Button
} from '@chakra-ui/react';
import { FaEthereum } from 'react-icons/fa'; // For Etherscan icon


function HistoryPage({ historicalWinners, currentAccount }) {
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.700', 'whiteAlpha.900');
  const itemBgHover = useColorModeValue('gray.100', 'gray.600');
  const [currentPage, setCurrentPage] = React.useState(1);
  const winnersPerPage = 10; // Adjust as needed
  if (!currentAccount) {
    return <Text textAlign="center">请先连接钱包查看历史记录。</Text>;
  }
  const totalPages = Math.ceil(historicalWinners.length / winnersPerPage);
  const getPaginatedWinners = () => {
    const startIndex = (currentPage - 1) * winnersPerPage;
    const endIndex = startIndex + winnersPerPage;
    return historicalWinners.slice(startIndex, endIndex);
  };

  const paginatedWinners = getPaginatedWinners();

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <Box p="6" bg={cardBg} borderRadius="xl" boxShadow="lg" w="100%">
      <VStack spacing="6" align="stretch">
        <Heading as="h2" size="xl" color={headingColor} textAlign="center">
          历史中奖记录
        </Heading>

        {historicalWinners.length > 0 ? (
          <>
            <List spacing={4}>
              {paginatedWinners.map((winner, index) => (
                <ListItem key={index} p="4" borderRadius="md" bg={itemBgHover} boxShadow="sm">
                  <Flex justify="space-between" align="center">
                    <Text fontSize="sm" color={textColor}>区块 {winner.blockNumber}:</Text>
                    <Text fontSize="sm" color={textColor} fontWeight="medium">{winner.address}</Text>
                    <Text fontSize="sm" color="green.400" fontWeight="bold">赢得 {winner.amount} ETH</Text>
                    <Link href={`https://holesky.etherscan.io/tx/${winner.transactionHash}`} isExternal> {/* Assuming Holesky */}
                      <Icon as={FaEthereum} boxSize={6} color="blue.400" />
                    </Link>
                  </Flex>
                </ListItem>
              ))}
            </List>
            {totalPages > 1 && (
              <Stack direction="row" justifyContent="center" spacing="3" mt="6">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button size="sm" key={page} onClick={() => handlePageChange(page)} isDisabled={currentPage === page} variant={currentPage === page ? 'solid' : 'outline'} colorScheme="brand">{page}</Button>
                ))}
              </Stack>
            )}
          </>
        ) : (
          <Text color={textColor} textAlign="center" fontSize="lg">暂无历史中奖记录。</Text>
        )}
      </VStack>
    </Box>
  );
}

export default HistoryPage;