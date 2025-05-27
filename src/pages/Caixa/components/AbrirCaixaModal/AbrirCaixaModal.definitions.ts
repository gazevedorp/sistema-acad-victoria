import * as yup from "yup";

export interface AbrirCaixaFormData {
  valorInicial: number;
  observacoesAbertura?: string;
}

export const abrirCaixaSchema = yup.object().shape({
  valorInicial: yup.number()
    .typeError("Valor inicial deve ser um número")
    .min(0, "Valor inicial não pode ser negativo")
    .required("Valor inicial é obrigatório"),
  observacoesAbertura: yup.string().optional().nullable(),
});