    // src/pages/LoginPage.js

    import React, { useState } from 'react';
    import { Container, Box, Typography, TextField, Button, Paper, Alert } from '@mui/material';
    import { useNavigate, Link as RouterLink } from 'react-router-dom'; // <-- MUDANÇA: Importa Link
    import { useAuth } from '../context/AuthContext';

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
        <Container component="main" maxWidth="xs">
        <Paper elevation={3} sx={{ marginTop: 8, padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography component="h1" variant="h5">
            Login
            </Typography>
            {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
            <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Nome de Usuário"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Senha"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
            >
                Entrar
            </Button>
            {/* --- NOVO BOTÃO --- */}
            <Button fullWidth component={RouterLink} to="/register">
                Não tem uma conta? Registre-se
            </Button>
            </Box>
        </Paper>
        </Container>
    );
    }