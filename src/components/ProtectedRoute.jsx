import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, requiredLevel = null, allowedLevels = [] }) {
  const { user, userProfile, loading, isAuthenticated } = useAuth();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return <LoadingSpinner />;
  }

  // Redirecionar para login se não autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se há nível específico requerido
  if (requiredLevel && userProfile?.level !== requiredLevel) {
    return (
      <div className="min-h-screen bg-gradient-luxury flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Acesso Negado</h1>
          <p className="text-dark-300 mb-6">
            Você precisa ter o nível <span className="text-primary-400 font-semibold">{requiredLevel}</span> para acessar esta página.
          </p>
          <p className="text-dark-400">
            Seu nível atual: <span className="text-primary-300">{userProfile?.level || 'Não definido'}</span>
          </p>
        </div>
      </div>
    );
  }

  // Se há lista de níveis permitidos
  if (allowedLevels.length > 0 && !allowedLevels.includes(userProfile?.level)) {
    return (
      <div className="min-h-screen bg-gradient-luxury flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Acesso Negado</h1>
          <p className="text-dark-300 mb-6">
            Você precisa ter um dos seguintes níveis para acessar esta página:
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {allowedLevels.map(level => (
              <span key={level} className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-lg text-sm">
                {level}
              </span>
            ))}
          </div>
          <p className="text-dark-400">
            Seu nível atual: <span className="text-primary-300">{userProfile?.level || 'Não definido'}</span>
          </p>
        </div>
      </div>
    );
  }

  // Se passou por todas as verificações, renderizar o componente
  return children;
} 