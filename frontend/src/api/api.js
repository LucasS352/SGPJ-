    // src/api/api.js
    import axios from 'axios';

    // Função que busca a lista de pastas
    export const fetchPastas = async () => {
    console.log("Buscando pastas da API...");
    // Chamada real:
    // const response = await axios.get('/api/pastas');
    // return response.data;

    // Simulação:
    return new Promise(resolve => {
        setTimeout(() => {
        resolve([
            { id: 1, nome: 'Processos da Múltipla' },
            { id: 2, nome: 'Casos Urgentes 2025' },
            { id: 3, nome: 'Clientes para Contato' },
        ]);
        }, 1000); // simula 1 segundo de espera
    });
    };

    // Função que adiciona os processos a uma pasta
    export const adicionarProcessosNaPasta = async (pastaId, processoIds) => {
    console.log(`Adicionando processos [${processoIds}] à pasta ID ${pastaId}`);
    // Chamada real:
    // const response = await axios.post(`/api/pastas/${pastaId}/processos`, { ids: processoIds });
    // return response.data;

    // Simulação:
    return new Promise(resolve => {
        setTimeout(() => {
        resolve({ success: true });
        }, 1500); // simula 1.5 segundo de espera
    });
    };

    // Para o feedback (notificação toast), a sugestão é usar uma biblioteca como 'react-hot-toast'
    // Na função `handleAllocationSuccess` do ProcessosPage.js, você faria:
    // import toast from 'react-hot-toast';
    // toast.success('Processos adicionados com sucesso!');