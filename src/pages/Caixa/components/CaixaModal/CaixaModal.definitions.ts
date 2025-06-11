import * as yup from "yup";

export enum TipoMovimentacaoCaixa {
  PAGAMENTO_MENSALIDADE = "pagamento",
  VENDA_PRODUTO = "venda",
  SAIDA_CAIXA = "saida",
}

// Tipos para os dados que virão dos selects (mock simples, ajuste conforme seus dados reais)
export interface AlunoParaSelect {
  id: string;
  nome: string;
}

export interface ProdutoParaSelect {
  id: string;
  nome: string;
  valor?: number; // AJUSTADO AQUI
}

export interface FormaPagamentoParaSelect {
  id: string; // ou o valor que você usa, ex: 'pix', 'dinheiro'
  nome: string;
}

export interface CaixaModalFormData {
  tipo: TipoMovimentacaoCaixa;
  valor: number;
  forma_pagamento: string; // ID da forma de pagamento
  descricao?: string; // Obrigatório para saída, opcional para outros

  // Campos condicionais
  cliente_id?: string; // Para Pagamento de Mensalidade
  produto_id?: string; // Para Venda de Produto
  quantidade?: number; // Para Venda de Produto
}

export const caixaModalSchema = yup.object().shape({
  tipo: yup
    .string()
    .oneOf(Object.values(TipoMovimentacaoCaixa))
    .required("Tipo de movimentação é obrigatório"),
  valor: yup
    .number()
    .typeError("Valor deve ser um número")
    .positive("Valor deve ser positivo")
    .required("Valor é obrigatório"),
  forma_pagamento: yup.string().required("Forma de pagamento é obrigatória"),
  descricao: yup.string().when("tipo", {
    is: TipoMovimentacaoCaixa.SAIDA_CAIXA,
    then: (schema) => schema.required("Descrição é obrigatória para saídas").min(5, "Descrição muito curta"),
    otherwise: (schema) => schema.optional().nullable(),
  }),
  cliente_id: yup.string().when("tipo", {
    is: TipoMovimentacaoCaixa.PAGAMENTO_MENSALIDADE,
    then: (schema) => schema.required("Selecione o aluno"),
    otherwise: (schema) => schema.optional().nullable(),
  }),
  produto_id: yup.string().when("tipo", {
    is: TipoMovimentacaoCaixa.VENDA_PRODUTO,
    then: (schema) => schema.required("Selecione o produto"),
    otherwise: (schema) => schema.optional().nullable(),
  }),
  quantidade: yup.number().when("tipo", {
    is: TipoMovimentacaoCaixa.VENDA_PRODUTO,
    then: (schema) =>
      schema
        .typeError("Quantidade deve ser um número")
        .positive("Quantidade deve ser positiva")
        .integer("Quantidade deve ser um número inteiro")
        .required("Quantidade é obrigatória"),
    otherwise: (schema) => schema.optional().nullable(),
  }),
});