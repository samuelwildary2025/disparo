import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Textarea,
  Tr,
  useToast
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { extractTemplateVariables, messageTemplateSchema } from "@app-disparo/shared";
import { createTemplate, fetchTemplates, updateTemplate } from "../../api/templates";

const formSchema = messageTemplateSchema.extend({ id: z.string().optional() });

type FormValues = z.infer<typeof formSchema>;

export function TemplatesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: templates = [] } = useQuery({ queryKey: ["templates"], queryFn: fetchTemplates });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      content: "",
      variables: []
    }
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        name: values.name,
        content: values.content,
        variables: extractTemplateVariables(values.content)
      };
      if (values.id) {
        return updateTemplate(values.id, payload);
      }
      return createTemplate(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast({ title: "Template salvo", status: "success" });
      reset({ name: "", content: "", variables: [] });
    },
    onError: () => toast({ title: "Erro ao salvar template", status: "error" })
  });

  const onSubmit = (values: FormValues) => mutation.mutate(values);

  return (
    <Flex direction={{ base: "column", lg: "row" }} gap={8} align="start">
      <Box flex="1" borderWidth="1px" borderColor="gray.700" borderRadius="lg" p={6}>
        <Heading size="md" mb={4}>
          Cadastro de template
        </Heading>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={4}>
            <Input type="hidden" {...register("id")} />
            <Box>
              <Text fontWeight="semibold">Nome</Text>
              <Input placeholder="Template de boas-vindas" {...register("name")} />
              <Text color="red.300" fontSize="sm">
                {errors.name?.message}
              </Text>
            </Box>
            <Box>
              <Text fontWeight="semibold">Conteúdo</Text>
              <Textarea rows={6} placeholder="Olá {nome}, tudo bem?" {...register("content")} />
              <Text color="red.300" fontSize="sm">
                {errors.content?.message}
              </Text>
            </Box>
            <Button type="submit" colorScheme="blue" isLoading={mutation.isPending}>
              Salvar template
            </Button>
            <Button variant="ghost" onClick={() => reset({ id: undefined, name: "", content: "", variables: [] })}>
              Novo template
            </Button>
          </Stack>
        </form>
      </Box>

      <Box flex="1" borderWidth="1px" borderColor="gray.700" borderRadius="lg" p={6}>
        <Heading size="md" mb={4}>
          Templates cadastrados
        </Heading>
        <Table variant="simple" colorScheme="whiteAlpha" size="sm">
          <Thead>
            <Tr>
              <Th>Nome</Th>
              <Th>Variáveis detectadas</Th>
              <Th>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {templates.map((template) => (
              <Tr key={template.id}>
                <Td>{template.name}</Td>
                <Td>
                  <HStack spacing={2} wrap="wrap">
                    {template.variables.map((variable) => (
                      <Box key={variable} bg="gray.800" px={2} py={1} borderRadius="md">
                        {variable}
                      </Box>
                    ))}
                  </HStack>
                </Td>
                <Td>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      reset({ id: template.id, name: template.name, content: template.content, variables: template.variables })
                    }
                  >
                    Editar
                  </Button>
                </Td>
              </Tr>
            ))}
            {templates.length === 0 ? (
              <Tr>
                <Td colSpan={3} textAlign="center" py={8} color="gray.400">
                  Nenhum template cadastrado.
                </Td>
              </Tr>
            ) : null}
          </Tbody>
        </Table>
      </Box>
    </Flex>
  );
}
