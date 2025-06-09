import React from 'react';
import { Box, Text, Link, useColorModeValue, Flex } from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';

function Footer({lotteryContractAddress}) {
  const bgColor = useColorModeValue('gray.100', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <Box as="footer" bg={bgColor} py={4} mt="8">
      <Flex justify="center" align="center" maxW="container.lg" mx="auto" direction={{base: "column", md: "row"}} textAlign={{base: "center", md: "left"}}>
        <Text fontSize="sm" color={textColor}>
          © {new Date().getFullYear()} Luck Ticket. All Rights Reserved.
        </Text>
        <Box ml={{md:"4"}} mt={{base:"2", md:"0"}}>
        {lotteryContractAddress && (
          <Link
            href={`https://sepolia.etherscan.io/address/${lotteryContractAddress}`}
            isExternal
            fontSize="sm"
            color="blue.400"
          >
            合约地址 <ExternalLinkIcon mx="2px" />
          </Link>
        )}
        </Box>
      </Flex>
    </Box>
  );
}

export default Footer;