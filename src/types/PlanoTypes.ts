export interface Plano {
    id: string;
    nome: string;
    valor: number;
    ativo: boolean;
    modalidade_id?: string | null;
    modalidades?: { nome: string } | null; // For Supabase join: modalidade:modalidades(nome)
  }