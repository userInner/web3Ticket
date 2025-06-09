import React from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';

function Card({ children, ...rest }) {
  const cardBg = useColorModeValue('white', 'gray.700');

  return (
    <Box p="6" bg={cardBg} borderRadius="xl" boxShadow="lg" w="100%" {...rest}>
      {children}
    </Box>
  );
}
export default Card;