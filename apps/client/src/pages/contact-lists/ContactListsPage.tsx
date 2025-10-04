import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
  VStack
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { fetchContactLists, publishContactList, uploadContactList } from "../../api/contact-lists";

export function ContactListsPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: lists = [] } = useQuery({
    queryKey: ["contact-lists"],
    queryFn: fetchContactLists
  });

  const uploadMutation = useMutation({
    mutationFn: uploadContactList,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["contact-lists"] });
      toast({
        title: "Lista carregada",
        description:
          result.errors.length > 0
            ? `${result.errors.length} contatos foram ignorados`
            : "Todos os contatos foram importados",
        status: result.errors.length > 0 ? "warning" : "success"
      });
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
    },
    onError: () => toast({ title: "Falha ao importar CSV", status: "error" })
  });

  const publishMutation = useMutation({
    mutationFn: publishContactList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-lists"] });
      toast({ title: "Lista publicada", status: "success" });
    }
  });

  return (
    <VStack align="stretch" spacing={6}>
      <Heading size="lg">Listas de Contatos</Heading>

      <Box borderWidth="1px" borderColor="gray.700" borderRadius="lg" p={6}>
        <Heading size="md" mb={4}>
          Importar nova lista
        </Heading>
        <Flex gap={3} wrap="wrap" align="center">
          <Input
            type="file"
            accept=".csv"
            ref={fileRef}
            onChange={(event) => {
              const file = event.target.files?.[0];
              setSelectedFile(file ?? null);
            }}
            maxW={"sm"}
          />
          <Button
            colorScheme="blue"
            onClick={() => {
              if (!selectedFile) {
                toast({ title: "Selecione um arquivo CSV", status: "warning" });
                return;
              }
              uploadMutation.mutate({ file: selectedFile, name: selectedFile.name });
            }}
            isLoading={uploadMutation.isPending}
          >
            Enviar CSV
          </Button>
          <Text color="gray.400">Formato esperado: csvnome,telefone,empresa,variavel_custom</Text>
        </Flex>
      </Box>

      <Box borderWidth="1px" borderColor="gray.700" borderRadius="lg">
        <Table variant="simple" colorScheme="whiteAlpha">
          <Thead>
            <Tr>
              <Th>Nome</Th>
              <Th>Status</Th>
              <Th isNumeric>Contatos</Th>
              <Th>Última atualização</Th>
              <Th>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {lists.map((list) => (
              <Tr key={list.id}>
                <Td>{list.name}</Td>
                <Td>{list.isDraft ? "Rascunho" : "Publicado"}</Td>
                <Td isNumeric>{list.totalCount}</Td>
                <Td>{new Date(list.createdAt).toLocaleString()}</Td>
                <Td>
                  {list.isDraft ? (
                    <Button size="sm" onClick={() => publishMutation.mutate(list.id)} isLoading={publishMutation.isPending}>
                      Publicar
                    </Button>
                  ) : (
                    <Text fontSize="sm" color="gray.500">
                      Pronta para uso
                    </Text>
                  )}
                </Td>
              </Tr>
            ))}
            {lists.length === 0 ? (
              <Tr>
                <Td colSpan={5} textAlign="center" py={8} color="gray.400">
                  Nenhuma lista cadastrada ainda.
                </Td>
              </Tr>
            ) : null}
          </Tbody>
        </Table>
      </Box>
    </VStack>
  );
}
