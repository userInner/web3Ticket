import React from 'react';
import {
  Box, Flex, Heading, Text, Button, IconButton,
  HStack, Menu, MenuButton, MenuList, MenuItem, Avatar, Tooltip, Tag,
  useColorMode, useColorModeValue
} from '@chakra-ui/react';
import { NavLink as RouterLink } from 'react-router-dom'; // Use NavLink for active styles
import { MoonIcon, SunIcon, ExternalLinkIcon, HamburgerIcon, SettingsIcon, UnlockIcon } from '@chakra-ui/icons'; // Added SettingsIcon and UnlockIcon
function Header({ currentAccount, connectWallet, disconnectWallet, isLoading, isOwnerConnected, colorMode, toggleColorMode }) {
  const bgColor = useColorModeValue('white', 'gray.900');
  const textColor = useColorModeValue('gray.700', 'gray.300');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box bg={bgColor} py={4} boxShadow="md" position="sticky" top="0" zIndex="10" w="100%">
      {/* This new outer Box will constrain the Header's width and center it */}
      <Box
        maxW="container.lg" // Match the main content Container's maxW
        mx="auto"           // Center this Box
        px={{ base: 4, md: 6 }} // Consistent horizontal padding
      >
        {/* The original Flex container now sits inside the width-constrained Box */}
        {/* This Flex should behave exactly like a Container's direct child would */}
        <Flex
          align="center"
          justify="space-between"
          w="100%" // Ensure it tries to fill its parent (the Box above)
        >
        {/* Logo/DApp Name */}
        <Box>
          <Heading as="h1" size="lg" color={textColor} fontWeight="bold" letterSpacing="tight">
            幸运殿堂
          </Heading>
          {/* <Text fontSize="sm" color={textColor.muted}>彩票 DApp</Text>  可选副标题 */}
        </Box>

        {/* Navigation (for larger screens) */}
        <HStack spacing="4" display={{ base: 'none', md: 'flex' }}>
          <Button
            as={RouterLink}
            to="/"
            variant="ghost"
            color={textColor}
            _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
            style={({ isActive }) => ({
              fontWeight: isActive ? "bold" : "normal",
              borderBottom: isActive ? `2px solid ${useColorModeValue('blue.500', 'blue.300')}` : 'none',
            })}
          >
            当前彩票
          </Button>
          <Button
            as={RouterLink}
            to="/history"
            variant="ghost"
            color={textColor}
            _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
            style={({ isActive }) => ({
              fontWeight: isActive ? "bold" : "normal",
              borderBottom: isActive ? `2px solid ${useColorModeValue('blue.500', 'blue.300')}` : 'none',
            })}
          >
            历史记录
          </Button>
          {isOwnerConnected && (
            <Button
              as={RouterLink}
              to="/admin"
              variant="ghost"
              color={textColor}
              leftIcon={<SettingsIcon />}
              isDisabled={isLoading}
              _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
              style={({ isActive }) => ({
                fontWeight: isActive ? "bold" : "normal",
                borderBottom: isActive ? `2px solid ${useColorModeValue('blue.500', 'blue.300')}` : 'none',
              })}>
             管理
            </Button>
          )}
        </HStack>

        {/* Right side - Wallet & Theme */}
        <Flex align="center" gap="2">
          {currentAccount ? (
            <Menu>
              <MenuButton as={Button} rightIcon={<HamburgerIcon />} borderRadius="full" px="3" py="2" bg={useColorModeValue("gray.100", "gray.700")} _hover={{ bg: useColorModeValue("gray.200", "gray.600") }}>
                <HStack>
                  <Avatar size="sm" name={currentAccount.substring(0, 6)} src={`https://api.dicebear.com/7.x/identicon/svg?seed=${currentAccount}`} /> {/* Generate avatar for visual feedback */}
                  <Tooltip label={currentAccount} placement="bottom">
                    <Text fontSize="sm" color={textColor} fontWeight="medium" maxWidth="120px" textOverflow="ellipsis" overflow="hidden" whiteSpace="nowrap">{`${currentAccount.substring(0, 6)}...${currentAccount.slice(-4)}`}</Text>
                  </Tooltip>
                </HStack>
              </MenuButton>
              <MenuList bg={bgColor} borderColor={borderColor}>
                {/* <MenuItem icon={<ExternalLinkIcon />} as="a" href={`https://sepolia.etherscan.io/address/${currentAccount}`} target="_blank" rel="noopener noreferrer">在 Etherscan 上查看</MenuItem> */} {/* Optional */}
                <MenuItem onClick={disconnectWallet} isDisabled={isLoading} color={textColor}>断开钱包</MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <Button colorScheme="blue" onClick={connectWallet} isDisabled={isLoading} leftIcon={<UnlockIcon />} px="5" py="2" fontWeight="bold">连接钱包</Button>
          )}
          
          <IconButton
            aria-label="切换主题"
            icon={colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
            onClick={toggleColorMode}
            size="md"
            variant="ghost"
            color={textColor}
          />

           {/* Mobile Navigation (Hamburger menu) */}
        <Menu display={{ base: 'flex', md: 'none' }}>
          <MenuButton as={IconButton} aria-label="Options" icon={<HamburgerIcon />} variant="outline" colorScheme="blue" />
          <MenuList bg={bgColor} borderColor={borderColor}>
            <MenuItem
              as={RouterLink}
              to="/"
              color={textColor}
              _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
              style={({ isActive }) => ({ fontWeight: isActive ? "bold" : "normal" })}
            >
              当前彩票
            </MenuItem>
            <MenuItem
              as={RouterLink}
              to="/history"
              color={textColor}
              _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
              style={({ isActive }) => ({ fontWeight: isActive ? "bold" : "normal" })}
            >
              历史记录
            </MenuItem>
            {isOwnerConnected && (
              <MenuItem
                as={RouterLink}
                to="/admin"
                icon={<SettingsIcon />}
                color={textColor}
                _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
                style={({ isActive }) => ({ fontWeight: isActive ? "bold" : "normal" })}
              >
                管理
              </MenuItem>
            )}
          </MenuList>
        </Menu>
        </Flex>
      </Flex>
      </Box> {/* This Box (from line 13) closes after the main Flex (from line 19) */}
    </Box>
  );
}

export default Header;