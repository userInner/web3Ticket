import React from 'react';
import { Box, Heading, Button, HStack, IconButton, Link as ChakraLink, Flex, Tag, TagLabel, useColorModeValue } from '@chakra-ui/react'; // 移除了 Spacer, VStack, Text. 添加了 IconButton
import { Link as RouterLink } from 'react-router-dom'; // 导入 React Router 的 Link
import { useAppContext } from '../context/AppContext';
import { FaCheckCircle, FaSun, FaMoon } from 'react-icons/fa'; // 导入图标

function Header({ currentAccount, connectWallet, disconnectWallet, isLoading, isOwnerConnected, colorMode, toggleColorMode }) { // 添加 colorMode, toggleColorMode props
  const navLinkColor = useColorModeValue('gray.600', 'gray.200');
  const navLinkHoverColor = useColorModeValue('brand.500', 'brand.300');

  return (
    <Box as="header" w="100%" py="4" px={{ base: '4', md: '6' }} borderBottomWidth="1px" borderColor={useColorModeValue('gray.200', 'gray.700')}>
      <Flex maxW="container.lg" mx="auto" justifyContent="space-between" alignItems="center"> {/* 限制内容最大宽度并居中 */}
        <HStack spacing={{ base: '4', md: '8' }} alignItems="center"> {/* 响应式间距 */}
          <Heading as="h1" size="lg" bgGradient="linear(to-r, brand.400, cyberPurple)" bgClip="text">
            <RouterLink to="/">Web3彩票</RouterLink>
          </Heading>
          <HStack as="nav" spacing={{ base: '3', md: '6' }} display={{ base: 'none', md: 'flex' }}> {/* 小屏幕隐藏导航, 调整间距 */}
            <ChakraLink as={RouterLink} to="/" color={navLinkColor} _hover={{ textDecoration: 'none', color: navLinkHoverColor }} className="header-nav-item-text">
              抽奖
            </ChakraLink>
            <ChakraLink as={RouterLink} to="/history" color={navLinkColor} _hover={{ textDecoration: 'none', color: navLinkHoverColor }} className="header-nav-item-text">
              历史记录
            </ChakraLink>
            {isOwnerConnected && (
              <ChakraLink as={RouterLink} to="/admin" color={navLinkColor} _hover={{ textDecoration: 'none', color: navLinkHoverColor }} fontWeight="bold" className="header-nav-item-text">
                管理面板
              </ChakraLink>
            )}
          </HStack>
        </HStack>

        <Box>
          <HStack spacing={{ base: '2', md: '4' }}> {/* 响应式间距 */}
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
              onClick={toggleColorMode}
              variant="ghost"
              size="md"
            />
            {!currentAccount ? (
              <Button
                onClick={connectWallet}
                isLoading={isLoading && !currentAccount} // 仅在全局加载且未连接时显示按钮加载状态
                loadingText="连接中"
                variant="solid"
                colorScheme="brand" // 使用品牌色作为主操作按钮
                size="md"
              >
                连接钱包
              </Button>
            ) : (
             <HStack spacing={{ base: '2', md: '3' }}> {/* 连接后状态的响应式间距 */}
                <Tag size="md" colorScheme="green" borderRadius="full" variant="subtle" display={{ base: 'none', sm: 'flex' }}> {/* 超小屏幕隐藏标签 */}
                  <FaCheckCircle style={{ marginRight: '0.3em' }} />
                  <TagLabel>已连接</TagLabel>
                </Tag>
                <Button
                  onClick={disconnectWallet}
                  variant="outline"
                  colorScheme="red"
                  size="sm"
                  title={`已连接: ${currentAccount}`} // 鼠标悬停显示完整地址
                >
                  {currentAccount} {/* 显示缩短的地址 */}
                </Button>
              </HStack>
            )}
            {/* 可以在此处为移动端添加一个 MenuButton (汉堡菜单) */}
            {/* <IconButton display={{ base: "flex", md: "none" }} icon={<HamburgerIcon />} aria-label="Open menu" /> */}
          </HStack>
        </Box>
      </Flex>
    </Box>
  );
}

export default Header;