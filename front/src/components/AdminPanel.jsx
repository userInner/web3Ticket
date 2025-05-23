// d:\project\Front\github\web3Ticket\front\src\components\AdminPanel.jsx
import React from 'react';
import {
  Box, Heading, Text, Button, VStack, useColorModeValue, Divider, HStack, Input, Tooltip, IconButton, Flex,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  FormControl, FormLabel, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, Icon, Alert, AlertIcon, Tag
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon, SettingsIcon, LockIcon, UnlockIcon, CheckCircleIcon, WarningTwoIcon, TimeIcon } from '@chakra-ui/icons';

// 辅助组件：模态框中的等级输入行
const ModalTierInputRow = ({ tier, index, handleModalPrizeTierInputChange, handleRemoveModalPrizeTierInput, canRemove, isLoading }) => (
  <Flex key={index} align="flex-end" gap="3" mb="4" pb="4" borderBottomWidth="1px" borderColor={useColorModeValue("gray.200", "gray.600")}>
    <FormControl flex="2">
      <FormLabel htmlFor={`modal-percentage-${index}`} fontSize="sm" mb="1">等级 {index + 1} 百分比 (%)</FormLabel>
      <NumberInput isDisabled={isLoading} id={`modal-percentage-${index}`} min={1} max={100} value={tier.percentage} onChange={(valStr) => handleModalPrizeTierInputChange(index, 'percentage', valStr)} precision={0} bg={useColorModeValue("white", "gray.800")}>
        <NumberInputField />
        <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
      </NumberInput>
    </FormControl>
    <FormControl flex="2">
      <FormLabel htmlFor={`modal-count-${index}`} fontSize="sm" mb="1">获奖人数</FormLabel>
      <NumberInput isDisabled={isLoading} id={`modal-count-${index}`} min={1} value={tier.count} onChange={(valStr) => handleModalPrizeTierInputChange(index, 'count', valStr)} precision={0} bg={useColorModeValue("white", "gray.800")}>
        <NumberInputField />
        <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
      </NumberInput>
    </FormControl>
    {canRemove && (
      <IconButton icon={<DeleteIcon />} size="md" colorScheme="red" variant="ghost" onClick={() => handleRemoveModalPrizeTierInput(index)} aria-label="移除等级" isDisabled={isLoading} />
    )}
  </Flex>
);

// 辅助组件：管理员操作按钮
const AdminActionButton = ({ icon, label, onClick, isLoading, isDisabled, colorScheme, tooltipLabel, ...rest }) => (
  <Tooltip label={tooltipLabel} isDisabled={!tooltipLabel || !isDisabled} placement="top" hasArrow>
    <Button
      leftIcon={icon ? <Icon as={icon} /> : undefined}
      onClick={onClick}
      isLoading={isLoading}
      isDisabled={isDisabled}
      colorScheme={colorScheme}
      w="full"
      boxShadow="sm"
      _hover={{ boxShadow: "md" }}
      {...rest}
    >
      {label}
    </Button>
  </Tooltip>
);


