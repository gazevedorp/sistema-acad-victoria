import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

// Mapeamento de rotas para módulos
const routeToModuleMap: Record<string, string> = {
  '/': 'home',
  '/home': 'home',
  '/clients': 'clientes',
  '/turmas': 'turmas',
  '/modalidades': 'modalidades',
  '/planos': 'planos',
  '/products': 'produtos',
  '/caixa': 'caixa',
  '/users': 'usuarios',
  '/permissoes': 'permissoes',
  '/relatorios': 'relatorios',
  '/caixas': 'caixa',
  '/formas-pagamento': 'formas_pagamento',
  '/templates-fechamento': 'templates_fechamento',
};

interface ProtectedRouteProps {
  requireModule?: string; // Módulo específico requerido
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requireModule }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  // Primeiro verifica se está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se o usuário ainda não foi carregado completamente (sem permissões), mostra loading
  if (!user || !user.permissions) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '16px',
        color: '#666'
      }}>
        Carregando permissões...
      </div>
    );
  }

  // Determina o módulo necessário
  const moduleRequired = requireModule || routeToModuleMap[location.pathname];

  // Se não conseguiu determinar o módulo, permite acesso (rotas públicas)
  if (!moduleRequired) {
    return <Outlet />;
  }

  // Verifica se tem permissão para acessar o módulo
  if (!hasPermission(moduleRequired, 'visualizar')) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#dc3545',
        textAlign: 'center',
        padding: '20px'
      }}>
        <h2>Acesso Negado</h2>
        <p>Você não tem permissão para acessar esta página.</p>
        <button 
          onClick={() => window.history.back()}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#0898e6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Voltar
        </button>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
