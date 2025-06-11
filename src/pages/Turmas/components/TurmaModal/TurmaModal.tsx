import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { supabase } from '../../../../lib/supabase';
import { TurmaFormData, ModalidadeBasicInfo } from '../../../../types/TurmaTypes';
import { BaseTurmaModalProps, ModalMode, turmaSchema, defaultTurmaFormValues } from './TurmaModal.definitions';
import * as Styles from './TurmaModal.styles';
import Loader from '../../../../components/Loader/Loader'; // Assuming Loader path
import { COLORS } from '../../Turmas.styles';

const TurmaModal: React.FC<BaseTurmaModalProps> = ({
  open,
  mode,
  onClose,
  initialData,
  turmaIdToEdit,
  modalidades,
  onSaveComplete,
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const isViewMode = useMemo(() => mode === ModalMode.VIEW, [mode]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    setValue,
  } = useForm<TurmaFormData>({
    resolver: yupResolver(turmaSchema),
    defaultValues: defaultTurmaFormValues,
  });

  useEffect(() => {
    if (open) {
      setServerError(null); // Clear server error when modal opens
      if (mode === ModalMode.CREATE) {
        reset(defaultTurmaFormValues);
      } else if (initialData) {
        // Ensure all form fields are reset with initialData or defaults
        const dataToReset: TurmaFormData = {
            nome: initialData.nome || defaultTurmaFormValues.nome,
            capacidade: initialData.capacidade !== undefined ? initialData.capacidade : defaultTurmaFormValues.capacidade,
            horarios_descricao: initialData.horarios_descricao || defaultTurmaFormValues.horarios_descricao,
            descricao: initialData.descricao !== undefined ? initialData.descricao : defaultTurmaFormValues.descricao,
            modalidade_id: initialData.modalidade_id || defaultTurmaFormValues.modalidade_id,
            ativo: initialData.ativo !== undefined ? initialData.ativo : defaultTurmaFormValues.ativo,
        };
        reset(dataToReset);
      }
    }
  }, [open, mode, initialData, reset]);

  const onSubmit: SubmitHandler<TurmaFormData> = async (formData) => {
    setIsSubmitting(true);
    setServerError(null);
    let error = null;
    let savedData: TurmaFormData | undefined = undefined;

    const dataToSave: Partial<TurmaFormData> = {
      ...formData,
      // Supabase will convert to integer if column is integer. Ensure it's a number.
      capacidade: Number(formData.capacidade),
    };

    try {
      if (mode === ModalMode.CREATE) {
        const { data: newTurma, error: insertError } = await supabase
          .from('turmas')
          .insert([dataToSave])
          .select()
          .single();
        if (insertError) throw insertError;
        savedData = newTurma as TurmaFormData; // Assuming the select returns the same shape
      } else if (mode === ModalMode.EDIT && turmaIdToEdit) {
        const { data: updatedTurma, error: updateError } = await supabase
          .from('turmas')
          .update(dataToSave)
          .eq('id', turmaIdToEdit)
          .select()
          .single();
        if (updateError) throw updateError;
        savedData = updatedTurma as TurmaFormData;
      }
      onSaveComplete(null, savedData, mode);
      onClose(); // Close modal on successful save
    } catch (err: any) {
      console.error(`Error ${mode === ModalMode.CREATE ? 'creating' : 'updating'} turma:`, err);
      error = err;
      setServerError(err.message || 'Ocorreu um erro desconhecido.');
      onSaveComplete(err, undefined, mode);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <Styles.ModalOverlay onClick={onClose}>
      <Styles.ModalContainer onClick={(e) => e.stopPropagation()}>
        <Styles.ModalHeader>
          <Styles.ModalTitle>
            {mode === ModalMode.CREATE && 'Cadastrar Nova Turma'}
            {mode === ModalMode.EDIT && 'Editar Turma'}
            {mode === ModalMode.VIEW && 'Visualizar Turma'}
          </Styles.ModalTitle>
          <Styles.CloseButton onClick={onClose} aria-label="Fechar modal">&times;</Styles.CloseButton>
        </Styles.ModalHeader>
        <Styles.ModalBody>
          <Styles.Form onSubmit={handleSubmit(onSubmit)}>
            <Styles.FormRow>
              <Styles.FormGroup>
                <Styles.Label htmlFor="nome">Nome da Turma</Styles.Label>
                <Controller
                  name="nome"
                  control={control}
                  render={({ field }) => <Styles.Input {...field} id="nome" readOnly={isViewMode} />}
                />
                {errors.nome && <Styles.ErrorMsg>{errors.nome.message}</Styles.ErrorMsg>}
              </Styles.FormGroup>

              <Styles.FormGroup>
                <Styles.Label htmlFor="capacidade">Capacidade</Styles.Label>
                <Controller
                  name="capacidade"
                  control={control}
                  render={({ field }) => <Styles.Input {...field} id="capacidade" type="number" readOnly={isViewMode} />}
                />
                {errors.capacidade && <Styles.ErrorMsg>{errors.capacidade.message}</Styles.ErrorMsg>}
              </Styles.FormGroup>
            </Styles.FormRow>

            <Styles.FormGroup>
              <Styles.Label htmlFor="modalidade_id">Modalidade</Styles.Label>
              <Controller
                name="modalidade_id"
                control={control}
                render={({ field }) => (
                  <Styles.Select {...field} id="modalidade_id" disabled={isViewMode}>
                    <option value="">Selecione uma modalidade</option>
                    {modalidades.map((mod) => (
                      <option key={mod.id} value={mod.id}>{mod.nome}</option>
                    ))}
                  </Styles.Select>
                )}
              />
              {errors.modalidade_id && <Styles.ErrorMsg>{errors.modalidade_id.message}</Styles.ErrorMsg>}
            </Styles.FormGroup>

            <Styles.FormGroup>
              <Styles.Label htmlFor="horarios_descricao">Descrição dos Horários</Styles.Label>
              <Controller
                name="horarios_descricao"
                control={control}
                render={({ field }) => <Styles.Textarea {...field} id="horarios_descricao" rows={3} readOnly={isViewMode} />}
              />
              {errors.horarios_descricao && <Styles.ErrorMsg>{errors.horarios_descricao.message}</Styles.ErrorMsg>}
            </Styles.FormGroup>

            <Styles.FormGroup>
              <Styles.Label htmlFor="descricao">Descrição Adicional (Opcional)</Styles.Label>
              <Controller
                name="descricao"
                control={control}
                render={({ field }) => <Styles.Textarea {...field} id="descricao" rows={3} readOnly={isViewMode} />}
              />
              {errors.descricao && <Styles.ErrorMsg>{errors.descricao.message}</Styles.ErrorMsg>}
            </Styles.FormGroup>

            <Styles.FormGroup>
               <Styles.CheckboxContainer>
                <Controller
                    name="ativo"
                    control={control}
                    render={({ field: { onChange, value, ref } }) => (
                        <Styles.CheckboxInput
                        type="checkbox"
                        id="ativo"
                        ref={ref}
                        checked={value}
                        onChange={onChange}
                        disabled={isViewMode}
                        />
                    )}
                />
                <Styles.CheckboxLabel htmlFor="ativo">Ativo</Styles.CheckboxLabel>
              </Styles.CheckboxContainer>
              {errors.ativo && <Styles.ErrorMsg>{errors.ativo.message}</Styles.ErrorMsg>}
            </Styles.FormGroup>

            {serverError && <Styles.ErrorMsg>{serverError}</Styles.ErrorMsg>}

            {!isViewMode && (
              <Styles.SubmitButtonContainer>
                <Styles.SubmitButton type="submit" disabled={isSubmitting || (!isDirty && mode === ModalMode.EDIT)}>
                  {isSubmitting ? <Loader color={COLORS.white} size={20} /> : (mode === ModalMode.CREATE ? 'Cadastrar Turma' : 'Salvar Alterações')}
                </Styles.SubmitButton>
              </Styles.SubmitButtonContainer>
            )}
          </Styles.Form>
        </Styles.ModalBody>
      </Styles.ModalContainer>
    </Styles.ModalOverlay>
  );
};

export default TurmaModal;
