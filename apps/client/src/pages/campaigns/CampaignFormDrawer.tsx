import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Textarea,
  IconButton,
  Text
} from "@chakra-ui/react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { fetchTemplates } from "../../api/templates";
import { fetchContactLists } from "../../api/contact-lists";
import { fetchInstances } from "../../api/instances";
import type { CampaignCreateDto } from "@app-disparo/shared";

const antiBanSchema = z.object({
  minIntervalSeconds: z.coerce.number().min(1),
  maxIntervalSeconds: z.coerce.number().min(1),
  longPauseEvery: z.coerce.number().min(1),
  longPauseMinSeconds: z.coerce.number().min(1),
  longPauseMaxSeconds: z.coerce.number().min(1),
  dailyLimit: z.coerce.number().min(1),
  allowedWindows: z
    .array(
      z.object({
        start: z.string().regex(/^\d{2}:\d{2}$/),
        end: z.string().regex(/^\d{2}:\d{2}$/)
      })
    )
    .min(1)
});

const schema = z.object({
  name: z.string().min(1),
  templateId: z.string().min(1),
  followupTemplateId: z.string().min(1),
  contactListId: z.string().min(1),
  instanceId: z.string().min(1),
  scheduleAt: z.string().optional(),
  mode: z.enum(["test", "live"]),
  testSampleSize: z.string().optional(),
  antiBan: antiBanSchema,
  delaySeconds: z.coerce.number().min(0)
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  name: "",
  templateId: "",
  followupTemplateId: "",
  contactListId: "",
  instanceId: "",
  scheduleAt: "",
  mode: "live",
  testSampleSize: "10",
  antiBan: {
    minIntervalSeconds: 15,
    maxIntervalSeconds: 45,
    longPauseEvery: 20,
    longPauseMinSeconds: 120,
    longPauseMaxSeconds: 300,
    dailyLimit: 200,
    allowedWindows: [{ start: "08:00", end: "20:00" }]
  },
  delaySeconds: 45
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CampaignCreateDto) => void;
  isSubmitting: boolean;
}

