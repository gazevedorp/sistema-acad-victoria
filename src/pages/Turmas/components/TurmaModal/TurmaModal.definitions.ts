import * as Yup from 'yup';
import { TurmaFormData, ModalidadeBasicInfo } from '../../../../types/TurmaTypes';

/**
 * Enum for the mode of the modal (Create, View, Edit).
 */
export enum ModalMode {
  CREATE = 'CREATE',
  VIEW = 'VIEW',
  EDIT = 'EDIT',
}

/**
 * Base properties for the TurmaModal component.
 */
export interface BaseTurmaModalProps {
  open: boolean;
  mode: ModalMode;
  onClose: () => void;
  initialData?: Partial<TurmaFormData>; // Data to pre-fill the form, especially for EDIT/VIEW
  turmaIdToEdit?: string; // ID of the turma being edited, required for EDIT mode
  modalidades: ModalidadeBasicInfo[]; // List of modalities to populate the select input
  onSaveComplete: (
    error: any | null,
    savedData?: TurmaFormData, // The data that was successfully saved
    mode?: ModalMode, // The mode in which the save was attempted
  ) => void;
}

/**
 * Yup validation schema for TurmaFormData.
 */
export const turmaSchema = Yup.object().shape({
  nome: Yup.string()
    .required('Nome é obrigatório')
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome não pode exceder 100 caracteres'),
  capacidade: Yup.number()
    .typeError('Capacidade deve ser um número')
    .required('Capacidade é obrigatória')
    .positive('Capacidade deve ser um número positivo')
    .integer('Capacidade deve ser um número inteiro')
    .min(1, 'Capacidade mínima é 1'),
  horarios_descricao: Yup.string()
    .required('Descrição dos horários é obrigatória')
    .min(5, 'Descrição dos horários deve ter pelo menos 5 caracteres')
    .max(255, 'Descrição dos horários não pode exceder 255 caracteres'),
  descricao: Yup.string()
    .optional()
    .nullable()
    .max(500, 'Descrição não pode exceder 500 caracteres'),
  modalidade_id: Yup.string()
    .required('Modalidade é obrigatória'),
  ativo: Yup.boolean()
    .required('Status é obrigatório'),
});

/**
 * Default form values for the Turma form.
 * Useful for initializing react-hook-form.
 */
export const defaultTurmaFormValues: TurmaFormData = {
  nome: '',
  capacidade: 0, // Or a more sensible default like 10 or null if schema allows
  horarios_descricao: '',
  descricao: '',
  modalidade_id: '',
  ativo: true, // Default to active
};
