// src/App.js

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProcessosPage from './pages/ProcessosPage';
import PastasPage from './pages/PastasPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PastaDetailPage from './pages/PastaDetailPage';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { token } = useAuth();

  return (
    <div>
      {token && <Navbar />}
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={token ? <Navigate to="/" replace /> : <RegisterPage />} />
        
        <Route path="/" element={<ProtectedRoute><ProcessosPage /></ProtectedRoute>} />
        
        {/* --- ROTAS DE PASTAS CORRIGIDAS --- */}
        {/* A rota geral '/pastas' vem PRIMEIRO, para listar todas as pastas. */}
        <Route 
          path="/pastas" 
          element={
            <ProtectedRoute>
              <PastasPage />
            </ProtectedRoute>
          } 
        />
        
        {/* A rota específica com ID vem DEPOIS, para os detalhes de uma pasta. */}
        <Route 
          path="/pastas/:folderId" 
          element={
            <ProtectedRoute>
              <PastaDetailPage />
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
      </Routes>
    </div>
  );
}

export default App;