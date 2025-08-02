// src/types/FormaPagamentoTypes.ts

export interface FormaPagamento {
  id: string;
  nome: string;
  descricao?: string;
  ativo_venda: boolean;
  ativo_mensalidade: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormaPagamentoFormData {
  nome: string;
  descricao?: string;
  ativo_venda: boolean;
  ativo_mensalidade: boolean;
}
