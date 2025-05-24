import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

// Contextos
import { AppProvider } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PERFORMANCE_CONFIG } from './config/performance';

// Componentes
import Layout from './components/Layout';
import Login from './components/Login';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';


// Páginas
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Vendas from './pages/Vendas';
import PDV from './pages/PDV';
import Orcamento from './pages/Orcamento';
import OrdemServico from './pages/OrdemServico';
import Servicos from './pages/Servicos';
import Financeiro from './pages/Financeiro';
import Clientes from './pages/Clientes';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import ChatInterno from './pages/ChatInterno';

// Definir níveis de acesso para cada rota
const ROUTE_PERMISSIONS = {
  dashboard: ['ADMIN', 'VENDEDOR', 'TECNICO', 'MARKETING', 'POS_VENDA'],
  produtos: ['ADMIN', 'VENDEDOR', 'TECNICO'],
  servicos: ['ADMIN', 'TECNICO', 'POS_VENDA'],
  vendas: ['ADMIN', 'VENDEDOR'],
  financeiro: ['ADMIN', 'VENDEDOR'],
  clientes: ['ADMIN', 'VENDEDOR', 'TECNICO', 'MARKETING', 'POS_VENDA'], // TECNICO adicionado
  relatorios: ['ADMIN', 'MARKETING'],
  configuracoes: ['ADMIN'],
  chat: ['ADMIN', 'VENDEDOR', 'TECNICO', 'MARKETING', 'POS_VENDA']
};

// Componente principal do app
function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AnimatePresence>
    );
  }

  return (
    <AppProvider>
      <Layout>
        <AnimatePresence mode="wait">
          <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute allowedLevels={ROUTE_PERMISSIONS.dashboard}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/produtos" 
              element={
                <ProtectedRoute allowedLevels={ROUTE_PERMISSIONS.produtos}>
                  <Produtos />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/servicos" 
              element={
                <ProtectedRoute allowedLevels={ROUTE_PERMISSIONS.servicos}>
                  <Servicos />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/vendas" 
              element={
                <ProtectedRoute allowedLevels={ROUTE_PERMISSIONS.vendas}>
                  <Vendas />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/vendas/pdv" 
              element={
                <ProtectedRoute allowedLevels={ROUTE_PERMISSIONS.vendas}>
                  <PDV />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/vendas/orcamento" 
              element={
                <ProtectedRoute allowedLevels={ROUTE_PERMISSIONS.vendas}>
                  <Orcamento />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/vendas/os" 
              element={
                <ProtectedRoute allowedLevels={['ADMIN', 'VENDEDOR', 'TECNICO']}>
                  <OrdemServico />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/financeiro" 
              element={
                <ProtectedRoute allowedLevels={ROUTE_PERMISSIONS.financeiro}>
                  <Financeiro />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/clientes" 
              element={
                <ProtectedRoute allowedLevels={ROUTE_PERMISSIONS.clientes}>
                  <Clientes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/relatorios" 
              element={
                <ProtectedRoute allowedLevels={ROUTE_PERMISSIONS.relatorios}>
                  <Relatorios />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/configuracoes" 
              element={
                <ProtectedRoute requiredLevel="ADMIN">
                  <Configuracoes />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute allowedLevels={ROUTE_PERMISSIONS.chat}>
                  <ChatInterno />
                </ProtectedRoute>
              } 
            />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Layout>
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: PERFORMANCE_CONFIG.TOAST_DURATION,
              style: {
                background: '#1e293b',
                color: '#ffffff',
                border: '1px solid #334155',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)', // Reduzido para melhor performance
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)', // Reduzido
              },
              success: {
                iconTheme: {
                  primary: '#FF2C68',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
            }}
            maxCount={PERFORMANCE_CONFIG.MAX_TOASTS}
          />
      </div>
      </Router>
    </AuthProvider>
  );
}
