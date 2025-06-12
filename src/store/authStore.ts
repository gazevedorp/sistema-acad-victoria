import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

// (Recomendado) Crie um tipo para seu perfil de usuário para melhorar o autocompletar e a segurança de tipos.
// Substitua as propriedades pelos campos da sua tabela de perfis.
type UserProfile = {
  permissao: string,
  // Adicione outros campos do perfil aqui
};

// Combine o tipo User do Supabase com o seu tipo de perfil
type UserWithProfile = User & UserProfile;

interface AuthState {
  // O usuário agora pode ser do tipo combinado ou nulo
  user: UserWithProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

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
        //    !! Substitua 'profiles' pelo nome da sua tabela de usuários !!
        const { data: profileData, error: profileError } = await supabase
          .from("usuarios") // <-- Altere "profiles" para o nome da sua tabela
          .select("*")
          .eq("id", authData.user.id)
          .single(); // .single() retorna um objeto único ou um erro, perfeito para perfis

        if (profileError) {
          // Você pode optar por apenas logar o erro e continuar sem os dados do perfil
          console.error("Erro ao buscar perfil do usuário:", profileError.message);
          // Ou lançar um erro para interromper o processo de login
          // throw new Error(profileError.message);
        }

        // 3. Combina os dados de autenticação com os dados do perfil
        const combinedUser = {
          ...authData.user,
          ...(profileData || {}), // Usa um objeto vazio como fallback caso o perfil não seja encontrado
        };

        // 4. Atualiza o estado com o usuário combinado
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