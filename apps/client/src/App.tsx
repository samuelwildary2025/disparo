import { Suspense } from "react";
import { Flex, Spinner } from "@chakra-ui/react";
import { AppRouter } from "./router";

function Loader() {
  return (
    <Flex align="center" justify="center" h="100vh">
      <Spinner size="xl" />
    </Flex>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <AppRouter />
    </Suspense>
  );
}
