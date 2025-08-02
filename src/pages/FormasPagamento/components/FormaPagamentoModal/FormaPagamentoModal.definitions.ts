// src/pages/FormasPagamento/components/FormaPagamentoModal/FormaPagamentoModal.definitions.ts
import * as yup from "yup";

export enum ModalMode {
  CREATE = "CREATE",
  EDIT = "EDIT",
  VIEW = "VIEW",
}

export interface BaseModalProps {
  open: boolean;
  mode: ModalMode;
  onClose: () => void;
}

export interface FormaPagamentoModalFormData {
  nome: string;
  descricao?: string;
  ativo_venda: boolean;
  ativo_mensalidade: boolean;
}

export const formaPagamentoModalSchema = yup.object().shape({
  nome: yup
    .string()
    .required("Nome é obrigatório")
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  descricao: yup
    .string()
    .max(255, "Descrição deve ter no máximo 255 caracteres")
    .optional(),
  ativo_venda: yup
    .boolean()
    .required("Status ativo para venda é obrigatório"),
  ativo_mensalidade: yup
    .boolean()
    .required("Status ativo para mensalidade é obrigatório"),
});
