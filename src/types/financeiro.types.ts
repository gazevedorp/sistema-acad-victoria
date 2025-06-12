export interface FinanceiroMatricula {
  id: string; // UUID
  id_matricula: string; // UUID
  id_caixa: string | null; // UUID, nullable
  id_aluno: string; // UUID
  vencimento: string; // Date (ISO string format e.g., "YYYY-MM-DD")
  valor_total: number; // Numeric
  pago: boolean;
  created_at: string; // Timestamp with timezone (ISO string)
  updated_at: string; // Timestamp with timezone (ISO string)
}

// You might also want a type for new entries if some fields are optional before DB defaults
export type NewFinanceiroMatricula = Omit<FinanceiroMatricula, 'id' | 'created_at' | 'updated_at' | 'pago'> & {
  pago?: boolean;
};
