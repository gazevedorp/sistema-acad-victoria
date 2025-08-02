import React from 'react';
import { useAuthStore } from '../../store/authStore';

interface PermissionGateProps {
  children: React.ReactNode;
  module: string;
  action?: 'visualizar' | 'criar' | 'editar' | 'excluir';
  fallback?: React.ReactNode;
  requireAll?: boolean; // Se true, requer todas as ações listadas
}

// Componente para controlar acesso baseado em permissões
export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  module,
  action = 'visualizar',
  fallback = null,
}) => {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const user = useAuthStore((state) => state.user);

  // Se o usuário não existe ou ainda não carregou as permissões, não mostra nada
  if (!user || !user.permissions) {
    return <div>Carregando...</div>;
  }

  if (!hasPermission(module, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Componente específico para botões de ação
interface ActionButtonProps {
  children: React.ReactNode;
  module: string;
  action: 'criar' | 'editar' | 'excluir';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  module,
  action,
  onClick,
  disabled = false,
  ...props
}) => {
  const hasPermission = useAuthStore((state) => state.hasPermission);

  if (!hasPermission(module, action)) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// Hook para usar em componentes que precisam de verificação condicional
export const useModuleAccess = (module: string) => {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const user = useAuthStore((state) => state.user);

  const loading = !user || !user.permissions;

  return {
    loading,
    canAccess: hasPermission(module, 'visualizar'),
    canView: hasPermission(module, 'visualizar'),
    canCreate: hasPermission(module, 'criar'),
    canEdit: hasPermission(module, 'editar'),
    canDelete: hasPermission(module, 'excluir'),
  };
};
