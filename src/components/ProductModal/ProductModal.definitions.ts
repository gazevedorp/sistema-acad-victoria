import * as yup from 'yup';

export interface ProductModalFormData {
  nome: string;
  valor: number;
  ativo: boolean;
}

export const productModalSchema = yup.object().shape({
  nome: yup
    .string()
    .required('Nome do produto é obrigatório.')
    .min(3, 'Nome do produto deve ter pelo menos 3 caracteres.')
    .max(100, 'Nome do produto não pode exceder 100 caracteres.'),
  valor: yup
    .number()
    .typeError('Valor deve ser um número.')
    .positive('Valor deve ser um número positivo.')
    .required('Valor do produto é obrigatório.'),
  ativo: yup
    .boolean()
    .required('Status de ativo é obrigatório.'),
});
