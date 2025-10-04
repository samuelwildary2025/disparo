import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { login } from "../../api/auth";
import { useAuth } from "../../store/auth";

const schema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(6, "Informe a senha")
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuth((state) => state.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      setUser(user);
      navigate("/");
    }
  });

  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.900" px={4}>
      <Box
        bg="gray.800"
        p={10}
        rounded="lg"
        shadow="xl"
        w="full"
        maxW="md"
        borderWidth="1px"
        borderColor="gray.700"
      >
        <Stack spacing={6}>
          <Box>
            <Heading size="lg" color="brand.400">
              Disparo Inteligente
            </Heading>
            <Text color="gray.400">Entre com suas credenciais para continuar.</Text>
          </Box>

          <form onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            <Stack spacing={4}>
              <FormControl isInvalid={!!errors.email}>
                <FormLabel>E-mail</FormLabel>
                <Input type="email" {...register("email")} placeholder="admin@disparo.app" />
                <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.password}>
                <FormLabel>Senha</FormLabel>
                <Input type="password" {...register("password")} placeholder="••••••••" />
                <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
              </FormControl>

              <Button type="submit" colorScheme="blue" isLoading={mutation.isPending}>
                Entrar
              </Button>
            </Stack>
          </form>

          {mutation.isError ? (
            <Text color="red.300" fontSize="sm" textAlign="center">
              Falha ao autenticar, verifique suas credenciais.
            </Text>
          ) : null}
        </Stack>
      </Box>
    </Flex>
  );
}
