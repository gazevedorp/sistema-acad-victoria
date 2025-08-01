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
  // Senha: obrigatória no CREATE, opcional no EDIT (mas se preenchida, deve ter min 6 chars)
  senha: yup.string().when([], {
    is: () => !isEditing,
    then: (schema) => schema.required('Senha é obrigatória.').min(6, 'Senha deve ter no mínimo 6 caracteres.'),
    otherwise: (schema) => schema.min(6, 'Senha deve ter no mínimo 6 caracteres.').notRequired(),
  }),
  confirmarSenha: yup.string().when('senha', {
     is: (senhaField: string | undefined) => !!senhaField && senhaField.length > 0, // Validar se senha foi preenchida
     then: (schema) => schema.required('Confirmação de senha é obrigatória.')
                          .oneOf([yup.ref('senha')], 'As senhas não conferem.'),
     otherwise: (schema) => schema.notRequired(),
  }),
  permissao: yup.string().oneOf(['admin', 'recepcao'], 'Permissão inválida.').required('Permissão é obrigatória.'),
  ativo: yup.boolean().required('Status é obrigatório.'),
});
