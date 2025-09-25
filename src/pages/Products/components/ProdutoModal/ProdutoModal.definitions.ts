export enum ModalMode {
  CREATE,
  EDIT,
  VIEW,
}

export interface ProdutoFormData {
  nome: string;
  valor: number;
  ativo: boolean;
}
