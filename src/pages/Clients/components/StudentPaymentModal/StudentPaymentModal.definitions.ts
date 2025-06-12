// src/pages/Clients/components/StudentPaymentModal/StudentPaymentModal.definitions.ts
import * as yup from "yup";

// Copied from CaixaModal.definitions.ts - consider moving to a shared file later
export interface FormaPagamentoParaSelect {
  id: string;
  nome: string;
}

export interface StudentPaymentModalFormData {
  valor: number;
  forma_pagamento: string;
  descricao?: string; // Reverted to optional property
}

export const studentPaymentModalSchema: yup.ObjectSchema<StudentPaymentModalFormData> = yup.object().shape({
  valor: yup
    .number()
    .typeError("Valor deve ser um número")
    .positive("Valor deve ser positivo")
    .required("Valor é obrigatório"),
  forma_pagamento: yup.string().required("Forma de pagamento é obrigatória"),
  descricao: yup.string().optional(), // Simplified to .optional() only
});
