    // src/components/Navbar.js

    import React from 'react';
    import { AppBar, Toolbar, Typography, Button } from '@mui/material';
    import { Link, useNavigate } from 'react-router-dom';
    import { useAuth } from '../context/AuthContext'; // Importa o hook

    export default function Navbar() {
    const { token, logout } = useAuth(); // Pega o token e a função de logout
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login'); // Redireciona para o login após o logout
    };

    return (
        <AppBar position="static">
        <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            JURIS-SISTEMA
            </Typography>
            {/* Mostra os botões apenas se o token existir (usuário logado) */}
            {token && (
            <>
                <Button color="inherit" component={Link} to="/">
                Processos
                </Button>
                <Button color="inherit" component={Link} to="/pastas">
                Pastas
                </Button>
                <Button color="inherit" onClick={handleLogout}>
                Sair
                </Button>
            </>
            )}
        </Toolbar>
        </AppBar>
    );
    }