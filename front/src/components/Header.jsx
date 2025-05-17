import React from 'react';
import { Box, Heading, Button, HStack, Tag, TagLabel, Spinner, Link as ChakraLink, Flex, Spacer } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom'; // 导入 React Router 的 Link
import { useAppContext } from '../context/AppContext';
import { FaCheckCircle } from 'react-icons/fa'; // Import a check icon from react-icons

function Header({ currentAccount, connectWallet, isLoading, isOwnerConnected }) { // 接收 props
  const { shortenAddress } = useAppContext();
  return (
    <Box as="header" w="100%" py="4" borderBottomWidth="1px" borderColor="gray.600">
      <Flex justifyContent="space-between" alignItems="center">
        <HStack spacing="8">
          <Heading as="h1" size="lg" bgGradient="linear(to-r, brand.400, cyberPurple)" bgClip="text">
            <RouterLink to="/">Web3彩票</RouterLink>
          </Heading>
          <HStack as="nav" spacing="6">
            <ChakraLink as={RouterLink} to="/" _hover={{ textDecoration: 'none', color: 'brand.300' }}>
              抽奖
            </ChakraLink>
            <ChakraLink as={RouterLink} to="/history" _hover={{ textDecoration: 'none', color: 'brand.300' }}>
              历史记录
            </ChakraLink>
            {isOwnerConnected && (
              <ChakraLink as={RouterLink} to="/admin" _hover={{ textDecoration: 'none', color: 'brand.300' }} fontWeight="bold">
                管理面板
              </ChakraLink>
            )}
          </HStack>
        </HStack>

        <Box>
          {!currentAccount ? (
            <Button
              onClick={connectWallet}
              isLoading={isLoading && !currentAccount}
              loadingText="连接中"
              variant="solid"
              size="md"
            >
              连接 MetaMask
            </Button>
          ) : (
            <Tag size="lg" colorScheme="green" borderRadius="full" variant="subtle">
              <FaCheckCircle style={{ marginRight: '0.5em' }} />
              <TagLabel>已连接: {currentAccount}</TagLabel>
            </Tag>
          )}
        </Box>
      </Flex>
    </Box>
  );
}

export default Header;