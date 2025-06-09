export interface Turma {
    id: string;
    nome: string;
    ativo: boolean;
    modalidade_id?: string | null;
    modalidades?: { nome: string } | null; // Consistent with Planos for Supabase join
  }