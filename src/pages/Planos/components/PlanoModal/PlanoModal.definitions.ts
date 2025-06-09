export enum ModalMode {
  CREATE,
  EDIT,
  VIEW,
}

export interface PlanoFormData {
  nome: string;
  valor_mensal: number; // Consistent with page display, will map to 'valor' for DB
  ativo: boolean;
  modalidade_id?: string | null;
}
