// src/types/PresencaTypes.ts

export interface AlunoPresenca {
  codigo: number;
  codigo_aluno: string; // UUID
  data: string;
  hora_entrada: string;
  descricao?: string;
  created_at: string;
  updated_at: string;
}

export interface PresencaFormData {
  codigo_aluno: string; // UUID
  data: string;
  hora_entrada: string;
  descricao?: string;
}
