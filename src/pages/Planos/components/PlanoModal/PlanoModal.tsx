import React, { useState, useEffect, useMemo } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { supabase } from '../../../../lib/supabase';
import { PlanoFormData } from '../../../../types/PlanoTypes';
import { ModalidadeBasicInfo } from '../../../../types/TurmaTypes'; // Assuming path
import { BasePlanoModalProps, ModalMode, planoSchema, defaultPlanoFormValues } from './PlanoModal.definitions';
import * as Styles from './PlanoModal.styles';
import Loader from '../../../../components/Loader/Loader'; // Assuming Loader path

const PlanoModal: React.FC<BasePlanoModalProps> = ({
  open,
  mode,
  onClose,
  initialData,
  planoIdToEdit,
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
  } = useForm<PlanoFormData>({
    resolver: yupResolver(planoSchema),
    defaultValues: defaultPlanoFormValues,
  });

  useEffect(() => {
    if (open) {
      setServerError(null);
      if (mode === ModalMode.CREATE) {
        reset(defaultPlanoFormValues);
      } else if (initialData) {
        // Ensure all form fields are reset with initialData or defaults
        const dataToReset: PlanoFormData = {
            nome: initialData.nome || defaultPlanoFormValues.nome,
            modalidade_id: initialData.modalidade_id || defaultPlanoFormValues.modalidade_id,
            valor_mensal: initialData.valor_mensal !== undefined ? initialData.valor_mensal : defaultPlanoFormValues.valor_mensal,
            desconto_em_combinacao: initialData.desconto_em_combinacao !== undefined ? initialData.desconto_em_combinacao : defaultPlanoFormValues.desconto_em_combinacao,
            ativo: initialData.ativo !== undefined ? initialData.ativo : defaultPlanoFormValues.ativo,
        };
        reset(dataToReset);
      }
    }
  }, [open, mode, initialData, reset]);

  const onSubmit: SubmitHandler<PlanoFormData> = async (formData) => {
    setIsSubmitting(true);
    setServerError(null);
    let error = null;
    let savedData: PlanoFormData | undefined = undefined;

    // Ensure numeric fields are correctly typed
    const dataToSave: PlanoFormData = {
      ...formData,
      valor_mensal: Number(formData.valor_mensal),
      desconto_em_combinacao: Number(formData.desconto_em_combinacao),
    };

    try {
      if (mode === ModalMode.CREATE) {
        const { data: newPlano, error: insertError } = await supabase
          .from('planos')
          .insert([dataToSave])
          .select()
          .single();
        if (insertError) throw insertError;
        savedData = newPlano as PlanoFormData;
      } else if (mode === ModalMode.EDIT && planoIdToEdit) {
        const { data: updatedPlano, error: updateError } = await supabase
          .from('planos')
          .update(dataToSave)
          .eq('id', planoIdToEdit)
          .select()
          .single();
        if (updateError) throw updateError;
        savedData = updatedPlano as PlanoFormData;
      }
      onSaveComplete(null, savedData, mode);
      onClose();
    } catch (err: any) {
      console.error(`Error ${mode === ModalMode.CREATE ? 'creating' : 'updating'} plano:`, err);
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
            {mode === ModalMode.CREATE && 'Cadastrar Novo Plano'}
            {mode === ModalMode.EDIT && 'Editar Plano'}
            {mode === ModalMode.VIEW && 'Visualizar Plano'}
          </Styles.ModalTitle>
          <Styles.CloseButton onClick={onClose} aria-label="Fechar modal">&times;</Styles.CloseButton>
        </Styles.ModalHeader>
        <Styles.ModalBody>
          <Styles.Form onSubmit={handleSubmit(onSubmit)}>
            <Styles.FormRow>
              <Styles.FormGroup style={{ flexGrow: 2 }}> {/* Nome takes more space */}
                <Styles.Label htmlFor="nome">Nome do Plano</Styles.Label>
                <Controller
                  name="nome"
                  control={control}
                  render={({ field }) => <Styles.Input {...field} id="nome" readOnly={isViewMode} />}
                />
                {errors.nome && <Styles.ErrorMsg>{errors.nome.message}</Styles.ErrorMsg>}
              </Styles.FormGroup>
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
            </Styles.FormRow>

            <Styles.FormRow>
              <Styles.FormGroup>
                <Styles.Label htmlFor="valor_mensal">Valor Mensal (R$)</Styles.Label>
                <Controller
                  name="valor_mensal"
                  control={control}
                  render={({ field }) => <Styles.Input {...field} id="valor_mensal" type="number" step="0.01" readOnly={isViewMode} />}
                />
                {errors.valor_mensal && <Styles.ErrorMsg>{errors.valor_mensal.message}</Styles.ErrorMsg>}
              </Styles.FormGroup>

              <Styles.FormGroup>
                <Styles.Label htmlFor="desconto_em_combinacao">Desconto em Combinação (%)</Styles.Label>
                <Controller
                  name="desconto_em_combinacao"
                  control={control}
                  render={({ field }) => <Styles.Input {...field} id="desconto_em_combinacao" type="number" min="0" max="100" readOnly={isViewMode} />}
                />
                {errors.desconto_em_combinacao && <Styles.ErrorMsg>{errors.desconto_em_combinacao.message}</Styles.ErrorMsg>}
              </Styles.FormGroup>
            </Styles.FormRow>

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
                        checked={!!value} // Ensure value is boolean
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
                <Styles.SubmitButton type="submit" disabled={isSubmitting || (!isDirty && mode === ModalMode.EDIT))}>
                  {isSubmitting ? <Loader color={Styles.COLORS.white} size={20} /> : (mode === ModalMode.CREATE ? 'Cadastrar Plano' : 'Salvar Alterações')}
                </Styles.SubmitButton>
              </Styles.SubmitButtonContainer>
            )}
          </Styles.Form>
        </Styles.ModalBody>
      </Styles.ModalContainer>
    </Styles.ModalOverlay>
  );
};

export default PlanoModal;
