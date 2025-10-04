import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { FiEye, FiPlay, FiPause } from "react-icons/fi";
import {
  createCampaign,
  fetchCampaigns,
  pauseCampaign,
  resumeCampaign,
  startCampaign
} from "../../api/campaigns";
import type { CampaignCreateDto } from "@app-disparo/shared";
import { CampaignFormDrawer } from "./CampaignFormDrawer";

const statusColors: Record<string, string> = {
  running: "green",
  completed: "blue",
  failed: "red",
  paused: "yellow",
  scheduled: "purple",
  draft: "gray"
};

export function CampaignListPage() {
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: fetchCampaigns
  });
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const drawer = useDisclosure();

  const createMutation = useMutation({
    mutationFn: (payload: CampaignCreateDto) => createCampaign(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      drawer.onClose();
      toast({ title: "Campanha criada", status: "success" });
    },
    onError: () => {
      toast({ title: "Não foi possível criar a campanha", status: "error" });
    }
  });

  const startMutation = useMutation({
    mutationFn: startCampaign,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns"] })
  });

  const pauseMutation = useMutation({
    mutationFn: pauseCampaign,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns"] })
  });

  const resumeMutation = useMutation({
    mutationFn: resumeCampaign,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns"] })
  });

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg">Campanhas</Heading>
        </Box>
        <Button colorScheme="blue" onClick={drawer.onOpen}>
          Nova campanha
        </Button>
      </Flex>

      <Box borderWidth="1px" borderColor="gray.700" borderRadius="lg" overflow="hidden">
        <Table variant="simple" colorScheme="whiteAlpha">
          <Thead bg="gray.800">
            <Tr>
              <Th>Nome</Th>
              <Th>Status</Th>
              <Th>Lista</Th>
              <Th isNumeric>Contatos</Th>
              <Th isNumeric>Passos</Th>
              <Th>Instância</Th>
              <Th>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {campaigns.map((campaign) => (
              <Tr key={campaign.id} _hover={{ bg: "gray.800" }}>
                <Td>{campaign.name}</Td>
                <Td>
                  <Badge colorScheme={statusColors[campaign.status] ?? "gray"} textTransform="capitalize">
                    {campaign.status}
                  </Badge>
                </Td>
                <Td>{campaign.contactList.name}</Td>
                <Td isNumeric>{campaign.contactList.totalCount}</Td>
                <Td isNumeric>{campaign.steps?.length ?? 1}</Td>
                <Td>{campaign.instance.name}</Td>
                <Td>
                  <HStack spacing={2}>
                    <IconButton
                      aria-label="ver"
                      icon={<FiEye />}
                      size="sm"
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                    />
                    {campaign.status !== "running" && campaign.status !== "completed" ? (
                      <IconButton
                        aria-label="iniciar"
                        icon={<FiPlay />}
                        size="sm"
                        isLoading={startMutation.isPending}
                        onClick={() => startMutation.mutate(campaign.id)}
                      />
                    ) : null}
                    {campaign.status === "running" ? (
                      <IconButton
                        aria-label="pausar"
                        icon={<FiPause />}
                        size="sm"
                        isLoading={pauseMutation.isPending}
                        onClick={() => pauseMutation.mutate(campaign.id)}
                      />
                    ) : null}
                    {campaign.status === "paused" ? (
                      <Button size="sm" onClick={() => resumeMutation.mutate(campaign.id)}>
                        Retomar
                      </Button>
                    ) : null}
                  </HStack>
                </Td>
              </Tr>
            ))}
            {!isLoading && campaigns.length === 0 ? (
              <Tr>
                <Td colSpan={6} textAlign="center" py={10} color="gray.400">
                  Nenhuma campanha cadastrada até o momento.
                </Td>
              </Tr>
            ) : null}
          </Tbody>
        </Table>
      </Box>

      <CampaignFormDrawer
        isOpen={drawer.isOpen}
        onClose={drawer.onClose}
        onSubmit={(values) => createMutation.mutate(values)}
        isSubmitting={createMutation.isPending}
      />
    </Box>
  );
}
