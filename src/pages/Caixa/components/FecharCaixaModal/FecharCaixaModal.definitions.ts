import * as yup from "yup";

export interface FecharCaixaFormData {
  observacoes_fechamento?: string;
}

export const fecharCaixaSchema = yup.object().shape({
  observacoes_fechamento: yup.string().optional().nullable(),
});