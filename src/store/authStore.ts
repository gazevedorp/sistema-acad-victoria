import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

// Tipo para as permissões específicas do usuário
type UserPermissions = {
  [modulo: string]: {
    visualizar?: boolean;
    criar?: boolean;
    editar?: boolean;
    excluir?: boolean;
  };
};

// Tipo para o perfil do usuário
type UserProfile = {
  permissao: string;
  permissions?: UserPermissions; // Permissões específicas baseadas na categoria
};

// Combine o tipo User do Supabase com o seu tipo de perfil
type UserWithProfile = User & UserProfile;

interface AuthState {
  user: UserWithProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (modulo: string, acao: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      hasPermission: (modulo: string, acao: string) => {
        const { user } = get();
        if (!user) return false;
        
        // Se for admin, tem todas as permissões
        if (user.permissao === 'admin') return true;
        
        // Verifica permissões específicas
        const modulePermissions = user.permissions?.[modulo];
        if (!modulePermissions) return false;
        
        return modulePermissions[acao as keyof typeof modulePermissions] === true;
      },

      login: async (email: string, password: string) => {
        // 1. Faz o login de autenticação
        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (authError) {
          throw new Error(authError.message);
        }

        if (!authData.user) {
          throw new Error("Usuário não encontrado após o login.");
        }

        // 2. Busca informações adicionais na tabela de perfis
        const { data: profileData, error: profileError } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        if (profileError) {
          console.error("Erro ao buscar perfil do usuário:", profileError.message);
        }

        // 3. Busca as permissões específicas da categoria do usuário
        const userPermission = profileData?.permissao?.toLowerCase() || "recepcao";
        
        const { data: permissionsData, error: permissionsError } = await supabase
          .from("categoria_permissoes")
          .select("modulo, permissao")
          .eq("categoria_usuario", userPermission)
          .eq("ativo", true);

        if (permissionsError) {
          console.error("Erro ao buscar permissões:", permissionsError.message);
        }

        // 4. Organiza as permissões em um objeto estruturado
        const permissions: UserPermissions = {};
        permissionsData?.forEach((perm) => {
          if (!permissions[perm.modulo]) {
            permissions[perm.modulo] = {};
          }
          permissions[perm.modulo][perm.permissao as keyof typeof permissions[typeof perm.modulo]] = true;
        });

        // 5. Combina os dados de autenticação com os dados do perfil e permissões
        const combinedUser = {
          ...authData.user,
          ...(profileData || {}),
          permissao: userPermission,
          permissions,
        };

        // 6. Atualiza o estado com o usuário combinado
        set({ user: combinedUser as UserWithProfile, isAuthenticated: true });
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
    }
  )
);