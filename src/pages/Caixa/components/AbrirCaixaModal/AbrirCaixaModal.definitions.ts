import * as yup from "yup";

export interface AbrirCaixaFormData {
  valor_inicial: number;
  observacoes_abertura?: string | null;
}

export const abrirCaixaSchema = yup.object({
  valor_inicial: yup.number()
    .typeError("Valor inicial deve ser um número")
    .min(0, "Valor inicial não pode ser negativo")
    .required("Valor inicial é obrigatório"),
  observacoes_abertura: yup.string().nullable().optional(),
}).required();