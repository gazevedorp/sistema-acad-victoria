export enum ModalMode {
  CREATE,
  EDIT,
  VIEW,
}

export interface PlanoFormData {
  modalidadeNome: string;
  modalidadeMensal: number;
  modalidadeAtiva: boolean;
  
  // Compatibility fields
  nome?: string;
  valor_mensal?: number;
  ativo?: boolean;
}
