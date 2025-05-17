import React from 'react';
import { Alert, AlertTitle, AlertDescription, Box, CloseButton, useDisclosure } from '@chakra-ui/react'; // 移除了 AlertIcon
import { useAppContext } from '../context/AppContext';

function Notifications() {
  const { errorMessage, successMessage } = useAppContext();
  const { isOpen: isErrorVisible, onClose: onErrorClose, onOpen: onErrorOpen } = useDisclosure({ defaultIsOpen: !!errorMessage });
  const { isOpen: isSuccessVisible, onClose: onSuccessClose, onOpen: onSuccessOpen } = useDisclosure({ defaultIsOpen: !!successMessage });

  React.useEffect(() => {
    if (errorMessage) onErrorOpen(); else onErrorClose();
  }, [errorMessage, onErrorOpen, onErrorClose]);

  React.useEffect(() => {
    if (successMessage) onSuccessOpen(); else onSuccessClose();
  }, [successMessage, onSuccessOpen, onSuccessClose]);

  return (
    <Box position="fixed" top="20px" right="20px" zIndex="tooltip">
      {isErrorVisible && errorMessage && (
        <Alert status="error" variant="solid" borderRadius="md" mb="2">
          {/* AlertIcon 会根据 status 自动渲染 */}
          <Box flex="1">
            <AlertTitle>错误!</AlertTitle>
            <AlertDescription display="block">{errorMessage}</AlertDescription>
          </Box>
          <CloseButton alignSelf="flex-start" position="relative" right={-1} top={-1} onClick={onErrorClose} />
        </Alert>
      )}
      {isSuccessVisible && successMessage && (
        <Alert status="success" variant="solid" borderRadius="md">
          {/* AlertIcon 会根据 status 自动渲染 */}
          <Box flex="1">
            <AlertTitle>成功!</AlertTitle>
            <AlertDescription display="block">{successMessage}</AlertDescription>
          </Box>
          <CloseButton alignSelf="flex-start" position="relative" right={-1} top={-1} onClick={onSuccessClose} />
        </Alert>
      )}
    </Box>
  );
}

export default Notifications;