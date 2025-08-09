    // arquivo: src/pages/ProcessosPage.js

    import React, { useState, useEffect, useMemo } from 'react';
    import axios from 'axios';
    import { alpha } from '@mui/material/styles';
    import {
    Container, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, CircularProgress, Alert, Box, TextField,
    TableSortLabel, TablePagination, Checkbox,
    Toolbar, Tooltip, IconButton,
    Dialog, DialogTitle, List, ListItem, ListItemButton, ListItemText,
    Snackbar 
    } from '@mui/material';
    import AddTaskIcon from '@mui/icons-material/AddTask';

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

    useEffect(() => {
        const fetchData = async () => {
        setLoading(true);
        const skip = page * rowsPerPage;
        const limit = rowsPerPage;
        try {
            // Usando Promise.all para mais performance e melhor tratamento de erro
            const [processosResponse, foldersResponse] = await Promise.all([
            axios.get(`http://127.0.0.1:8000/processos/?skip=${skip}&limit=${limit}`),
            axios.get('http://127.0.0.1:8000/folders/')
            ]);
            
            setProcessos(processosResponse.data.data);
            setTotalRows(processosResponse.data.total_count);
            setFolders(foldersResponse.data);
            setSelected([]);
        } catch (err) {
            setError('Falha ao buscar os dados. Verifique se a API está em execução.');
            console.error("Erro detalhado:", err);
        } finally {
            setLoading(false);
        }
        };
        fetchData();
    }, [page, rowsPerPage]);

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

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

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
        newSelected = newSelected.concat(
            selected.slice(0, selectedIndex),
            selected.slice(selectedIndex + 1),
        );
        }
        setSelected(newSelected);
    };

    const isSelected = (id) => selected.indexOf(id) !== -1;

    const handleOpenDialog = () => {
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
    };
    
    const handleAssignToFolder = async (folderId) => {
        if(selected.length === 0) {
            setSnackbarInfo({ open: true, message: 'Nenhum processo selecionado.' });
            return;
        }
        try {
        await axios.post(`http://127.0.0.1:8000/folders/${folderId}/add_processos/`, {
            processo_ids: selected
        });
        setSnackbarInfo({ open: true, message: 'Processos adicionados à pasta com sucesso!' });
        setSelected([]);
        handleCloseDialog();
        } catch (err) {
        console.error('Erro ao adicionar processos à pasta', err);
        setSnackbarInfo({ open: true, message: 'Erro ao adicionar processos.' });
        }
    };
    
    const handleCloseSnackbar = () => {
        setSnackbarInfo({ open: false, message: '' });
    };

    if (loading) {
        return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
            <Typography variant="h6" sx={{ marginLeft: 2 }}>
            Carregando...
            </Typography>
        </Box>
        );
    }

    if (error) {
        return (
        <Container sx={{ marginTop: 4 }}>
            <Alert severity="error">{error}</Alert>
        </Container>
        );
    }

    const numSelected = selected.length;

    return (
        <Container maxWidth="lg" sx={{ marginTop: 4, marginBottom: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
            Painel de Processos
        </Typography>

        <TextField
            label="Buscar por Nome do Réu ou Número do Processo"
            variant="outlined"
            fullWidth
            margin="normal"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />

        <Paper sx={{ width: '100%', mb: 2 }}>
            {numSelected > 0 && (
            <Toolbar
                sx={{
                pl: { sm: 2 },
                pr: { xs: 1, sm: 1 },
                ...(numSelected > 0 && {
                    bgcolor: (theme) =>
                    alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
                }),
                }}
            >
                <Typography
                sx={{ flex: '1 1 100%' }}
                color="inherit"
                variant="subtitle1"
                component="div"
                >
                {numSelected} selecionado(s)
                </Typography>
                
                <Tooltip title="Adicionar à Pasta">
                <IconButton onClick={handleOpenDialog}>
                    <AddTaskIcon />
                </IconButton>
                </Tooltip>
            </Toolbar>
            )}
            
            <TableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="tabela de processos">
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                    <TableCell padding="checkbox">
                    <Checkbox
                        color="primary"
                        indeterminate={numSelected > 0 && numSelected < filteredAndSortedProcessos.length}
                        checked={filteredAndSortedProcessos.length > 0 && numSelected === filteredAndSortedProcessos.length}
                        onChange={handleSelectAllClick}
                        inputProps={{ 'aria-label': 'selecionar todos os processos na página' }}
                    />
                    </TableCell>
                    <TableCell>ID</TableCell>
                    <TableCell>Número do Processo</TableCell>
                    <TableCell sortDirection={sortConfig.key === 'nome_reu' ? sortConfig.direction : false}>
                    <TableSortLabel
                        active={sortConfig.key === 'nome_reu'}
                        direction={sortConfig.key === 'nome_reu' ? sortConfig.direction : 'asc'}
                        onClick={() => handleSortRequest('nome_reu')}
                    >
                        Nome do Réu
                    </TableSortLabel>
                    </TableCell>
                    <TableCell>CPF/CNPJ</TableCell>
                    <TableCell align="right" sortDirection={sortConfig.key === 'valor_causa' ? sortConfig.direction : false}>
                    <TableSortLabel
                        active={sortConfig.key === 'valor_causa'}
                        direction={sortConfig.key === 'valor_causa' ? sortConfig.direction : 'asc'}
                        onClick={() => handleSortRequest('valor_causa')}
                    >
                        Valor da Causa (R$)
                    </TableSortLabel>
                    </TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {filteredAndSortedProcessos.map((processo) => {
                    const isItemSelected = isSelected(processo.id);
                    const labelId = `enhanced-table-checkbox-${processo.id}`;

                    return (
                    <TableRow
                        hover
                        onClick={(event) => handleClick(event, processo.id)}
                        role="checkbox"
                        aria-checked={isItemSelected}
                        tabIndex={-1}
                        key={processo.id}
                        selected={isItemSelected}
                        sx={{ cursor: 'pointer' }}
                    >
                        <TableCell padding="checkbox">
                        <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            inputProps={{ 'aria-labelledby': labelId }}
                        />
                        </TableCell>
                        <TableCell component="th" id={labelId} scope="row">{processo.id}</TableCell>
                        <TableCell>{processo.numero_processo}</TableCell>
                        <TableCell>{processo.nome_reu}</TableCell>
                        <TableCell>{processo.cpf_cnpj_reu}</TableCell>
                        <TableCell align="right">{processo.valor_causa}</TableCell>
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
            )) : (
                <ListItem>
                <ListItemText primary="Nenhuma pasta encontrada." />
                </ListItem>
            )}
            </List>
        </Dialog>
        
        <Snackbar
            open={snackbarInfo.open}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            message={snackbarInfo.message}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
        </Container>
    );
    }