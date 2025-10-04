import { extendTheme, ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false
};

const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: "#e4f5ff",
      100: "#b8e2ff",
      200: "#8accff",
      300: "#5cb6ff",
      400: "#2ea0ff",
      500: "#1487e6",
      600: "#0e68b4",
      700: "#094880",
      800: "#04294e",
      900: "#010b21"
    }
  },
  fonts: {
    heading: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    body: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  }
});

export default theme;
