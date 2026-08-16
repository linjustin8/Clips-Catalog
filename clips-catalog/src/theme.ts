import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#5d4ee6",
      light: "#8578ff",
      dark: "#4a3eb9",
    },
    background: {
      default: "#0f1224",
      paper: "#1b183f",
    },
    text: {
      primary: "rgba(255, 255, 255, 0.87)",
      secondary: "rgb(167, 167, 167)",
    },
    divider: "#2a2f41",
    error: {
      main: "rgb(255, 33, 33)",
      dark: "rgb(161, 0, 43)",
    },
  },
  typography: {
    fontFamily: '"Montserrat", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
  },
});

export default theme;
