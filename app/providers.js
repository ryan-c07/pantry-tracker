'use client'
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#3f6b3a', contrastText: '#ffffff' },
    secondary: { main: '#c9772b' },
    background: { default: '#f6f3ec', paper: '#ffffff' },
    text: { primary: '#1f2a1d', secondary: '#5d6659' },
    divider: '#e6e1d6',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { outlined: { borderColor: '#e6e1d6' } },
    },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
  },
});

export default function Providers({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
