// src/types/PlanoTypes.ts

// For ModalidadeBasicInfo, it's assumed to be imported from './TurmaTypes.ts' or a shared ModalidadeTypes.ts
// For example:
// import { ModalidadeBasicInfo } from './TurmaTypes';
// import { ModalidadeBasicInfo } from './ModalidadeTypes';

/**
 * Represents a Plano (Plan) as stored in the database.
 */
export interface Plano {
  id: string; // UUID from Supabase, auto-generated
  created_at?: string; // Supabase managed
  updated_at?: string; // Supabase managed
  nome: string; // Name of the plan
  modalidade_id: string; // Foreign key referencing the 'modalidades' table
  ativo: boolean; // Status of the plan (active/inactive)
  valor_mensal: number; // Monthly value/price of the plan (float)

  modalidade_nome?: string; // Optional: Name of the modality, if joined from 'modalidades' table
}

/**
 * Represents the data structure for forms used to create or edit a Plano.
 * It omits database-managed fields like id, created_at, updated_at.
 */
export interface PlanoFormData {
  nome: string;
  modalidade_id: string;
  ativo: boolean;
  valor_mensal: number; // Input as number
}
