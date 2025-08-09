// src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // <-- IMPORTE O PROVEDOR

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* <-- ENVOLVA O APP COM ELE */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);