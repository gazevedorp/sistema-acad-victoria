export interface Caixa {
  id: string; // UUID
  usuario_id: string; // UUID of the user who opened/closed the cash register
  valor_inicial: number;
  data_abertura: string; // ISO 8601 datetime string
  data_fechamento?: string | null; // ISO 8601 datetime string, can be null if open
  status: 'aberto' | 'fechado' | 'conferido'; // Or other relevant statuses
  observacoes_abertura?: string | null;
  obs_fechamento?: string | null;
  valor_total_entradas?: number | null; // Calculated: sum of all positive transactions
  valor_total_saidas?: number | null; // Calculated: sum of all negative transactions (excluding initial value)
  saldo_final_calculado?: number | null; // Calculated: valor_inicial + valor_total_entradas - valor_total_saidas
  // Potentially other fields like:
  // valor_fechamento_manual?: number | null; // If manual entry is allowed for closing
  // diferenca_caixa?: number | null; // saldo_final_calculado - valor_fechamento_manual
}

// Interface for Caixa data when joined with user information (e.g., email)
export interface CaixaWithUserEmail extends Caixa {
  usuario_email?: string; // Email of the user, fetched from a related table
}

// Interface for the structure returned by Supabase when joining
// This is a helper, as Supabase returns related records as an object or array
export interface SupabaseCaixaResponse extends Omit<Caixa, 'usuario_id'> {
  usuario_id: string; // Keep this if you still need the raw ID
  usuarios?: { email: string } | null; // Example structure if 'usuarios' is the related table
}
