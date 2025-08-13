    // src/theme.js
    import { createTheme } from '@mui/material/styles';

    const theme = createTheme({
    palette: {
        primary: {
        main: '#2c3e50', // Um azul-marinho sóbrio e profissional
        },
        secondary: {
        main: '#1abc9c', // Um verde-azulado para contraste e ações
        },
        background: {
        default: '#ecf0f1', // Um cinza muito claro para o fundo da aplicação
        paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h5: {
        fontWeight: 700,
        },
    },
    shape: {
        borderRadius: 8, // Cantos levemente arredondados
    },
    components: {
        MuiButton: {
        styleOverrides: {
            root: {
            textTransform: 'none', // Botões com texto normal, não MAIÚSCULAS
            boxShadow: 'none',
            '&:hover': {
                boxShadow: 'none',
            },
            },
        },
        },
    },
    });

    export default theme;