export function CampaignFormDrawer({ isOpen, onClose, onSubmit, isSubmitting }: Props) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues
  });

  const { fields: windowFields, append: appendWindow, remove: removeWindow } = useFieldArray({
    control,
    name: "antiBan.allowedWindows"
  });

  const { data: templates = [] } = useQuery({ queryKey: ["templates"], queryFn: fetchTemplates });
  const { data: contactLists = [] } = useQuery({
    queryKey: ["contact-lists"],
    queryFn: fetchContactLists
  });
  const { data: instances = [] } = useQuery({ queryKey: ["instances"], queryFn: fetchInstances });

  const mode = watch("mode");
  const selectedTemplateId = watch("templateId");
  const delaySeconds = watch("delaySeconds");

  const submitHandler = (values: FormValues) => {
    const stepsPayload = [
      {
        templateId: values.templateId,
        delayMinSeconds: 0,
        delayMaxSeconds: 0,
        aiVariation: true
      },
      {
        templateId: values.followupTemplateId,
        delayMinSeconds: values.delaySeconds,
        delayMaxSeconds: values.delaySeconds,
        aiVariation: true
      }
    ];

    const payload: CampaignCreateDto = {
      name: values.name,
      templateId: stepsPayload[0].templateId,
      contactListId: values.contactListId,
      instanceId: values.instanceId,
      scheduleAt: values.scheduleAt ? new Date(values.scheduleAt).toISOString() : undefined,
      antiBan: {
        ...values.antiBan,
        minIntervalSeconds: Number(values.antiBan.minIntervalSeconds),
        maxIntervalSeconds: Number(values.antiBan.maxIntervalSeconds),
        longPauseEvery: Number(values.antiBan.longPauseEvery),
        longPauseMinSeconds: Number(values.antiBan.longPauseMinSeconds),
        longPauseMaxSeconds: Number(values.antiBan.longPauseMaxSeconds),
        dailyLimit: Number(values.antiBan.dailyLimit)
      },
      mode: values.mode,
      testSampleSize: values.mode === "test" ? Number(values.testSampleSize ?? 10) : undefined,
      steps: stepsPayload
    };

    onSubmit(payload);
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="lg">
      <DrawerOverlay />
      <DrawerContent bg="gray.900">
        <DrawerCloseButton />
        <DrawerHeader>Nova campanha</DrawerHeader>
        <DrawerBody>
          <Stack spacing={6}>
            <FormControl isInvalid={!!errors.name}>
              <FormLabel>Nome</FormLabel>
              <Input placeholder="Campanha WhatsApp" {...register("name")} />
              <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
            </FormControl>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isInvalid={!!errors.templateId}>
                <FormLabel>Template principal</FormLabel>
                <Select placeholder="Selecione" {...register("templateId")}>
                  {templates.map((template) => (
                    <option value={template.id} key={template.id}>
                      {template.name}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.templateId?.message}</FormErrorMessage>
                <Text fontSize="sm" color="gray.400" mt={1}>
                  O primeiro passo usará este template.
                </Text>
              </FormControl>

              <FormControl isInvalid={!!errors.followupTemplateId}>
                <FormLabel>Template da mensagem principal</FormLabel>
                <Select placeholder="Selecione" {...register("followupTemplateId")}>
                  {templates.map((template) => (
                    <option value={template.id} key={template.id}>
                      {template.name}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.followupTemplateId?.message}</FormErrorMessage>
                <Text fontSize="sm" color="gray.400" mt={1}>
                  Será enviado depois do disparo inicial.
                </Text>
              </FormControl>

              <FormControl isInvalid={!!errors.contactListId}>
                <FormLabel>Lista de contatos</FormLabel>
                <Select placeholder="Selecione" {...register("contactListId")}>
                  {contactLists.map((list) => (
                    <option value={list.id} key={list.id}>
                      {list.name} ({list.totalCount})
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.contactListId?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.instanceId}>
                <FormLabel>Instância WhatsApp</FormLabel>
                <Select placeholder="Selecione" {...register("instanceId")}>
                  {instances.map((instance) => (
                    <option value={instance.id} key={instance.id}>
                      {instance.name}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.instanceId?.message}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>Agendar para</FormLabel>
                <Input type="datetime-local" {...register("scheduleAt")} />
              </FormControl>
            </SimpleGrid>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="mode" mb="0">
                Modo teste
              </FormLabel>
              <Controller
                control={control}
                name="mode"
                render={({ field }) => (
                  <Switch
                    id="mode"
                    isChecked={field.value === "test"}
                    onChange={(ev) => field.onChange(ev.target.checked ? "test" : "live")}
                  />
                )}
              />
            </FormControl>

            {mode === "test" ? (
              <FormControl isInvalid={!!errors.testSampleSize}>
                <FormLabel>Quantidade para teste</FormLabel>
                <NumberInput min={1} max={100} defaultValue={10}>
                  <NumberInputField {...register("testSampleSize")} />
                </NumberInput>
                <FormErrorMessage>{errors.testSampleSize?.message}</FormErrorMessage>
              </FormControl>
            ) : null}

            <Box>
              <FormLabel>Mensagem base (preview)</FormLabel>
              <Textarea
                value={
                  templates.find((template) => template.id === selectedTemplateId)?.content ??
                  "Selecione um template para visualizar"
                }
                readOnly
                height="120px"
                bg="gray.800"
              />
            </Box>

            <Box>
              <Box borderWidth="1px" borderColor="gray.700" borderRadius="md" p={4}>
                <Flex justify="space-between" align="center" mb={3}>
                  <Text fontWeight="semibold">Passo 1 - Disparo inicial</Text>
                  <Text fontSize="sm" color="gray.500">
                    Enviado assim que o contato entra na fila
                  </Text>
                </Flex>
                <Text color="gray.400">
                  Utilize esse passo para saudar ou acionar mensagens automáticas da empresa.
                </Text>
              </Box>

              <Box borderWidth="1px" borderColor="gray.700" borderRadius="md" p={4}>
                <Flex justify="space-between" align="center" mb={3}>
                  <Text fontWeight="semibold">Passo 2 - Mensagem principal</Text>
                </Flex>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isInvalid={!!errors.followupTemplateId}>
                    <FormLabel>Template</FormLabel>
                    <Select placeholder="Selecione" {...register("followupTemplateId")}>
                      {templates.map((template) => (
                        <option value={template.id} key={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </Select>
                    <FormErrorMessage>{errors.followupTemplateId?.message}</FormErrorMessage>
                  </FormControl>
                  <FormControl isInvalid={!!errors.delaySeconds}>
                    <FormLabel>Atraso após o passo 1 (segundos)</FormLabel>
                    <NumberInput
                      min={0}
                      value={delaySeconds ?? 0}
                      onChange={(_, valueAsNumber) =>
                        setValue("delaySeconds", Number.isNaN(valueAsNumber) ? 0 : valueAsNumber, {
                          shouldValidate: true,
                          shouldDirty: true
                        })
                      }
                    >
                      <NumberInputField />
                    </NumberInput>
                    <FormErrorMessage>
                      {typeof errors.delaySeconds?.message === "string"
                        ? errors.delaySeconds?.message
                        : "Informe um valor válido"}
                    </FormErrorMessage>
                  </FormControl>
                </SimpleGrid>
              </Box>
            </Box>

            <Box>
              <FormLabel>Configurações anti-ban</FormLabel>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isInvalid={!!errors.antiBan?.minIntervalSeconds}>
                  <FormLabel>Intervalo mínimo (s)</FormLabel>
                  <Input
                    type="number"
                    min={1}
                    {...register("antiBan.minIntervalSeconds", { valueAsNumber: true })}
                  />
                  <FormErrorMessage>{errors.antiBan?.minIntervalSeconds?.message}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!errors.antiBan?.maxIntervalSeconds}>
                  <FormLabel>Intervalo máximo (s)</FormLabel>
                  <Input
                    type="number"
                    min={1}
                    {...register("antiBan.maxIntervalSeconds", { valueAsNumber: true })}
                  />
                  <FormErrorMessage>{errors.antiBan?.maxIntervalSeconds?.message}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!errors.antiBan?.longPauseEvery}>
                  <FormLabel>Mensagens até pausa longa</FormLabel>
                  <Input
                    type="number"
                    min={1}
                    {...register("antiBan.longPauseEvery", { valueAsNumber: true })}
                  />
                  <FormErrorMessage>{errors.antiBan?.longPauseEvery?.message}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!errors.antiBan?.longPauseMinSeconds}>
                  <FormLabel>Pausa longa mínima (s)</FormLabel>
                  <Input
                    type="number"
                    min={1}
                    {...register("antiBan.longPauseMinSeconds", { valueAsNumber: true })}
                  />
                  <FormErrorMessage>{errors.antiBan?.longPauseMinSeconds?.message}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!errors.antiBan?.longPauseMaxSeconds}>
                  <FormLabel>Pausa longa máxima (s)</FormLabel>
                  <Input
                    type="number"
                    min={1}
                    {...register("antiBan.longPauseMaxSeconds", { valueAsNumber: true })}
                  />
                  <FormErrorMessage>{errors.antiBan?.longPauseMaxSeconds?.message}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!errors.antiBan?.dailyLimit}>
                  <FormLabel>Limite diário</FormLabel>
                  <Input
                    type="number"
                    min={1}
                    {...register("antiBan.dailyLimit", { valueAsNumber: true })}
                  />
                  <FormErrorMessage>{errors.antiBan?.dailyLimit?.message}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              <Box mt={4}>
                <Flex justify="space-between" align="center" mb={2}>
                  <FormLabel mb={0}>Janelas autorizadas</FormLabel>
                  <IconButton
                    aria-label="Adicionar janela"
                    icon={<FiPlus />}
                    size="sm"
                    onClick={() => appendWindow({ start: "08:00", end: "20:00" })}
                  />
                </Flex>
                <Stack spacing={3}>
                  {windowFields.map((field, index) => (
                    <HStack key={field.id} spacing={3}>
                      <FormControl isInvalid={!!errors.antiBan?.allowedWindows?.[index]?.start}>
                        <Input type="time" {...register(`antiBan.allowedWindows.${index}.start` as const)} />
                        <FormErrorMessage>
                          {errors.antiBan?.allowedWindows?.[index]?.start?.message}
                        </FormErrorMessage>
                      </FormControl>
                      <FormControl isInvalid={!!errors.antiBan?.allowedWindows?.[index]?.end}>
                        <Input type="time" {...register(`antiBan.allowedWindows.${index}.end` as const)} />
                        <FormErrorMessage>
                          {errors.antiBan?.allowedWindows?.[index]?.end?.message}
                        </FormErrorMessage>
                      </FormControl>
                      <IconButton
                        aria-label="Remover"
                        icon={<FiTrash2 />}
                        size="sm"
                        onClick={() => removeWindow(index)}
                      />
                    </HStack>
                  ))}
                </Stack>
              </Box>
            </Box>
          </Stack>
        </DrawerBody>
        <DrawerFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancelar
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit(submitHandler)} isLoading={isSubmitting}>
            Salvar campanha
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
