    // src/components/AdicionarPastaModal.js

    import React, { useState, useEffect } from 'react';
    import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, Select, MenuItem, FormControl, InputLabel, CircularProgress, Alert 
    } from '@mui/material';
    import { fetchPastas, adicionarProcessosNaPasta } from '../api/api'; // Nossas funções de API simuladas

    export default function AdicionarPastaModal({ open, onClose, processoIds, onSuccess }) {
    const [pastas, setPastas] = useState([]);
    const [selectedPastaId, setSelectedPastaId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        // Busca a lista de pastas quando o modal abre
        const getPastas = async () => {
        try {
            setLoading(true);
            const data = await fetchPastas();
            setPastas(data);
        } catch (err) {
            setError('Não foi possível carregar as pastas.');
        } finally {
            setLoading(false);
        }
        };
        if (open) {
        getPastas();
        }
    }, [open]);

    const handleSubmit = async () => {
        setSubmitting(true);
        setError(null);
        try {
        await adicionarProcessosNaPasta(selectedPastaId, processoIds);
        onSuccess(); // Chama a função de sucesso do componente pai
        } catch (err) {
        setError('Ocorreu um erro ao adicionar os processos.');
        } finally {
        setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
        <DialogTitle>Adicionar à Pasta</DialogTitle>
        <DialogContent>
            {loading ? (
            <CircularProgress sx={{ mt: 2 }} />
            ) : (
            <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="select-pasta-label">Selecione a Pasta de Destino</InputLabel>
                <Select
                labelId="select-pasta-label"
                value={selectedPastaId}
                label="Selecione a Pasta de Destino"
                onChange={(e) => setSelectedPastaId(e.target.value)}
                >
                {pastas.map((pasta) => (
                    <MenuItem key={pasta.id} value={pasta.id}>
                    {pasta.nome}
                    </MenuItem>
                ))}
                </Select>
            </FormControl>
            )}
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose} disabled={submitting}>Cancelar</Button>
            <Button 
            onClick={handleSubmit} 
            variant="contained"
            // Botão desabilitado enquanto submete ou se nenhuma pasta for selecionada
            disabled={!selectedPastaId || submitting}
            >
            {submitting ? <CircularProgress size={24} /> : "Confirmar"}
            </Button>
        </DialogActions>
        </Dialog>
    );
    }