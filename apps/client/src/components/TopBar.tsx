import {
  Avatar,
  Box,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
  useColorMode
} from "@chakra-ui/react";
import { FiMenu, FiMoon, FiSun } from "react-icons/fi";
import { useAuth } from "../store/auth";

interface Props {
  onOpenSidebar: () => void;
}

export function TopBar({ onOpenSidebar }: Props) {
  const { colorMode, toggleColorMode } = useColorMode();
  const { user, logout } = useAuth();

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      px={6}
      py={4}
      borderBottomWidth="1px"
      borderBottomColor="gray.800"
      bg="gray.900"
      position="sticky"
      top={0}
      zIndex={10}
    >
      <IconButton
        display={{ base: "inline-flex", lg: "none" }}
        onClick={onOpenSidebar}
        icon={<FiMenu />}
        aria-label="Abrir menu"
        variant="ghost"
      />

      <Box>
        <Text fontSize="lg" fontWeight="semibold">
          {user ? `Olá, ${user.name}` : "Disparo Inteligente"}
        </Text>
        <Text fontSize="sm" color="gray.400">
          Plataforma de automação humanizada para WhatsApp
        </Text>
      </Box>

      <HStack spacing={3}>
        <IconButton
          aria-label="Alternar tema"
          icon={colorMode === "light" ? <FiMoon /> : <FiSun />}
          onClick={toggleColorMode}
          variant="ghost"
        />
        <Menu>
          <MenuButton>
            <Avatar size="sm" name={user?.name} />
          </MenuButton>
          <MenuList bg="gray.800" borderColor="gray.700">
            <Box px={3} py={2}>
              <Text fontWeight="semibold">{user?.name}</Text>
              <Text fontSize="sm" color="gray.400">
                {user?.email}
              </Text>
            </Box>
            <MenuDivider />
            <MenuItem onClick={logout}>Sair</MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  );
}