function AdminPanel({
  isOwnerConnected,
  isLoading, // General loading state for actions initiated from this panel
  lotteryStatus,
  players,
  handleOpenLottery,
  handlePickWinner,
  newAdminTicketPrice,
  setNewAdminTicketPrice,
  handleSetTicketPrice,
  isPickingWinner,
  openPrizeConfigModal,
  isPrizeConfigModalOpen,
  setIsPrizeConfigModalOpen,
  modalPrizeTiersInput = [],
  handleAddModalPrizeTierInput,
  handleRemoveModalPrizeTierInput,
  handleModalPrizeTierInputChange,
  handleSubmitPrizeConfigurationFromModal,
  currentPrizeTiers = [],
  currentPrizeTierConfigCount,
}) {
  const cardBg = useColorModeValue("white", "gray.800"); // 更深的背景以区分
  const headingColor = useColorModeValue("gray.700", "whiteAlpha.900");
  const textColor = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const inputBg = useColorModeValue("white", "gray.700");

  if (!isOwnerConnected) {
    return null;
  }

  const totalModalPercentage = modalPrizeTiersInput.reduce((sum, tier) => sum + (parseInt(tier.percentage, 10) || 0), 0);
  const isModalConfigValid = totalModalPercentage > 0 && totalModalPercentage <= 100 && modalPrizeTiersInput.every(t => t.percentage && t.count && parseInt(t.percentage) > 0 && parseInt(t.count) > 0);


  return (
   <Box p={{base: 4, md: 6}} bg={cardBg} borderRadius="xl" boxShadow="2xl" w="100%" mt="6">
      <VStack spacing="6" align="stretch">
        <Heading as="h2" size="xl" color={headingColor} textAlign="center" letterSpacing="tight">
          <Icon as={SettingsIcon} mr="3" verticalAlign="middle" color="blue.400"/>
          管理员控制中心
        </Heading>

        {/* 奖品等级配置 */}
        <Box p="5" borderWidth="1px" borderColor={borderColor} borderRadius="lg">
          <Flex justifyContent="space-between" alignItems="center" mb="4">
            <Heading as="h3" size="md" color={headingColor}>奖品等级规则</Heading>
            <Button
              leftIcon={<EditIcon />}
              colorScheme="blue"
              variant="ghost"
              size="sm"
              onClick={openPrizeConfigModal}
              isDisabled={isLoading || isPickingWinner || (lotteryStatus && players && players.length > 0)}
              _hover={{ bg: useColorModeValue("blue.50", "blue.900") }}
            >
              配置等级
            </Button>
          </Flex>
          {currentPrizeTiers.length > 0 ? (
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>等级</Th>
                    <Th isNumeric>奖池占比 (%)</Th>
                    <Th isNumeric>获奖人数</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {currentPrizeTiers.map((tier, index) => (
                    <Tr key={index} _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}>
                      <Td>等级 {index + 1}</Td>
                      <Td isNumeric><Tag colorScheme="teal">{tier.percentage}%</Tag></Td>
                      <Td isNumeric><Tag colorScheme="purple">{tier.count} 人</Tag></Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          ) : (
            <Alert status="warning" borderRadius="md" variant="subtle">
              <AlertIcon />
              <Text fontSize="sm">暂未配置奖品等级。请点击上方 "配置等级" 按钮进行设置。</Text>
            </Alert>
          )}
        </Box>

        <Divider borderColor={borderColor} />

        {/* 彩票控制 */}
        <Box p="5" borderWidth="1px" borderColor={borderColor} borderRadius="lg">
          <Heading as="h3" size="md" color={headingColor} mb="4">彩票状态控制</Heading>
          <VStack spacing="4">
            <AdminActionButton
              icon={lotteryStatus ? LockIcon : UnlockIcon}
              label={lotteryStatus ? "彩票已开启 (点击关闭需等待本轮结束)" : "开启新一轮抽奖"}
              onClick={handleOpenLottery}
              isLoading={isLoading}
              isDisabled={lotteryStatus || isLoading || isPickingWinner || currentPrizeTierConfigCount === 0}
              colorScheme={lotteryStatus ? "orange" : "green"}
              tooltipLabel={
                isPickingWinner ? "正在等待上一轮中奖结果" :
                currentPrizeTierConfigCount === 0 ? "请先配置奖品等级" :
                lotteryStatus ? "彩票已开启，关闭需等待本轮结束并通过重置" : ""
              }
            />
            <AdminActionButton
              icon={TimeIcon}
              label="抽取中奖者 (请求VRF)"
              onClick={handlePickWinner}
              isLoading={isLoading}
              isDisabled={!lotteryStatus || (players && players.length === 0) || isPickingWinner || isLoading || currentPrizeTierConfigCount === 0}
              colorScheme="purple"
              tooltipLabel={
                !lotteryStatus ? "彩票未开启" :
                (players && players.length === 0) ? "当前没有参与者" :
                isPickingWinner ? "正在开奖中..." :
                currentPrizeTierConfigCount === 0 ? "请先配置奖品等级" : ""
              }
            />
             {isPickingWinner && (
                <HStack color="orange.400" fontSize="sm" justifyContent="center">
                    <Spinner size="sm" />
                    <Text>正在等待VRF回调，请稍候...</Text>
                </HStack>
            )}
          </VStack>
        </Box>

        {/* 票价设置 */}
        <Box p="5" borderWidth="1px" borderColor={borderColor} borderRadius="lg">
          <Heading as="h3" size="md" color={headingColor} mb="4">票价管理</Heading>
          <HStack>
              <FormControl>
                <FormLabel htmlFor="newAdminTicketPrice" srOnly>新票价</FormLabel> {/* srOnly for accessibility */}
                <NumberInput
                    id="newAdminTicketPrice"
                    min={0.000001} // Example min value
                    step={0.001}
                    precision={6} // Example precision
                    value={newAdminTicketPrice}
                    onChange={(valueString) => setNewAdminTicketPrice(valueString)}
                    isDisabled={isLoading || isPickingWinner || (lotteryStatus && players && players.length > 0)}
                    bg={inputBg}
                >
                    <NumberInputField placeholder="新票价 (ETH)" />
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper>
                </NumberInput>
              </FormControl>
              <Button
                onClick={handleSetTicketPrice}
                isLoading={isLoading}
                colorScheme="blue"
                isDisabled={isLoading || isPickingWinner || (lotteryStatus && players && players.length > 0) || !newAdminTicketPrice}
                px="8"
              >
                  设置票价
              </Button>
          </HStack>
        </Box>
      </VStack>

      {/* 奖品等级配置模态框 */}
      <Modal isOpen={isPrizeConfigModalOpen} onClose={() => setIsPrizeConfigModalOpen(false)} size="2xl" scrollBehavior="inside" motionPreset="slideInBottom">
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <ModalContent mx="2" bg={cardBg} borderRadius="xl" boxShadow="dark-lg">
          <ModalHeader color={headingColor} borderBottomWidth="1px" borderColor={borderColor}>
            配置奖品等级
            {totalModalPercentage > 100 && (
                <Tag colorScheme="red" ml="2" size="sm">总和超100%</Tag>
            )}
            {totalModalPercentage > 0 && totalModalPercentage < 100 && (
                <Tag colorScheme="yellow" ml="2" size="sm">{100 - totalModalPercentage}% 未分配</Tag>
            )}
            {totalModalPercentage === 100 && (
                <Tag colorScheme="green" ml="2" size="sm">已分配100%</Tag>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} pt={4}>
            {modalPrizeTiersInput.map((tier, index) => (
              <ModalTierInputRow
                key={index}
                tier={tier}
                index={index}
                handleModalPrizeTierInputChange={handleModalPrizeTierInputChange}
                handleRemoveModalPrizeTierInput={handleRemoveModalPrizeTierInput}
                canRemove={modalPrizeTiersInput.length > 1}
                isLoading={isLoading}
              />
            ))}
            <Button leftIcon={<AddIcon />} onClick={handleAddModalPrizeTierInput} size="sm" variant="outline" mt="2" isDisabled={isLoading}>
              添加一个等级
            </Button>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor={borderColor}>
            <Button variant="ghost" onClick={() => setIsPrizeConfigModalOpen(false)} mr={3} isDisabled={isLoading}>
              取消
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmitPrizeConfigurationFromModal}
              isLoading={isLoading}
              isDisabled={isLoading || isPickingWinner || !isModalConfigValid}
              leftIcon={<CheckCircleIcon />}
            >
              保存并应用配置
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default AdminPanel;
