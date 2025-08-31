    import React, { useState, useEffect, useMemo, useCallback } from 'react';
    import axios from 'axios';
    import { useLocation } from 'react-router-dom';
    import { useDebounce } from 'use-debounce';
    import {
    Container, Typography, Box, TextField, Paper, CircularProgress, Alert,
    Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TableSortLabel, TablePagination, Checkbox, Tooltip, IconButton,
    Dialog, DialogTitle, List, ListItem, ListItemButton, ListItemText,
    Snackbar, InputAdornment, Select, MenuItem,
    Toolbar // Adicionado aqui
} from '@mui/material';
import { alpha } from '@mui/material/styles'; // E a função alpha importada de 'styles'

import SearchIcon from '@mui/icons-material/Search';
import AddTaskIcon from '@mui/icons-material/AddTask';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpIcon from '@mui/icons-material/Help';

    export default function ProcessosPage() {
    const [allProcessos, setAllProcessos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
    const [sortConfig, setSortConfig] = useState({ key: 'valor_causa', direction: 'desc' });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selected, setSelected] = useState([]);
    const [folders, setFolders] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [snackbarInfo, setSnackbarInfo] = useState({ open: false, message: '' });
    const location = useLocation();

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
        // Para a filtragem no frontend, precisamos de todos os dados.
        // A paginação será feita no frontend.
        const processosPromise = axios.get(`http://127.0.0.1:8000/processos/?limit=10000`);
        const foldersPromise = axios.get(`http://127.0.0.1:8000/folders/`);
        
        const [processosResponse, foldersResponse] = await Promise.all([processosPromise, foldersPromise]);
        
        setAllProcessos(processosResponse.data.data);
        setFolders(foldersResponse.data);
        } catch (err) {
        setError('Falha ao buscar os dados iniciais.');
        } finally {
        setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData, location]);

    const parseValorCausa = (valor) => {
        if (typeof valor !== 'string') return 0;
        const cleanedValue = valor.replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.');
        const numberValue = parseFloat(cleanedValue);
        return isNaN(numberValue) ? 0 : numberValue;
    };

    const filteredAndSortedProcessos = useMemo(() => {
        let filtered = allProcessos.filter(p => {
            const valor = parseValorCausa(p.valor_causa);
            switch (activeTab) {
                case 1: return valor >= 100000 && valor < 300000;
                case 2: return valor >= 300000 && valor < 500000;
                case 3: return valor >= 500000;
                default: return true;
            }
        });

        if (debouncedSearchTerm) {
            filtered = filtered.filter(p =>
                p.nome_reu.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                p.numero_processo.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
            );
        }

        if (sortConfig.key !== null) {
        filtered.sort((a, b) => {
            const aValue = sortConfig.key === 'valor_causa' ? parseValorCausa(a[sortConfig.key]) : a[sortConfig.key];
            const bValue = sortConfig.key === 'valor_causa' ? parseValorCausa(b[sortConfig.key]) : b[sortConfig.key];
            
            if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
        }
        
        return filtered;
    }, [allProcessos, activeTab, debouncedSearchTerm, sortConfig]);
    
    // Efeito para resetar a página quando a busca ou o filtro de aba mudam
    useEffect(() => {
        setPage(0);
    }, [debouncedSearchTerm, activeTab]);


    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleStatusChange = async (processoId, novoStatus) => {
        setAllProcessos(allProcessos.map(p => 
        p.id === processoId ? { ...p, status: novoStatus } : p
        ));
        try {
        await axios.patch(`http://127.0.0.1:8000/processos/${processoId}/status`, { status: novoStatus });
        } catch (err) {
        console.error("Falha ao atualizar o status:", err);
        // Lógica para reverter o estado em caso de erro
        }
    };
    
    const handleSortRequest = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Funções de seleção (handleClick, isSelected, handleSelectAllClick)...
    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
        const newSelecteds = filteredAndSortedProcessos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((n) => n.id);
        setSelected(newSelecteds);
        return;
        }
        setSelected([]);
    };
    const handleClick = (event, id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];
        if (selectedIndex === -1) { newSelected = newSelected.concat(selected, id); } 
        else if (selectedIndex === 0) { newSelected = newSelected.concat(selected.slice(1)); } 
        else if (selectedIndex === selected.length - 1) { newSelected = newSelected.concat(selected.slice(0, -1)); } 
        else if (selectedIndex > 0) {
        newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
        }
        setSelected(newSelected);
    };
    const isSelected = (id) => selected.indexOf(id) !== -1;

    // Funções de diálogo (handleOpenDialog, handleCloseDialog, handleAssignToFolder)...
    const handleOpenDialog = () => setDialogOpen(true);
    const handleCloseDialog = () => setDialogOpen(false);
    const handleAssignToFolder = async (folderId) => {
        try {
        await axios.post(`http://127.0.0.1:8000/folders/${folderId}/add_processos/`, { processo_ids: selected });
        setSnackbarInfo({ open: true, message: 'Processos adicionados à pasta com sucesso!' });
        setSelected([]);
        handleCloseDialog();
        } catch (err) {
        setSnackbarInfo({ open: true, message: 'Erro ao adicionar processos.' });
        }
    };

    // Função de Snackbar (handleCloseSnackbar)...
    const handleCloseSnackbar = () => setSnackbarInfo({ open: false, message: '' });

    if (loading) { return ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /> <Typography variant="h6" sx={{ marginLeft: 2 }}>Carregando...</Typography></Box> ); }
    if (error) { return ( <Container sx={{ marginTop: 4 }}><Alert severity="error">{error}</Alert></Container> ); }

    const paginatedProcessos = filteredAndSortedProcessos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const numSelected = selected.length;

    return (
        <Container maxWidth="xl" sx={{ marginTop: 4, marginBottom: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>Painel de Processos</Typography>
        <Paper sx={{ width: '100%', mb: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="Abas de valor dos processos">
                <Tab label={`Todos (${filteredAndSortedProcessos.length})`} />
                <Tab label="R$ 100k - 300k" />
                <Tab label="R$ 300k - 500k" />
                <Tab label="Acima de 500k" />
            </Tabs>
            </Box>
            <Box sx={{ p: 2 }}>
            <TextField
                label="Buscar por Nome do Réu ou Número do Processo na aba atual..."
                variant="outlined" fullWidth margin="normal"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{ startAdornment: ( <InputAdornment position="start"><SearchIcon /></InputAdornment> ) }}
            />
            </Box>
            
            {numSelected > 0 && (
            <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 }, bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity) }}>
                <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1" component="div">{numSelected} selecionado(s)</Typography>
                <Tooltip title="Adicionar à Pasta"><IconButton onClick={handleOpenDialog}><AddTaskIcon /></IconButton></Tooltip>
            </Toolbar>
            )}
            <TableContainer>
            <Table stickyHeader>
                <TableHead>
                <TableRow>
                    <TableCell padding="checkbox">
                        <Checkbox
                            color="primary"
                            indeterminate={numSelected > 0 && numSelected < paginatedProcessos.length}
                            checked={paginatedProcessos.length > 0 && numSelected === paginatedProcessos.length}
                            onChange={handleSelectAllClick}
                        />
                    </TableCell>
                    <TableCell>ID</TableCell>
                    <TableCell>Número do Processo</TableCell>
                    <TableCell>Nome do Réu</TableCell>
                    <TableCell>CPF/CNPJ</TableCell>
                    <TableCell align="right">
                    <TableSortLabel
                        active={sortConfig.key === 'valor_causa'}
                        direction={sortConfig.direction}
                        onClick={() => handleSortRequest('valor_causa')}
                    >
                        Valor da Causa (R$)
                    </TableSortLabel>
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {paginatedProcessos.map((processo) => {
                    const isItemSelected = isSelected(processo.id);
                    const labelId = `enhanced-table-checkbox-${processo.id}`;
                    return(
                        <TableRow hover role="checkbox" tabIndex={-1} key={processo.id} selected={isItemSelected}>
                            <TableCell padding="checkbox" onClick={(event) => handleClick(event, processo.id)}>
                                <Checkbox color="primary" checked={isItemSelected} />
                            </TableCell>
                            <TableCell>{processo.id}</TableCell>
                            <TableCell>{processo.numero_processo}</TableCell>
                            <TableCell>{processo.nome_reu}</TableCell>
                            <TableCell>{processo.cpf_cnpj_reu}</TableCell>
                            <TableCell align="right">{processo.valor_causa}</TableCell>
                            <TableCell align="center">
                            <Select
                                value={processo.status}
                                onChange={(e) => handleStatusChange(processo.id, e.target.value)}
                                variant="standard"
                                sx={{ fontSize: '0.875rem', '&:before': { border: 'none' }, '&:after': { border: 'none' } }}
                            >
                                <MenuItem value="PENDENTE">❓ Pendente</MenuItem>
                                <MenuItem value="APROVADO">✅ Aprovado</MenuItem>
                                <MenuItem value="REJEITADO">❌ Rejeitado</MenuItem>
                            </Select>
                            </TableCell>
                        </TableRow>
                    );
                })}
                </TableBody>
            </Table>
            </TableContainer>
            <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredAndSortedProcessos.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Paper>
        <Dialog onClose={handleCloseDialog} open={dialogOpen}>
            <DialogTitle>Selecione uma pasta de destino</DialogTitle>
            <List sx={{ pt: 0 }}>
            {folders.length > 0 ? folders.map((folder) => ( <ListItem disableGutters key={folder.id}><ListItemButton onClick={() => handleAssignToFolder(folder.id)}><ListItemText primary={folder.name} /></ListItemButton></ListItem> )) : ( <ListItem><ListItemText primary="Nenhuma pasta encontrada." /></ListItem> )}
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