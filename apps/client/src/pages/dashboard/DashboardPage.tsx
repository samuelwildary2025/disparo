import {
  Box,
  Flex,
  Heading,
  SimpleGrid,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import { fetchCampaigns } from "../../api/campaigns";
import { fetchContactLists } from "../../api/contact-lists";
import { fetchInstances } from "../../api/instances";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export function DashboardPage() {
  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: fetchCampaigns
  });
  const { data: lists = [] } = useQuery({
    queryKey: ["contact-lists"],
    queryFn: fetchContactLists
  });
  const { data: instances = [] } = useQuery({
    queryKey: ["instances"],
    queryFn: fetchInstances
  });

  const statusCounts = campaigns.reduce(
    (acc, campaign) => {
      acc[campaign.status] = (acc[campaign.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const chartData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        label: "Campanhas",
        data: Object.values(statusCounts),
        backgroundColor: "rgba(20, 135, 230, 0.6)",
        borderRadius: 6
      }
    ]
  };

  return (
    <Flex direction="column" gap={8}>
      <Box>
        <Heading size="lg" mb={2}>
          Visão Geral
        </Heading>
        <Text color="gray.400">
          Acompanhe as métricas principais das suas campanhas de disparo inteligente.
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={6}>
        <StatCard
          label="Campanhas ativas"
          value={campaigns.filter((c) => c.status === "running").length}
          helper="Campanhas em andamento"
        />
        <StatCard
          label="Campanhas concluídas"
          value={campaigns.filter((c) => c.status === "completed").length}
          helper="Total nos últimos 30 dias"
        />
        <StatCard
          label="Listas de contatos"
          value={lists.length}
          helper="Listas disponíveis"
        />
        <StatCard
          label="Instâncias conectadas"
          value={instances.filter((inst) => inst.status === "connected").length}
          helper={`${instances.length} instâncias no total`}
        />
      </SimpleGrid>

      <Box
        bg="gray.800"
        borderWidth="1px"
        borderColor="gray.700"
        borderRadius="lg"
        p={6}
      >
        <Heading size="md" mb={4}>
          Status das campanhas
        </Heading>
        <Bar
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                ticks: {
                  precision: 0,
                  color: "#CBD5F5"
                }
              },
              x: {
                ticks: {
                  color: "#CBD5F5"
                }
              }
            }
          }}
        />
      </Box>
    </Flex>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  helper: string;
}

function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <Stat bg="gray.800" borderWidth="1px" borderColor="gray.700" borderRadius="lg" p={6}>
      <StatLabel color="gray.400">{label}</StatLabel>
      <StatNumber>{value}</StatNumber>
      <StatHelpText color="gray.500">{helper}</StatHelpText>
    </Stat>
  );
}
