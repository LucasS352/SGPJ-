    import React, { useState, useEffect, useCallback } from 'react';
    import { useParams, useNavigate } from 'react-router-dom';
    import axios from 'axios';
    import { 
    Container, Typography, Box, Paper, List, ListItem, ListItemText, 
    Divider, CircularProgress, Alert, Button, IconButton,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField,
    TablePagination
    } from '@mui/material';
    import ArrowBackIcon from '@mui/icons-material/ArrowBack';
    import DeleteIcon from '@mui/icons-material/Delete';
    import EditIcon from '@mui/icons-material/Edit';

    export default function PastaDetailPage() {
    const { folderId } = useParams();
    const navigate = useNavigate();
    const [folder, setFolder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);

    const [openRemoveDialog, setOpenRemoveDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [selectedAssociation, setSelectedAssociation] = useState(null);
    const [observationText, setObservationText] = useState('');
    
    const fetchFolderDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        const skip = page * rowsPerPage;
        try {
        const response = await axios.get(`http://127.0.0.1:8000/folders/${folderId}?skip=${skip}&limit=${rowsPerPage}`);
        setFolder(response.data);
        setTotalRows(response.data.total_processos_count);
        } catch (err) {
        setError('Não foi possível carregar os detalhes da pasta.');
        console.error("Erro ao carregar detalhes da pasta:", err);
        } finally {
        setLoading(false);
        }
    }, [folderId, page, rowsPerPage]);

    useEffect(() => {
        fetchFolderDetails();
    }, [fetchFolderDetails]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleOpenRemoveDialog = (association) => {
        setSelectedAssociation(association);
        setOpenRemoveDialog(true);
    };

    const handleOpenEditDialog = (association) => {
        setSelectedAssociation(association);
        setObservationText(association.observation || '');
        setOpenEditDialog(true);
    };

    const handleCloseDialogs = () => {
        setOpenRemoveDialog(false);
        setOpenEditDialog(false);
        setSelectedAssociation(null);
    };

    const handleRemoveProcess = async () => {
        if (!selectedAssociation) return;
        try {
        await axios.delete(`http://127.0.0.1:8000/folders/${folderId}/processos/${selectedAssociation.processo.id}`);
        // Se estamos na última página e removemos o último item, precisamos voltar uma página
        if (folder.processo_associations.length === 1 && page > 0) {
            setPage(page - 1);
        } else {
            fetchFolderDetails();
        }
        } catch (err) {
        console.error("Erro ao remover processo:", err);
        setError("Não foi possível remover o processo.");
        } finally {
        handleCloseDialogs();
        }
    };

    const handleSaveObservation = async () => {
        if (!selectedAssociation) return;
        try {
        await axios.patch(`http://127.0.0.1:8000/folders/${folderId}/processos/${selectedAssociation.processo.id}`, {
            observation: observationText,
        });
        fetchFolderDetails();
        } catch (err) {
        console.error("Erro ao salvar observação:", err);
        setError("Não foi possível salvar a observação.");
        } finally {
        handleCloseDialogs();
        }
    };

    if (loading) {
        return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
        </Box>
        );
    }

    if (error || !folder) {
        return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Alert severity="error">{error || 'Pasta não encontrada.'}</Alert>
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
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }} onClick={() => navigate('/pastas')}>
            Voltar para Pastas
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
            Pasta: {folder.name}
        </Typography>
        
        <Paper>
            <Typography variant="h6" gutterBottom sx={{ p: 2 }}>
            Processos nesta pasta
            </Typography>
            <Divider />
            {folder.processo_associations && folder.processo_associations.length > 0 ? (
            <List>
                {folder.processo_associations.map((assoc) => (
                <ListItem 
                    key={assoc.processo.id} 
                    divider
                    secondaryAction={
                    <Box>
                        <IconButton edge="end" aria-label="edit" onClick={() => handleOpenEditDialog(assoc)}>
                        <EditIcon />
                        </IconButton>
                        <IconButton edge="end" aria-label="delete" onClick={() => handleOpenRemoveDialog(assoc)} sx={{ ml: 1 }}>
                        <DeleteIcon />
                        </IconButton>
                    </Box>
                    }
                >
                    <ListItemText
                    primary={`Processo Nº: ${assoc.processo.numero_processo}`}
                    secondary={
                        <Box component="span" sx={{ display: 'block' }}>
                        <Typography component="span" variant="body2" color="text.primary">
                            Réu: {assoc.processo.nome_reu} | Valor da Causa: R$ {assoc.processo.valor_causa}
                        </Typography>
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 1, display: 'block' }}>
                            {assoc.observation || 'Nenhuma observação adicionada.'}
                        </Typography>
                        </Box>
                    }
                    />
                </ListItem>
                ))}
            </List>
            ) : (
            <Typography sx={{ p: 2, color: 'text.secondary' }}>
                Nenhum processo foi adicionado a esta pasta ainda.
            </Typography>
            )}
            
            <TablePagination
            component="div"
            count={totalRows}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Processos por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`}
            />
        </Paper>

        <Dialog open={openRemoveDialog} onClose={handleCloseDialogs}>
            <DialogTitle>Confirmar Remoção</DialogTitle>
            <DialogContent>
            <DialogContentText>
                Você tem certeza que deseja remover o processo <strong>{selectedAssociation?.processo.numero_processo}</strong> desta pasta? Esta ação não pode ser desfeita.
            </DialogContentText>
            </DialogContent>
            <DialogActions>
            <Button onClick={handleCloseDialogs}>Cancelar</Button>
            <Button onClick={handleRemoveProcess} color="error">Remover</Button>
            </DialogActions>
        </Dialog>

        <Dialog open={openEditDialog} onClose={handleCloseDialogs} fullWidth maxWidth="sm">
            <DialogTitle>Adicionar/Editar Observação</DialogTitle>
            <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
                Observações para o processo: <strong>{selectedAssociation?.processo.numero_processo}</strong>
            </DialogContentText>
            <TextField
                autoFocus
                margin="dense"
                label="Observações"
                type="text"
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                value={observationText}
                onChange={(e) => setObservationText(e.target.value)}
            />
            </DialogContent>
            <DialogActions>
            <Button onClick={handleCloseDialogs}>Cancelar</Button>
            <Button onClick={handleSaveObservation}>Salvar</Button>
            </DialogActions>
        </Dialog>
        </Container>
    );
    }