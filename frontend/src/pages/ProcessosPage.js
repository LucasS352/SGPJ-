    import React, { useState, useEffect, useMemo } from 'react';
    import { useLocation } from 'react-router-dom';
    import axios from 'axios';
    import { alpha } from '@mui/material/styles';
    import {
    Container, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, CircularProgress, Alert, Box, TextField,
    TableSortLabel, TablePagination, Checkbox,
    Toolbar, Tooltip, IconButton,
    Dialog, DialogTitle, List, ListItem, ListItemButton, ListItemText,
    Snackbar, InputAdornment
    } from '@mui/material';

    import AddTaskIcon from '@mui/icons-material/AddTask';
    import CheckCircleIcon from '@mui/icons-material/CheckCircle';
    import CancelIcon from '@mui/icons-material/Cancel';
    import HelpIcon from '@mui/icons-material/Help';
    import SearchIcon from '@mui/icons-material/Search';

    export default function ProcessosPage() {
    const [processos, setProcessos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);
    const [selected, setSelected] = useState([]);
    const [folders, setFolders] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [snackbarInfo, setSnackbarInfo] = useState({ open: false, message: '' });
    const location = useLocation();

    const fetchProcessos = async () => {
        setLoading(true);
        setError(null);
        const skip = page * rowsPerPage;
        const limit = rowsPerPage;
        const cacheBuster = `&_=${new Date().getTime()}`;
        
        try {
        const [processosResponse, foldersResponse] = await Promise.all([
            axios.get(`http://127.0.0.1:8000/processos/?skip=${skip}&limit=${limit}${cacheBuster}`),
            axios.get(`http://127.0.0.1:8000/folders/?${cacheBuster}`)
        ]);
        
        setProcessos(processosResponse.data.data);
        setTotalRows(processosResponse.data.total_count);
        setFolders(foldersResponse.data);
        setSelected([]);
        } catch (err) {
        setError('Falha ao buscar os dados. Verifique se a API está em execução.');
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        fetchProcessos();
    }, [page, rowsPerPage, location]);
    
    const handleStatusUpdate = async (processoId, newStatus) => {
        try {
        await axios.patch(`http://127.0.0.1:8000/processos/${processoId}/status`, { status: newStatus });
        setProcessos(processos.map(p => 
            p.id === processoId ? { ...p, status: newStatus } : p
        ));
        setSnackbarInfo({ open: true, message: 'Status atualizado com sucesso!' });
        } catch (err) {
        console.error("Erro ao atualizar status:", err);
        setSnackbarInfo({ open: true, message: 'Falha ao atualizar o status.' });
        }
    };

    const parseValorCausa = (valor) => {
        if (typeof valor !== 'string') return 0;
        return parseFloat(valor.replace(/\./g, '').replace(',', '.'));
    };

    const filteredAndSortedProcessos = useMemo(() => {
        let sortableItems = [...processos];
        if (searchTerm) {
        sortableItems = sortableItems.filter(item =>
            item.nome_reu.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.numero_processo.toLowerCase().includes(searchTerm.toLowerCase())
        );
        }
        if (sortConfig.key !== null) {
        sortableItems.sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];
            if (sortConfig.key === 'valor_causa') {
                aValue = parseValorCausa(aValue);
                bValue = parseValorCausa(bValue);
            }
            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
        }
        return sortableItems;
    }, [processos, searchTerm, sortConfig]);

    const handleSortRequest = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
        const newSelecteds = filteredAndSortedProcessos.map((n) => n.id);
        setSelected(newSelecteds);
        return;
        }
        setSelected([]);
    };

    const handleClick = (event, id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];
        if (selectedIndex === -1) {
        newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
        newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
        newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
        newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
        }
        setSelected(newSelected);
    };

    const isSelected = (id) => selected.indexOf(id) !== -1;
    const handleOpenDialog = () => setDialogOpen(true);
    const handleCloseDialog = () => setDialogOpen(false);
    
    const handleAssignToFolder = async (folderId) => {
        try {
        await axios.post(`http://127.0.0.1:8000/folders/${folderId}/add_processos/`, { processo_ids: selected });
        setSnackbarInfo({ open: true, message: 'Processos adicionados à pasta com sucesso!' });
        setSelected([]);
        handleCloseDialog();
        } catch (err) {
        console.error('Erro ao adicionar processos à pasta', err);
        setSnackbarInfo({ open: true, message: 'Erro ao adicionar processos.' });
        }
    };
    
    const handleCloseSnackbar = () => setSnackbarInfo({ open: false, message: '' });

    if (loading) {
        return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress /> <Typography variant="h6" sx={{ marginLeft: 2 }}>Carregando...</Typography>
        </Box>
        );
    }

    if (error) {
        return <Container sx={{ marginTop: 4 }}><Alert severity="error">{error}</Alert></Container>;
    }

    const numSelected = selected.length;

    return (
        <Container maxWidth="xl" sx={{ marginTop: 4, marginBottom: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>Painel de Processos</Typography>
        <TextField
            label="Buscar por Nome do Réu ou Número do Processo"
            variant="outlined"
            fullWidth
            margin="normal"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
            startAdornment: (
                <InputAdornment position="start"><SearchIcon /></InputAdornment>
            ),
            }}
        />
        <Paper sx={{ width: '100%', mb: 2 }}>
            {numSelected > 0 && (
            <Toolbar
                sx={{
                pl: { sm: 2 }, pr: { xs: 1, sm: 1 },
                bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
                }}
            >
                <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1" component="div">
                {numSelected} selecionado(s)
                </Typography>
                <Tooltip title="Adicionar à Pasta">
                <IconButton onClick={handleOpenDialog}><AddTaskIcon /></IconButton>
                </Tooltip>
            </Toolbar>
            )}
            <TableContainer>
            <Table stickyHeader>
                <TableHead>
                <TableRow>
                    <TableCell padding="checkbox">
                    <Checkbox
                        color="primary"
                        indeterminate={numSelected > 0 && numSelected < filteredAndSortedProcessos.length}
                        checked={filteredAndSortedProcessos.length > 0 && numSelected === filteredAndSortedProcessos.length}
                        onChange={handleSelectAllClick}
                    />
                    </TableCell>
                    <TableCell>ID</TableCell>
                    <TableCell>Número do Processo</TableCell>
                    <TableCell>Nome do Réu</TableCell>
                    <TableCell>CPF/CNPJ</TableCell>
                    <TableCell align="right">Valor da Causa (R$)</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {filteredAndSortedProcessos.map((processo) => {
                    const isItemSelected = isSelected(processo.id);
                    const labelId = `enhanced-table-checkbox-${processo.id}`;
                    return (
                    <TableRow
                        hover
                        role="checkbox"
                        aria-checked={isItemSelected}
                        tabIndex={-1}
                        key={processo.id}
                        selected={isItemSelected}
                    >
                        <TableCell padding="checkbox" onClick={(event) => handleClick(event, processo.id)} sx={{ cursor: 'pointer' }}>
                        <Checkbox color="primary" checked={isItemSelected} inputProps={{ 'aria-labelledby': labelId }}/>
                        </TableCell>
                        <TableCell component="th" id={labelId} scope="row" onClick={(event) => handleClick(event, processo.id)} sx={{ cursor: 'pointer' }}>{processo.id}</TableCell>
                        <TableCell onClick={(event) => handleClick(event, processo.id)} sx={{ cursor: 'pointer' }}>{processo.numero_processo}</TableCell>
                        <TableCell onClick={(event) => handleClick(event, processo.id)} sx={{ cursor: 'pointer' }}>{processo.nome_reu}</TableCell>
                        <TableCell onClick={(event) => handleClick(event, processo.id)} sx={{ cursor: 'pointer' }}>{processo.cpf_cnpj_reu}</TableCell>
                        <TableCell align="right" onClick={(event) => handleClick(event, processo.id)} sx={{ cursor: 'pointer' }}>{processo.valor_causa}</TableCell>
                        <TableCell align="center">
                        <Tooltip title="Aprovado">
                            <IconButton onClick={() => { const newStatus = processo.status === 'APROVADO' ? 'PENDENTE' : 'APROVADO'; handleStatusUpdate(processo.id, newStatus); }} sx={{ opacity: processo.status === 'APROVADO' ? 1 : 0.3 }}>
                            <CheckCircleIcon color={processo.status === 'APROVADO' ? 'success' : 'action'} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Rejeitado">
                            <IconButton onClick={() => { const newStatus = processo.status === 'REJEITADO' ? 'PENDENTE' : 'REJEITADO'; handleStatusUpdate(processo.id, newStatus); }} sx={{ opacity: processo.status === 'REJEITADO' ? 1 : 0.3 }}>
                            <CancelIcon color={processo.status === 'REJEITADO' ? 'error' : 'action'} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Pendente">
                            <IconButton onClick={() => { handleStatusUpdate(processo.id, 'PENDENTE'); }} sx={{ opacity: processo.status === 'PENDENTE' ? 1 : 0.3 }}>
                            <HelpIcon color={processo.status === 'PENDENTE' ? 'warning' : 'action'} />
                            </IconButton>
                        </Tooltip>
                        </TableCell>
                    </TableRow>
                    );
                })}
                </TableBody>
            </Table>
            </TableContainer>
            <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalRows}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Itens por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            />
        </Paper>
        <Dialog onClose={handleCloseDialog} open={dialogOpen}>
            <DialogTitle>Selecione uma pasta de destino</DialogTitle>
            <List sx={{ pt: 0 }}>
            {folders.length > 0 ? folders.map((folder) => (
                <ListItem disableGutters key={folder.id}>
                <ListItemButton onClick={() => handleAssignToFolder(folder.id)}>
                    <ListItemText primary={folder.name} />
                </ListItemButton>
                </ListItem>
            )) : ( <ListItem><ListItemText primary="Nenhuma pasta encontrada." /></ListItem> )}
            </List>
        </Dialog>
        <Snackbar
            open={snackbarInfo.open}
            autoHideDuration={4000}
            onClose={handleCloseSnackbar}
            message={snackbarInfo.message}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
        </Container>
    );
    }