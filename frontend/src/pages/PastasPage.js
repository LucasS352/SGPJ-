    // src/pages/PastasPage.js

    import React, { useState, useEffect } from 'react';
    import axios from 'axios';
    import { Link as RouterLink } from 'react-router-dom';
    import {
    Container,
    Typography,
    Box,
    TextField,
    Button,
    List,
    ListItemText,
    CircularProgress,
    Alert,
    Paper,
    Divider,
    ListItemButton
    } from '@mui/material';

    export default function PastasPage() {
    const [folders, setFolders] = useState([]);
    const [newFolderName, setNewFolderName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const fetchFolders = async () => {
        try {
        setError(null);
        // O token de autorização já é enviado automaticamente pelo nosso AuthContext
        const response = await axios.get('http://127.0.0.1:8000/folders/');
        setFolders(response.data);
        } catch (err) {
        setError('Falha ao carregar as pastas.');
        console.error("Erro ao buscar pastas:", err);
        } finally {
        setLoading(false);
        }
    };

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!newFolderName.trim()) {
        setError('O nome da pasta não pode estar em branco.');
        return;
        }

        try {
        setError(null);
        setSuccess(null);
        
        const response = await axios.post('http://127.0.0.1:8000/folders/', {
            name: newFolderName
        });

        setFolders([...folders, response.data]);
        setSuccess(`Pasta "${newFolderName}" criada com sucesso!`);
        setNewFolderName('');

        } catch (err) {
        if (err.response && err.response.status === 400) {
            setError(err.response.data.detail || 'Já existe uma pasta com este nome.');
        } else {
            setError('Ocorreu um erro ao criar a pasta.');
        }
        console.error("Erro ao criar pasta:", err);
        }
    };

    useEffect(() => {
        fetchFolders();
    }, []);

    if (loading) {
        return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
        </Box>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
            Gerenciador de Pastas
        </Typography>

        <Paper sx={{ p: 2, mb: 4 }}>
            <Typography variant="h6" gutterBottom>Criar Nova Pasta</Typography>
            <Box component="form" onSubmit={handleCreateFolder} sx={{ display: 'flex', gap: 2 }}>
            <TextField
                fullWidth
                label="Nome da Nova Pasta"
                variant="outlined"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
            />
            <Button type="submit" variant="contained" sx={{ whiteSpace: 'nowrap' }}>
                Criar Pasta
            </Button>
            </Box>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
        </Paper>

        <Paper>
            <Typography variant="h6" gutterBottom sx={{ p: 2 }}>Pastas Existentes</Typography>
            <Divider />
            {folders.length > 0 ? (
            <List>
                {folders.map((folder) => (
                // --- ESTA É A MUDANÇA PRINCIPAL ---
                // O ListItemButton agora funciona como um link para a página de detalhes
                <ListItemButton 
                    key={folder.id} 
                    component={RouterLink} 
                    to={`/pastas/${folder.id}`} 
                    divider
                >
                    <ListItemText primary={folder.name} secondary={`ID: ${folder.id}`} />
                </ListItemButton>
                ))}
            </List>
            ) : (
            <Typography sx={{ p: 2, color: 'text.secondary' }}>
                Nenhuma pasta foi criada ainda para este usuário.
            </Typography>
            )}
        </Paper>
        </Container>
    );
    }