    import React, { useState } from 'react';
    import {
    Container, Box, Typography, TextField, Button,
    Paper, Grid, Link as MuiLink, Alert, CssBaseline
    } from '@mui/material';
    import { useNavigate, Link as RouterLink } from 'react-router-dom';
    import { useAuth } from '../context/AuthContext';
    import logoSGPJ from '../assets/Logo_SGPJ.png';
    import logoEmpresa from '../assets/empresa.png';

    export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
        await login(username, password);
        navigate('/');
        } catch (err) {
        setError('Falha no login. Verifique seu usuário e senha.');
        console.error(err);
        }
    };

    return (
        <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: 'background.default', // Cor de fundo do tema
        }}
        >
        <CssBaseline />
        <Container component="main" maxWidth="xs">
            <Paper 
            elevation={6} 
            sx={{ 
                padding: 4, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                borderRadius: 2, // Cantos levemente arredondados
            }}
            >
            <img src={logoSGPJ} alt="Logo SGPJ" style={{ maxWidth: '100px', height: 'auto', marginBottom: '1.5rem' }} />

            <Typography component="h1" variant="h5">
                Acessar o Sistema
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Bem-vindo de volta!
            </Typography>
            
            {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
            
            <Box component="form" noValidate onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
                <TextField
                margin="normal"
                required
                fullWidth
                label="Nome de Usuário"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                />
                <TextField
                margin="normal"
                required
                fullWidth
                label="Senha"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                Entrar
                </Button>
                <Grid container justifyContent="flex-end">
                <Grid item>
                    <MuiLink component={RouterLink} to="/register" variant="body2">
                    {"Não tem uma conta? Registre-se"}
                    </MuiLink>
                </Grid>
                </Grid>
            </Box>
            </Paper>
        </Container>

        {/* Logo da Empresa como rodapé fixo */}
        <Box
            component="footer"
            sx={{
            position: 'fixed', // Posição fixa na tela
            bottom: 16,
            right: 16,
            }}
        >
            <img src={logoEmpresa} alt="Logo da Empresa" style={{ maxWidth: '100px', height: 'auto', opacity: 0.6 }} />
        </Box>
        </Box>
    );
    }