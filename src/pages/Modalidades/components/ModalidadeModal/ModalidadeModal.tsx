import React, { useState, useMemo, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import * as Styles from "./ModalidadeModal.styles";
import {
  ModalMode,
  ModalMode,
  ModalidadeFormData,
} from "./ModalidadeModal.definitions";
import { Modalidade } from "../../../../types/ModalidadeTypes";
import { supabase } from "../../../../lib/supabase"; // Import Supabase client

// TODO: Implement yup schema and resolver if needed
// import { yupResolver } from "@hookform/resolvers/yup";
// import { modalidadeSchema } from "./ModalidadeModal.validation"; // Assuming you'll create this

interface BaseModalProps {
  open: boolean;
  mode: ModalMode;
  onClose: () => void;
}

interface ModalidadeModalProps extends BaseModalProps {
  initialData?: Partial<Modalidade>; // Use Modalidade type here
  modalidadeIdToEdit?: string;
  onSaveComplete?: (
    error: any | null,
    savedData?: Modalidade, // Use Modalidade type here
    mode?: ModalMode
  ) => void;
}

const ModalidadeModal: React.FC<ModalidadeModalProps> = ({
  open,
  mode,
  onClose,
  initialData,
  modalidadeIdToEdit,
  onSaveComplete,
}) => {
  const isViewMode = mode === ModalMode.VIEW;
  // const isEditMode = mode === ModalMode.EDIT; // Keep if needed
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultFormValues: ModalidadeFormData = useMemo(
    () => ({
      nome: "",
      ativo: true,
      ...(initialData || {}),
    }),
    [initialData]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue, // Added setValue
    watch, // Added watch
  } = useForm<ModalidadeFormData>({
    // resolver: yupResolver(modalidadeSchema), // Uncomment if using yup
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (open) {
      const dataToReset =
        mode === ModalMode.CREATE
          ? { nome: "", ativo: true }
          : { ...defaultFormValues, ...initialData };
      reset(dataToReset);
    }
  }, [initialData, mode, reset, defaultFormValues, open]);

  const watchedAtivo = watch("ativo"); // Watch the 'ativo' field

  const onSubmit: SubmitHandler<ModalidadeFormData> = async (data) => {
    if (isViewMode) return;
    setIsSubmitting(true);

    try {
      let savedResult: Modalidade | undefined;
      if (mode === ModalMode.CREATE) {
        const { data: newModalidade, error } = await supabase
          .from('modalidades')
          .insert([data as ModalidadeFormData]) // Cast to ensure correct type
          .select()
          .single();
        if (error) throw error;
        savedResult = newModalidade as Modalidade;
      } else if (mode === ModalMode.EDIT && modalidadeIdToEdit) {
        const { data: updatedModalidade, error } = await supabase
          .from('modalidades')
          .update(data as ModalidadeFormData) // Cast to ensure correct type
          .eq('id', modalidadeIdToEdit)
          .select()
          .single();
        if (error) throw error;
        savedResult = updatedModalidade as Modalidade;
      }
      onSaveComplete?.(null, savedResult, mode);
      onClose();
    } catch (error: any) {
      console.error("Error saving modalidade:", error.message || error);
      // It's good practice to cast data to Modalidade for the error callback if possible,
      // or at least ensure it's ModalidadeFormData.
      onSaveComplete?.(error, data as ModalidadeFormData, mode);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Styles.ModalOverlay>
      <Styles.ModalContainer>
        <Styles.ModalHeader>
          <Styles.ModalTitle>
            {mode === ModalMode.CREATE && "Nova Modalidade"}
            {mode === ModalMode.VIEW && "Detalhes da Modalidade"}
            {mode === ModalMode.EDIT && "Editar Modalidade"}
          </Styles.ModalTitle>
          <Styles.CloseButton onClick={onClose}>×</Styles.CloseButton>
        </Styles.ModalHeader>

        <Styles.ModalBody>
          <Styles.Form onSubmit={handleSubmit(onSubmit)}>
            <Styles.FormGroup>
              <Styles.Label htmlFor="nome">Nome</Styles.Label>
              <Styles.Input
                id="nome"
                {...register("nome", { required: "Nome é obrigatório" })} // Basic validation
                disabled={isViewMode}
                autoFocus
              />
              {errors.nome && (
                <Styles.ErrorMsg>{errors.nome.message}</Styles.ErrorMsg>
              )}
            </Styles.FormGroup>

            <Styles.FormGroup
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: "8px",
                marginTop: "10px",
                marginBottom: "15px",
              }}
            >
              <input
                type="checkbox"
                id="ativo"
                {...register("ativo")}
                disabled={isViewMode}
                style={{ width: "auto", height: "16px", cursor: isViewMode ? 'not-allowed': 'pointer' }}
                checked={watchedAtivo} // Ensure checkbox reflects form state
                onChange={(e) => setValue("ativo", e.target.checked, { shouldValidate: true, shouldDirty: true })}
              />
              <Styles.Label
                htmlFor="ativo"
                style={{ marginBottom: 0, fontWeight: "normal", cursor: isViewMode ? 'not-allowed': 'pointer' }}
              >
                Ativo
              </Styles.Label>
            </Styles.FormGroup>
            {errors.ativo && (
              <Styles.ErrorMsg>{errors.ativo.message}</Styles.ErrorMsg>
            )}

            {!isViewMode && (
              <Styles.SubmitButtonContainer style={{ justifyContent: 'flex-end', marginTop: '20px' }}>
                <Styles.SubmitButton type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Salvando..." // Replace with Loader component if available
                    : mode === ModalMode.EDIT
                    ? "Salvar Alterações"
                    : "Salvar Modalidade"}
                </Styles.SubmitButton>
              </Styles.SubmitButtonContainer>
            )}
          </Styles.Form>
        </Styles.ModalBody>
      </Styles.ModalContainer>
    </Styles.ModalOverlay>
  );
};

export default ModalidadeModal;
