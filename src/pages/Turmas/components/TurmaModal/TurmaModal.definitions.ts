export enum ModalMode {
  CREATE,
  EDIT,
  VIEW,
}

export interface TurmaFormData {
  nome: string;
  ativo: boolean;
  modalidade_id?: string | null;
}
