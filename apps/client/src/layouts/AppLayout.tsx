import { ReactNode } from "react";
import { Box, Flex, useDisclosure } from "@chakra-ui/react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";

interface Props {
  children: ReactNode;
}

export function AppLayout({ children }: Props) {
  const disclosure = useDisclosure();

  return (
    <Flex minH="100vh" bg="gray.900" color="gray.50">
      <Sidebar isOpen={disclosure.isOpen} onClose={disclosure.onClose} />
      <Box flex="1" ml={{ base: 0, lg: 64 }} transition="margin-left 0.2s ease">
        <TopBar onOpenSidebar={disclosure.onOpen} />
        <Box as="main" p={{ base: 4, md: 8 }} bg="gray.900" minH="calc(100vh - 64px)">
          {children}
        </Box>
      </Box>
    </Flex>
  );
}
