// src/types/TurmaTypes.ts

/**
 * Represents a Turma (Class/Group) as stored in the database.
 */
export interface Turma {
  id: string; // UUID from Supabase, auto-generated
  created_at?: string; // Supabase managed
  updated_at?: string; // Supabase managed
  nome: string; // Name of the class/group
  capacidade: number; // Capacity of the class (integer)
  horarios_descricao: string; // Description of schedules (e.g., "Mon, Wed, Fri 10:00-11:00")
  descricao?: string | null; // Optional detailed description of the class
  modalidade_id: string; // Foreign key referencing the 'modalidades' table
  ativo: boolean; // Status of the class (active/inactive)
  modalidade_nome?: string; // Optional: Name of the modality, if joined
}

/**
 * Represents the data structure for forms used to create or edit a Turma.
 * It omits database-managed fields like id, created_at, updated_at.
 */
export interface TurmaFormData {
  nome: string;
  capacidade: number; // react-hook-form can handle number inputs directly or parse them
  horarios_descricao: string;
  descricao?: string | null; // Optional
  modalidade_id: string; // Selected ID from the list of modalities
  ativo: boolean;
}

/**
 * Represents basic information for a Modalidade (Modality),
 * typically used for populating select inputs in forms.
 */
export interface ModalidadeBasicInfo {
  id: string; // Or number, depending on your 'modalidades' table ID type
  nome: string;
}
