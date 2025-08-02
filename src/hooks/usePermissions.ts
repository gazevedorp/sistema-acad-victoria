import { useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

export interface UserPermission {
  modulo: string;
  permissao: 'visualizar' | 'criar' | 'editar' | 'excluir';
}

// Hook para gerenciar permissões do usuário
export const usePermissions = () => {
  const { user } = useAuthStore();
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar permissões do usuário baseado na categoria
  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (!user?.permissao) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('categoria_permissoes')
          .select('modulo, permissao')
          .eq('categoria_usuario', user.permissao)
          .eq('ativo', true);

        if (error) {
          console.error('Erro ao buscar permissões:', error);
          setPermissions([]);
        } else {
          setPermissions(data || []);
        }
      } catch (err) {
        console.error('Erro ao carregar permissões:', err);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPermissions();
  }, [user?.permissao]);

  // Verificar se o usuário tem uma permissão específica
  const hasPermission = useMemo(() => {
    return (modulo: string, acao: 'visualizar' | 'criar' | 'editar' | 'excluir') => {
      if (!user) return false;
      
      // Admin sempre tem acesso total (fallback)
      if (user.permissao === 'admin') return true;
      
      return permissions.some(
        perm => perm.modulo === modulo && perm.permissao === acao
      );
    };
  }, [permissions, user]);

  // Verificar se pode acessar um módulo inteiro (pelo menos visualizar)
  const canAccessModule = useMemo(() => {
    return (modulo: string) => {
      return hasPermission(modulo, 'visualizar');
    };
  }, [hasPermission]);

  // Obter todas as permissões de um módulo específico
  const getModulePermissions = useMemo(() => {
    return (modulo: string) => {
      return permissions
        .filter(perm => perm.modulo === modulo)
        .map(perm => perm.permissao);
    };
  }, [permissions]);

  // Verificar se é admin
  const isAdmin = useMemo(() => {
    return user?.permissao === 'admin';
  }, [user?.permissao]);

  // Verificar se é recepção
  const isRecepcao = useMemo(() => {
    return user?.permissao === 'recepcao';
  }, [user?.permissao]);

  return {
    permissions,
    loading,
    hasPermission,
    canAccessModule,
    getModulePermissions,
    isAdmin,
    isRecepcao,
    userCategory: user?.permissao || null,
  };
};

// Hook para permissões específicas de componentes
export const useModulePermissions = (modulo: string) => {
  const { hasPermission, canAccessModule, getModulePermissions, loading } = usePermissions();

  return {
    loading,
    canAccess: canAccessModule(modulo),
    canView: hasPermission(modulo, 'visualizar'),
    canCreate: hasPermission(modulo, 'criar'),
    canEdit: hasPermission(modulo, 'editar'),
    canDelete: hasPermission(modulo, 'excluir'),
    permissions: getModulePermissions(modulo),
  };
};
