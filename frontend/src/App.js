// src/App.js

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProcessosPage from './pages/ProcessosPage';
import PastasPage from './pages/PastasPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; // <-- NOVO: Importa a página de registro
import PastaDetailPage from './pages/PastaDetailPage';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { token } = useAuth();

  return (
    <div>
      {token && <Navbar />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} /> {/* <-- NOVO: Rota para a página de registro */}
        
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <ProcessosPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/pastas" 
          element={
            <ProtectedRoute>
              <PastasPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/pastas/:folderId" 
          element={
            <ProtectedRoute>
              <PastaDetailPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;