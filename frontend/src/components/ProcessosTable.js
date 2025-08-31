    import React, { useState, useMemo } from 'react';
    import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    TableSortLabel, TablePagination, Checkbox, Tooltip, IconButton
    } from '@mui/material';
    // Importe os ícones de status aqui

    // (Você precisará passar as funções de handle como props, mas para simplificar,
    // vamos focar na estrutura principal por enquanto)

    export default function ProcessosTable({ processos }) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    
    // Paginação aplicada na lista já filtrada
    const paginatedProcessos = useMemo(() => 
        processos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [processos, page, rowsPerPage]
    );

    return (
        <>
        <TableContainer>
            <Table stickyHeader>
            <TableHead>
                <TableRow>
                {/* Seus cabeçalhos de coluna (ID, Nome do Réu, etc.) */}
                <TableCell padding="checkbox" />
                <TableCell>ID</TableCell>
                <TableCell>Nome do Réu</TableCell>
                <TableCell>Status</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {paginatedProcessos.map((processo) => (
                <TableRow key={processo.id}>
                    {/* As células com os dados do processo */}
                    <TableCell padding="checkbox"><Checkbox /></TableCell>
                    <TableCell>{processo.id}</TableCell>
                    <TableCell>{processo.nome_reu}</TableCell>
                    <TableCell>{/* Botões de Status */}</TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </TableContainer>
        <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={processos.length} // A contagem é do total de itens na aba
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
        />
        </>
    );
    }