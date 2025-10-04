import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createInstance, fetchInstances, testInstance } from "../../api/instances";
import { addToBlacklist, fetchBlacklist, removeFromBlacklist } from "../../api/blacklist";
import { testEvolution, testOpenAI } from "../../api/config";

const instanceSchema = z.object({
  name: z.string().min(1),
  evolutionUrl: z.string().url(),
  apiKey: z.string().min(10)
});

type InstanceFormValues = z.infer<typeof instanceSchema>;

const blacklistSchema = z.object({
  phoneNumber: z.string().min(8),
  reason: z.string().optional()
});

type BlacklistFormValues = z.infer<typeof blacklistSchema>;

export function SettingsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<InstanceFormValues>({ resolver: zodResolver(instanceSchema) });

  const {
    register: registerBlacklist,
    handleSubmit: handleBlacklistSubmit,
    reset: resetBlacklist,
    formState: { errors: blacklistErrors }
  } = useForm<BlacklistFormValues>({ resolver: zodResolver(blacklistSchema) });

  const { data: instances = [] } = useQuery({ queryKey: ["instances"], queryFn: fetchInstances });
  const { data: blacklist = [] } = useQuery({ queryKey: ["blacklist"], queryFn: fetchBlacklist });

  const createInstanceMutation = useMutation({
    mutationFn: createInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instances"] });
      toast({ title: "Instância cadastrada", status: "success" });
      reset();
    },
    onError: () => toast({ title: "Erro ao cadastrar instância", status: "error" })
  });

  const testEvolutionMutation = useMutation({
    mutationFn: testEvolution,
    onSuccess: (result) => {
      toast({
        title: result.status === "connected" ? "Conectado" : "Falha",
        status: result.status === "connected" ? "success" : "error",
        description: result.message
      });
    }
  });

  const testOpenAIMutation = useMutation({
    mutationFn: testOpenAI,
    onSuccess: (result) => toast({ title: "OpenAI respondendo", description: result.message, status: "success" }),
    onError: () => toast({ title: "Falha ao testar OpenAI", status: "error" })
  });

  const addBlacklistMutation = useMutation({
    mutationFn: (values: BlacklistFormValues) => addToBlacklist(values.phoneNumber, values.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blacklist"] });
      toast({ title: "Número adicionado à blacklist", status: "success" });
      resetBlacklist();
    },
    onError: () => toast({ title: "Erro ao adicionar número", status: "error" })
  });

  const removeBlacklistMutation = useMutation({
    mutationFn: removeFromBlacklist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blacklist"] });
      toast({ title: "Número removido", status: "success" });
    }
  });

  const testInstanceMutation = useMutation({
    mutationFn: testInstance,
    onSuccess: (result) => {
      toast({
        title: result.status === "connected" ? "Instância ativa" : "Falha na instância",
        status: result.status === "connected" ? "success" : "error",
        description: result.message
      });
      queryClient.invalidateQueries({ queryKey: ["instances"] });
    }
  });

  return (
    <Box>
      <Heading size="lg" mb={4}>
        Configurações
      </Heading>
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Integrações</Tab>
          <Tab>Instâncias WhatsApp</Tab>
          <Tab>Blacklist</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Stack spacing={6}>
              <Box borderWidth="1px" borderColor="gray.700" borderRadius="lg" p={6}>
                <Heading size="md" mb={4}>
                  Testar OpenAI
                </Heading>
                <Button onClick={() => testOpenAIMutation.mutate()} isLoading={testOpenAIMutation.isPending}>
                  Enviar mensagem de teste
                </Button>
              </Box>

              <Box borderWidth="1px" borderColor="gray.700" borderRadius="lg" p={6}>
                <Heading size="md" mb={4}>
                  Testar Evolution API
                </Heading>
                <form
                  onSubmit={handleSubmit((values) => testEvolutionMutation.mutate({
                    evolutionUrl: values.evolutionUrl,
                    apiKey: values.apiKey
                  }))}
                >
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isInvalid={!!errors.name}>
                      <FormLabel>Nome</FormLabel>
                      <Input placeholder="Instância principal" {...register("name")} />
                      <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={!!errors.evolutionUrl}>
                      <FormLabel>URL da Evolution API</FormLabel>
                      <Input placeholder="https://api.seu-servidor.com" {...register("evolutionUrl")} />
                      <FormErrorMessage>{errors.evolutionUrl?.message}</FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={!!errors.apiKey}>
                      <FormLabel>API Key</FormLabel>
                      <Input placeholder="evo_123" {...register("apiKey")} />
                      <FormErrorMessage>{errors.apiKey?.message}</FormErrorMessage>
                    </FormControl>
                  </SimpleGrid>
                  <HStack mt={4} spacing={3}>
                    <Button colorScheme="blue" type="submit" isLoading={testEvolutionMutation.isPending}>
                      Testar conexão
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() =>
                        createInstanceMutation.mutate({
                          name: watch("name") ?? "",
                          evolutionUrl: watch("evolutionUrl") ?? "",
                          apiKey: watch("apiKey") ?? ""
                        })
                      }
                      isLoading={createInstanceMutation.isPending}
                    >
                      Salvar instância
                    </Button>
                  </HStack>
                </form>
              </Box>
            </Stack>
          </TabPanel>
          <TabPanel>
            <Table variant="simple" colorScheme="whiteAlpha">
              <Thead>
                <Tr>
                  <Th>Nome</Th>
                  <Th>Endpoint</Th>
                  <Th>Status</Th>
                  <Th>Ações</Th>
                </Tr>
              </Thead>
              <Tbody>
                {instances.map((instance) => (
                  <Tr key={instance.id}>
                    <Td>{instance.name}</Td>
                    <Td>{instance.evolutionUrl}</Td>
                    <Td>
                      <Badge colorScheme={instance.status === "connected" ? "green" : "red"}>
                        {instance.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Button size="sm" onClick={() => testInstanceMutation.mutate(instance.id)} isLoading={testInstanceMutation.isPending}>
                        Testar
                      </Button>
                    </Td>
                  </Tr>
                ))}
                {instances.length === 0 ? (
                  <Tr>
                    <Td colSpan={4} textAlign="center" py={8} color="gray.400">
                      Nenhuma instância cadastrada.
                    </Td>
                  </Tr>
                ) : null}
              </Tbody>
            </Table>
          </TabPanel>
          <TabPanel>
            <Stack spacing={6}>
              <Box borderWidth="1px" borderColor="gray.700" borderRadius="lg" p={6}>
                <Heading size="md" mb={4}>
                  Adicionar à blacklist
                </Heading>
                <form onSubmit={handleBlacklistSubmit((values) => addBlacklistMutation.mutate(values))}>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isInvalid={!!blacklistErrors.phoneNumber}>
                      <FormLabel>Telefone</FormLabel>
                      <Input placeholder="5511999999999" {...registerBlacklist("phoneNumber")} />
                      <FormErrorMessage>{blacklistErrors.phoneNumber?.message}</FormErrorMessage>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Motivo</FormLabel>
                      <Input placeholder="Opt-out" {...registerBlacklist("reason")} />
                    </FormControl>
                  </SimpleGrid>
                  <Button type="submit" mt={4} colorScheme="red" isLoading={addBlacklistMutation.isPending}>
                    Adicionar
                  </Button>
                </form>
              </Box>

              <Box borderWidth="1px" borderColor="gray.700" borderRadius="lg" p={6}>
                <Heading size="md" mb={4}>
                  Números bloqueados
                </Heading>
                <Table variant="simple" colorScheme="whiteAlpha">
                  <Thead>
                    <Tr>
                      <Th>Telefone</Th>
                      <Th>Motivo</Th>
                      <Th>Desde</Th>
                      <Th>Ações</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {blacklist.map((entry) => (
                      <Tr key={entry.id}>
                        <Td>{entry.phoneNumber}</Td>
                        <Td>{entry.reason ?? "-"}</Td>
                        <Td>{new Date(entry.createdAt).toLocaleString()}</Td>
                        <Td>
                          <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => removeBlacklistMutation.mutate(entry.phoneNumber)}
                          >
                            Remover
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                    {blacklist.length === 0 ? (
                      <Tr>
                        <Td colSpan={4} textAlign="center" py={8} color="gray.400">
                          Nenhum número na blacklist.
                        </Td>
                      </Tr>
                    ) : null}
                  </Tbody>
                </Table>
              </Box>
            </Stack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
