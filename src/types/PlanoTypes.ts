// src/types/PlanoTypes.ts

// For ModalidadeBasicInfo, it's assumed to be imported from './TurmaTypes.ts' or a shared ModalidadeTypes.ts
// For example:
// import { ModalidadeBasicInfo } from './TurmaTypes';
// import { ModalidadeBasicInfo } from './ModalidadeTypes';

/**
 * Represents a Modalidade (Plan) as stored in the modalidades_old table.
 */
export interface Plano {
  modalidadeID: number; // Primary key from modalidades_old
  modalidadeNome: string | null; // Name of the modality
  modalidadeMensal: number | null; // Monthly value (numeric)
  modalidadeAtiva: boolean | null; // Status of the modality (active/inactive)
  modalidadeExcluida: boolean | null; // Soft delete flag

  // Mapped fields for compatibility with existing code
  id?: string; // Mapped from modalidadeID for compatibility
  nome?: string; // Mapped from modalidadeNome
  valor?: number; // Mapped from modalidadeMensal
  ativo?: boolean; // Mapped from modalidadeAtiva
}

/**
 * Represents the data structure for forms used to create or edit a Modalidade.
 * Based on modalidades_old table structure.
 */
export interface PlanoFormData {
  modalidadeNome: string;
  modalidadeMensal: number;
  modalidadeAtiva: boolean;

  // Compatibility fields
  nome?: string; // Mapped from modalidadeNome
  valor_mensal?: number; // Mapped from modalidadeMensal
  ativo?: boolean; // Mapped from modalidadeAtiva
}
