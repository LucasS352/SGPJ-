    // src/pages/RegisterPage.js

    import React, { useState } from 'react';
    import { Container, Box, Typography, TextField, Button, Paper, Alert } from '@mui/material';
    import { useNavigate, Link as RouterLink } from 'react-router-dom';
    import axios from 'axios';

    export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
        await axios.post('http://127.0.0.1:8000/users/', { username, password });
        setSuccess('Usuário registrado com sucesso! Você será redirecionado para o login.');
        setTimeout(() => {
            navigate('/login');
        }, 2000); // Espera 2 segundos e redireciona
        } catch (err) {
        setError(err.response?.data?.detail || 'Falha ao registrar.');
        console.error(err);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
        <Paper elevation={3} sx={{ marginTop: 8, padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography component="h1" variant="h5">
            Registrar Novo Usuário
            </Typography>
            {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ width: '100%', mt: 2 }}>{success}</Alert>}
            <Box component="form" onSubmit={handleRegister} sx={{ mt: 1 }}>
            <TextField
                margin="normal"
                required
                fullWidth
                label="Nome de Usuário"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
            >
                Registrar
            </Button>
            <Button fullWidth component={RouterLink} to="/login">
                Já tem uma conta? Faça o login
            </Button>
            </Box>
        </Paper>
        </Container>
    );
    }