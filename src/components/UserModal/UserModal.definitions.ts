import * as yup from 'yup';

export interface UserModalFormData {
  nome: string;
  email: string;
  telefone: string;
  senha?: string; // Optional because not needed for edit
  confirmarSenha?: string; // Optional
  permissao: 'admin' | 'recepcao';
  ativo: boolean;
}

export const userModalSchema = (isEditing: boolean) => yup.object().shape({
  nome: yup.string().required('Nome é obrigatório.'),
  email: yup.string().email('Email inválido.').required('Email é obrigatório.'),
  telefone: yup.string().required('Telefone é obrigatório.'),
  // Conditionally require senha and confirmarSenha only if not editing (i.e., creating)
  senha: yup.string().when([], { // No direct dependency, but allows conditional logic
    is: () => !isEditing,
    then: (schema) => schema.required('Senha é obrigatória.').min(6, 'Senha deve ter no mínimo 6 caracteres.'),
    otherwise: (schema) => schema.notRequired(),
  }),
  confirmarSenha: yup.string().when('senha', { // Depends on 'senha' field
     is: (senhaField: string | undefined) => !isEditing && !!senhaField, // Only validate if not editing and senha is present
     then: (schema) => schema.required('Confirmação de senha é obrigatória.')
                          .oneOf([yup.ref('senha')], 'As senhas não conferem.'),
     otherwise: (schema) => schema.notRequired(),
  }),
  permissao: yup.string().oneOf(['admin', 'recepcao'], 'Permissão inválida.').required('Permissão é obrigatória.'),
  ativo: yup.boolean().required('Status é obrigatório.'),
});
