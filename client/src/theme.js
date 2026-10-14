import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#b7892b',
      dark: '#966e1e',
      light: '#d6b35a',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#171a1f',
      contrastText: '#ffffff'
    },
    background: {
      default: '#f6f5f2',
      paper: '#ffffff'
    },
    text: {
      primary: '#1b1c20',
      secondary: '#73757c'
    },
    divider: '#e8e4dc',
    success: {
      main: '#1f8a5b',
      light: '#eaf7f0'
    },
    warning: {
      main: '#986b10',
      light: '#fff5d9'
    },
    error: {
      main: '#b74444',
      light: '#fdeeee'
    },
    info: {
      main: '#2f64ad',
      light: '#edf4ff'
    }
  },
  typography: {
    fontFamily: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'].join(','),
    h1: { fontSize: '24px', fontWeight: 800, color: '#1b1c20' },
    h2: { fontSize: '20px', fontWeight: 800, color: '#1b1c20' },
    h3: { fontSize: '16px', fontWeight: 700, color: '#1b1c20' },
    h4: { fontSize: '14px', fontWeight: 700, color: '#1b1c20' },
    subtitle1: { fontSize: '13px', color: '#73757c' },
    subtitle2: { fontSize: '12px', color: '#73757c' },
    body1: { fontSize: '13px', color: '#1b1c20' },
    body2: { fontSize: '12px', color: '#73757c' },
    button: {
      textTransform: 'none',
      fontWeight: 700,
      fontSize: '12px'
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none'
          }
        },
        containedPrimary: {
          backgroundColor: '#b7892b',
          '&:hover': {
            backgroundColor: '#966e1e'
          }
        },
        containedSecondary: {
          backgroundColor: '#171a1f',
          '&:hover': {
            backgroundColor: '#292e36'
          }
        },
        outlined: {
          borderColor: '#e8e4dc',
          color: '#1b1c20',
          backgroundColor: '#ffffff',
          '&:hover': {
            borderColor: '#d3c8ad',
            backgroundColor: '#fbfaf7'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          border: '1px solid #e8e4dc',
          boxShadow: '0 8px 30px rgba(27, 28, 32, 0.06)',
          backgroundImage: 'none'
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#faf9f6',
          color: '#73757c',
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          borderBottom: '1px solid #e8e4dc',
          padding: '10px 14px'
        },
        body: {
          fontSize: '12px',
          color: '#1b1c20',
          borderBottom: '1px solid #e8e4dc',
          padding: '11px 14px'
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          backgroundColor: '#ffffff',
          fontSize: '13px',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e8e4dc'
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#d6b35a'
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#b7892b'
          }
        }
      }
    }
  }
});
