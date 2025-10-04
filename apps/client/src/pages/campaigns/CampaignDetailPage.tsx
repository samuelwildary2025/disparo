import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  HStack,
  Progress,
  SimpleGrid,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchCampaign, fetchCampaignReport, pauseCampaign, resumeCampaign, startCampaign } from "../../api/campaigns";
import type { CampaignDetail } from "../../types";
import { useRealtime } from "../../hooks/useRealtime";
import type { CampaignProgress } from "@app-disparo/shared";

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => fetchCampaign(id!) ,
    enabled: Boolean(id)
  });

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [progress, setProgress] = useState<CampaignProgress | null>(null);

  useEffect(() => {
    if (data) {
      setCampaign(data);
      const totals = computeProgress(data);
      setProgress(totals);
    }
  }, [data]);

  const startMut = useMutation({
    mutationFn: startCampaign,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaign", id] })
  });
  const pauseMut = useMutation({
    mutationFn: pauseCampaign,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaign", id] })
  });
  const resumeMut = useMutation({
    mutationFn: resumeCampaign,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaign", id] })
  });

  useRealtime({
    campaignId: id,
    onDispatchEvent: (event) => {
      setCampaign((current) => {
        if (!current) return current;
        return {
          ...current,
          dispatches: current.dispatches.map((dispatch) =>
            dispatch.id === event.dispatchId
              ? {
                  ...dispatch,
                  status: event.status,
                  messageBody: event.message ?? dispatch.messageBody,
                  errorMessage: event.error ?? dispatch.errorMessage,
                  updatedAt: event.timestamp
                }
              : dispatch
          )
        };
      });
    },
    onProgress: (payload) => {
      setProgress(payload);
      setCampaign((current) => (current ? { ...current, status: payload.status } : current));
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    }
  });

  const handleExport = async () => {
    if (!id) return;
    const blob = await fetchCampaignReport(id, "csv");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !campaign) {
    return <Text>Carregando campanha...</Text>;
  }

  const totals = progress ?? computeProgress(campaign);

  return (
    <Stack spacing={6}>
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="lg">{campaign.name}</Heading>
          <HStack spacing={3} mt={2}>
            <Badge colorScheme="blue">Template: {campaign.template.name}</Badge>
            <Badge colorScheme="purple">Lista: {campaign.contactList.name}</Badge>
            <Badge colorScheme="teal">Instância: {campaign.instance.name}</Badge>
            <Badge colorScheme="yellow">Modo: {campaign.mode}</Badge>
            <Badge colorScheme="cyan">Passos: {campaign.steps?.length ?? 1}</Badge>
          </HStack>
        </Box>
        <HStack spacing={3}>
          <Button variant="outline" onClick={handleExport}>
            Exportar relatório
          </Button>
          {campaign.status === "running" ? (
            <Button colorScheme="yellow" onClick={() => pauseMut.mutate(campaign.id)} isLoading={pauseMut.isPending}>
              Pausar
            </Button>
          ) : null}
          {campaign.status === "paused" ? (
            <Button colorScheme="green" onClick={() => resumeMut.mutate(campaign.id)} isLoading={resumeMut.isPending}>
              Retomar
            </Button>
          ) : null}
          {campaign.status === "draft" || campaign.status === "scheduled" ? (
            <Button colorScheme="blue" onClick={() => startMut.mutate(campaign.id)} isLoading={startMut.isPending}>
              Iniciar
            </Button>
          ) : null}
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <StatBox title="Total" value={totals.total} />
        <StatBox title="Enviadas" value={totals.completed} color="green.400" />
        <StatBox title="Falhas" value={totals.failed} color="red.400" />
      </SimpleGrid>

      <Box>
        <Text mb={2}>Progresso</Text>
        <Progress value={totals.total ? (totals.completed / totals.total) * 100 : 0} rounded="md" />
      </Box>

      <Box borderWidth="1px" borderColor="gray.700" borderRadius="lg" p={4}>
        <Heading size="md" mb={3}>
          Contatos
        </Heading>
        <Table size="sm" variant="simple" colorScheme="whiteAlpha">
          <Thead>
            <Tr>
              <Th>Contato</Th>
              <Th>Telefone</Th>
              <Th>Status</Th>
              <Th>Etapas</Th>
              <Th>Mensagem</Th>
              <Th>Erro</Th>
            </Tr>
          </Thead>
          <Tbody>
            {campaign.dispatches.map((dispatch) => (
              <Tr key={dispatch.id}>
                <Td>{dispatch.contact.name}</Td>
                <Td>{dispatch.contact.phoneNumber}</Td>
                <Td>
                  <Badge>{dispatch.status}</Badge>
                </Td>
                <Td>
                  {(() => {
                    const total = campaign.steps?.length ?? 1;
                    const done = dispatch.steps?.filter((step) => step.status === "success").length ?? 0;
                    return `${done}/${total}`;
                  })()}
                </Td>
                <Td>{dispatch.messageBody?.slice(0, 60)}</Td>
                <Td color="red.300">{dispatch.errorMessage}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <Divider />
      <AntiBanConfig config={campaign.antiBanConfig as Record<string, unknown>} />
    </Stack>
  );
}

function computeProgress(campaign: CampaignDetail): CampaignProgress {
  const total = campaign.dispatches.length;
  const completed = campaign.dispatches.filter((d) => d.status === "success").length;
  const failed = campaign.dispatches.filter((d) => d.status === "failed").length;
  const inFlight = campaign.dispatches.filter((d) => d.status === "processing").length;
  return {
    campaignId: campaign.id,
    total,
    completed,
    failed,
    inFlight,
    status: campaign.status
  };
}

interface StatProps {
  title: string;
  value: number;
  color?: string;
}

function StatBox({ title, value, color }: StatProps) {
  return (
    <Box borderWidth="1px" borderColor="gray.700" borderRadius="lg" p={4}>
      <Text color="gray.400">{title}</Text>
      <Heading size="md" color={color ?? "white"}>
        {value}
      </Heading>
    </Box>
  );
}

function AntiBanConfig({ config }: { config: Record<string, unknown> }) {
  const allowed = (config.allowedWindows as Array<{ start: string; end: string }>) ?? [];
  return (
    <Box>
      <Heading size="md" mb={3}>
        Regras anti-ban
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Info label="Intervalo mínimo" value={`${config.minIntervalSeconds}s`} />
        <Info label="Intervalo máximo" value={`${config.maxIntervalSeconds}s`} />
        <Info label="Mensagens até pausa" value={`${config.longPauseEvery}`} />
        <Info label="Pausa longa mínima" value={`${config.longPauseMinSeconds}s`} />
        <Info label="Pausa longa máxima" value={`${config.longPauseMaxSeconds}s`} />
        <Info label="Limite diário" value={`${config.dailyLimit}`} />
      </SimpleGrid>
      <Box mt={4}>
        <Text fontWeight="semibold">Janelas permitidas</Text>
        <HStack spacing={2} wrap="wrap" mt={2}>
          {allowed.map((window, idx) => (
            <Badge key={idx} colorScheme="green">
              {window.start} - {window.end}
            </Badge>
          ))}
        </HStack>
      </Box>
    </Box>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <Box borderWidth="1px" borderColor="gray.700" borderRadius="md" p={3}>
      <Text color="gray.400" fontSize="sm">
        {label}
      </Text>
      <Text fontWeight="semibold">{value}</Text>
    </Box>
  );
}
