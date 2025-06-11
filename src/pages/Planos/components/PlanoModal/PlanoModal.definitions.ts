import * as Yup from 'yup';
import { PlanoFormData } from '../../../../types/PlanoTypes';
import { ModalidadeBasicInfo } from '../../../../types/TurmaTypes'; // Assuming this path for now

/**
 * Enum for the mode of the modal (Create, View, Edit).
 * Re-defined here for encapsulation, but could be a shared type.
 */
export enum ModalMode {
  CREATE = 'CREATE',
  VIEW = 'VIEW',
  EDIT = 'EDIT',
}

/**
 * Base properties for the PlanoModal component.
 */
export interface BasePlanoModalProps {
  open: boolean;
  mode: ModalMode;
  onClose: () => void;
  initialData?: Partial<PlanoFormData>; // Data to pre-fill the form
  planoIdToEdit?: string; // ID of the plano being edited
  modalidades: ModalidadeBasicInfo[]; // List of modalities for the select input
  onSaveComplete: (
    error: any | null,
    savedData?: PlanoFormData,
    mode?: ModalMode,
  ) => void;
}

/**
 * Yup validation schema for PlanoFormData.
 */
export const planoSchema = Yup.object().shape({
  nome: Yup.string()
    .required('Nome é obrigatório')
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome não pode exceder 100 caracteres'),
  modalidade_id: Yup.string()
    .required('Modalidade é obrigatória'),
  valor_mensal: Yup.number()
    .typeError('Valor mensal deve ser um número')
    .required('Valor mensal é obrigatório')
    .positive('Valor mensal deve ser um número positivo')
    .min(0.01, 'Valor mensal deve ser maior que zero'), // Assuming value must be greater than 0
  desconto_em_combinacao: Yup.number()
    .typeError('Desconto deve ser um número')
    .required('Desconto é obrigatório')
    .min(0, 'Desconto não pode ser negativo')
    .max(100, 'Desconto não pode exceder 100%')
    .integer('Desconto deve ser um número inteiro (0-100)'),
  ativo: Yup.boolean()
    .required('Status é obrigatório'),
});

/**
 * Default form values for the Plano form.
 */
export const defaultPlanoFormValues: PlanoFormData = {
  nome: '',
  modalidade_id: '',
  valor_mensal: 0, // Or a more sensible default like 50.00
  desconto_em_combinacao: 0, // Default to 0% discount
  ativo: true, // Default to active
};
