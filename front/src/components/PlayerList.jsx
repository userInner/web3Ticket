import React from 'react';
import { Heading, Text, VStack, List, ListItem, useColorModeValue, Icon, Flex, Stack, Button } from '@chakra-ui/react';
import { FaUserCircle } from 'react-icons/fa'; // 导入一个用户图标
import Card from './common/Card'; // 导入 Card 组件

function PlayerList({ players, lotteryStatus }) {
  console.log("PlayerList rendered");
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.700', 'whiteAlpha.900');
  const itemHoverBg = useColorModeValue('gray.100', 'gray.600');
  const [currentPage, setCurrentPage] = React.useState(1);
  const playersPerPage = 10; // You can adjust this value

  const totalPages = Math.ceil(players.length / playersPerPage);

  const getPaginatedPlayers = () => {
    const startIndex = (currentPage - 1) * playersPerPage;
    const endIndex = startIndex + playersPerPage;
    return players.slice(startIndex, endIndex);
  };

  const paginatedPlayers = getPaginatedPlayers();

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <Card> {/* 使用 Card 组件 */}
      <VStack spacing="4" align="stretch">
        <Heading as="h3" size="md" color={headingColor} display="flex" alignItems="center">
          当前参与玩家
         {players.length > 10 && ( // Only show total count if more than 10 players
            <Text as="span" fontSize="md" color="gray.500" ml="2">
              ({players.length} 人)
            </Text>
          )}
        </Heading>
        {players.length > 0 ? (
          <>
            <List spacing={3}>
              {paginatedPlayers.map((player, index) => (
                <ListItem
                  key={index}
                  p="3"
                  borderRadius="md"
                  _hover={{ bg: itemHoverBg, cursor: 'default' }}
                  borderWidth="1px"
                  borderColor={useColorModeValue('gray.200', 'gray.600')}
                >
                  <Flex align="center">
                    <Icon as={FaUserCircle} color="brand.400" w={5} h={5} mr={3} />
                    <Text fontSize="sm" color={textColor} wordBreak="break-all">{player}</Text>
                  </Flex>
                </ListItem>
              ))}
            </List>
            {totalPages > 1 && (
              <Stack direction="row" justifyContent="center" spacing="2" mt="4">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    isDisabled={currentPage === page}
                    variant={currentPage === page ? 'solid' : 'outline'}
                    colorScheme="brand"
                  >
                    {page}
                  </Button>
                ))}
              </Stack>
            )}
          </>
        ) : (
          <Text color={textColor} textAlign="center" py="4">{lotteryStatus ? "还没有玩家参与本轮抽奖。" : "当前没有开放的抽奖或已结束。"}</Text>
        )}
      </VStack>
    </Card>
   );
 }

export default PlayerList;