    // src/pages/PastaDetailPage.js

    import React, { useState, useEffect } from 'react';
    import { useParams, useNavigate } from 'react-router-dom';
    import axios from 'axios';
    import { Container, Typography, Box, Paper, List, ListItem, ListItemText, Divider, CircularProgress, Alert, Button } from '@mui/material';
    import ArrowBackIcon from '@mui/icons-material/ArrowBack';

    export default function PastaDetailPage() {
    const { folderId } = useParams(); // Hook para pegar o ID da pasta da URL
    const navigate = useNavigate(); // Hook para navegar entre páginas
    const [folder, setFolder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFolderDetails = async () => {
        try {
            const response = await axios.get(`http://1227.0.0.1:8000/folders/${folderId}`);
            setFolder(response.data);
        } catch (err) {
            setError('Não foi possível carregar os detalhes da pasta. Talvez ela não exista ou você não tenha permissão.');
            console.error(err);
        } finally {
            setLoading(false);
        }
        };

        fetchFolderDetails();
    }, [folderId]); // O useEffect roda sempre que o folderId na URL mudar

    if (loading) {
        return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
        </Box>
        );
    }

    if (error) {
        return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Alert severity="error">{error}</Alert>
            <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            sx={{ mt: 2 }}
            onClick={() => navigate('/pastas')}
            >
            Voltar para Pastas
            </Button>
        </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            sx={{ mb: 2 }}
            onClick={() => navigate('/pastas')}
        >
            Voltar para Pastas
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
            Pasta: {folder?.name}
        </Typography>
        
        <Paper>
            <Typography variant="h6" gutterBottom sx={{ p: 2 }}>
            Processos nesta pasta
            </Typography>
            <Divider />
            {folder?.processos.length > 0 ? (
            <List>
                {folder.processos.map((processo) => (
                <ListItem key={processo.id} divider>
                    <ListItemText
                    primary={`Processo Nº: ${processo.numero_processo}`}
                    secondary={`Réu: ${processo.nome_reu} | Valor da Causa: R$ ${processo.valor_causa}`}
                    />
                </ListItem>
                ))}
            </List>
            ) : (
            <Typography sx={{ p: 2, color: 'text.secondary' }}>
                Nenhum processo foi adicionado a esta pasta ainda.
            </Typography>
            )}
        </Paper>
        </Container>
    );
    }