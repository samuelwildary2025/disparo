import {
  Box,
  Drawer,
  DrawerContent,
  Flex,
  Icon,
  Link,
  Text,
  VStack
} from "@chakra-ui/react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FiBarChart2,
  FiUsers,
  FiMessageCircle,
  FiSettings,
  FiLayers
} from "react-icons/fi";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: "Dashboard", icon: FiBarChart2, to: "/" },
  { label: "Campanhas", icon: FiLayers, to: "/campaigns" },
  { label: "Listas de Contatos", icon: FiUsers, to: "/contact-lists" },
  { label: "Templates", icon: FiMessageCircle, to: "/templates" },
  { label: "Configurações", icon: FiSettings, to: "/settings" }
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  const content = (
    <Box
      w={{ base: "full", lg: 64 }}
      pos="fixed"
      h="full"
      bg="gray.950"
      borderRightWidth="1px"
      borderRightColor="gray.800"
      px={6}
      py={8}
    >
      <Text fontSize="xl" fontWeight="bold" mb={8} color="brand.400">
        Disparo Inteligente
      </Text>
      <VStack align="stretch" spacing={2}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
          return (
            <Link
              as={NavLink}
              to={item.to}
              key={item.to}
              onClick={onClose}
              px={3}
              py={2.5}
              borderRadius="md"
              bg={isActive ? "brand.500" : "transparent"}
              color={isActive ? "white" : "gray.300"}
              _hover={{ bg: "brand.600", color: "white" }}
            >
              <Flex align="center" gap={3}>
                <Icon as={item.icon} fontSize="lg" />
                <Text fontWeight="medium">{item.label}</Text>
              </Flex>
            </Link>
          );
        })}
      </VStack>
    </Box>
  );

  return (
    <>
      <Box display={{ base: "none", lg: "block" }}>{content}</Box>
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        size="xs"
      >
        <DrawerContent bg="gray.900">{content}</DrawerContent>
      </Drawer>
    </>
  );
}
