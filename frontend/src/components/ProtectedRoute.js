    // src/components/ProtectedRoute.js

    import React from 'react';
    import { Navigate } from 'react-router-dom';
    import { useAuth } from '../context/AuthContext';

    // Este componente verifica se o usuário está logado.
    // Se estiver, ele renderiza a página solicitada (children).
    // Se não, ele redireciona para a página de login.
    const ProtectedRoute = ({ children }) => {
    const { token } = useAuth();

    if (!token) {
        // Usuário não logado, redireciona para a página de login
        return <Navigate to="/login" replace />;
    }

    return children;
    };

    export default ProtectedRoute;