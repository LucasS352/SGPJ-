    // src/context/AuthContext.js

    import React, { createContext, useState, useContext, useEffect } from 'react';
    import axios from 'axios';

    // Cria o Contexto
    const AuthContext = createContext();

    // Cria o Provedor do Contexto
    export function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem('authToken'));

    useEffect(() => {
        // Configura o cabeçalho de autorização do axios sempre que o token mudar
        if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem('authToken', token);
        } else {
        delete axios.defaults.headers.common['Authorization'];
        localStorage.removeItem('authToken');
        }
    }, [token]);

    // Função de Login
    const login = async (username, password) => {
        // Para o login, a API espera dados de formulário, não JSON.
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);

        const response = await axios.post('http://127.0.0.1:8000/token', params);
        setToken(response.data.access_token);
    };

    // Função de Logout
    const logout = () => {
        setToken(null);
    };

    const value = {
        token,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
    }

    // Hook customizado para facilitar o uso do contexto
    export function useAuth() {
    return useContext(AuthContext);
    }