import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as S from './UserModal.styles'; // Assuming styles will be adapted
import { UserModalFormData, userModalSchema } from './UserModal.definitions';
import { SistemUser } from '../../types/UserType';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UserModalFormData, userId?: string) => Promise<void>;
  user?: SistemUser | null;
  isEditing?: boolean;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, user, isEditing = false }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch, // Watch for senha to use in confirmarSenha validation
  } = useForm<UserModalFormData>({
    resolver: yupResolver(userModalSchema(isEditing)), // Pass isEditing to the schema
    defaultValues: { // Set default values
      nome: '',
      email: '',
      telefone: '',
      senha: '',
      confirmarSenha: '',
      permissao: 'recepcao', // Default permission
      ativo: true, // Default to active
    }
  });

  // Watch password field for conditional validation if needed, though yup handles ref.
  // const senhaValue = watch('senha');

  useEffect(() => {
    if (isOpen) {
      if (user && isEditing) {
        setValue('nome', user.nome);
        setValue('email', user.email);
        setValue('telefone', user.telefone);
        setValue('permissao', user.permissao);
        setValue('ativo', user.ativo);
        // Do not set password fields when editing
        setValue('senha', '');
        setValue('confirmarSenha', '');
      } else {
        // Reset to default values for creation mode or if no user
        reset({
          nome: '',
          email: '',
          telefone: '',
          senha: '',
          confirmarSenha: '',
          permissao: 'recepcao',
          ativo: true,
        });
      }
    }
  }, [isOpen, user, isEditing, setValue, reset]);

  const onSubmit: SubmitHandler<UserModalFormData> = async (data) => {
    await onSave(data, user?.id);
  };

  if (!isOpen) return null;

  return (
    <S.ModalOverlay onClick={onClose}>
      <S.ModalContainer onClick={(e) => e.stopPropagation()}>
        <S.ModalHeader>
          <S.ModalTitle>{isEditing ? 'Editar Usuário' : 'Criar Novo Usuário'}</S.ModalTitle>
          <S.CloseButton onClick={onClose}>&times;</S.CloseButton>
        </S.ModalHeader>
        <S.ModalBody>
          <S.Form onSubmit={handleSubmit(onSubmit)}>
            <S.FormGroup>
              <S.Label htmlFor="nome">Nome</S.Label>
              <S.Input id="nome" {...register('nome')} />
              {errors.nome && <S.ErrorMsg>{errors.nome.message}</S.ErrorMsg>}
            </S.FormGroup>

            <S.FormGroup>
              <S.Label htmlFor="email">Email</S.Label>
              <S.Input id="email" type="email" {...register('email')} />
              {errors.email && <S.ErrorMsg>{errors.email.message}</S.ErrorMsg>}
            </S.FormGroup>

            <S.FormGroup>
              <S.Label htmlFor="telefone">Telefone</S.Label>
              <S.Input id="telefone" {...register('telefone')} />
              {errors.telefone && <S.ErrorMsg>{errors.telefone.message}</S.ErrorMsg>}
            </S.FormGroup>

            {!isEditing && (
              <>
                <S.FormGroup>
                  <S.Label htmlFor="senha">Senha</S.Label>
                  <S.Input id="senha" type="password" {...register('senha')} />
                  {errors.senha && <S.ErrorMsg>{errors.senha.message}</S.ErrorMsg>}
                </S.FormGroup>

                <S.FormGroup>
                  <S.Label htmlFor="confirmarSenha">Confirmar Senha</S.Label>
                  <S.Input id="confirmarSenha" type="password" {...register('confirmarSenha')} />
                  {errors.confirmarSenha && <S.ErrorMsg>{errors.confirmarSenha.message}</S.ErrorMsg>}
                </S.FormGroup>
              </>
            )}

            <S.FormGroup>
              <S.Label htmlFor="permissao">Permissão</S.Label>
              <S.Select id="permissao" {...register('permissao')}>
                <option value="recepcao">Recepção</option>
                <option value="admin">Admin</option>
              </S.Select>
              {errors.permissao && <S.ErrorMsg>{errors.permissao.message}</S.ErrorMsg>}
            </S.FormGroup>

            <S.FormGroupCheckbox>
              <S.CheckboxInput id="ativo" type="checkbox" {...register('ativo')} defaultChecked={true} />
              <S.Label htmlFor="ativo" style={{ marginBottom: 0 }}>Ativo</S.Label>
              {errors.ativo && <S.ErrorMsg>{errors.ativo.message}</S.ErrorMsg>}
            </S.FormGroupCheckbox>

            <S.SubmitButtonContainer>
              <S.SubmitButton type="submit">
                {isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
              </S.SubmitButton>
            </S.SubmitButtonContainer>
          </S.Form>
        </S.ModalBody>
      </S.ModalContainer>
    </S.ModalOverlay>
  );
};

export default UserModal;
