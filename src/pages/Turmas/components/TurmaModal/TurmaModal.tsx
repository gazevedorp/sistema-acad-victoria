import React, { useState, useMemo, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import * as Styles from "./TurmaModal.styles";
import {
  ModalMode,
  TurmaFormData,
} from "./TurmaModal.definitions";
import { Turma } from "../../../../types/TurmaTypes";
import { supabase } from "../../../../lib/supabase";

// TODO: Implement yup schema and resolver for validation if needed
// import { yupResolver } from "@hookform/resolvers/yup";
// import { turmaSchema } from "./TurmaModal.validation";

interface BaseModalProps {
  open: boolean;
  mode: ModalMode;
  onClose: () => void;
}

interface TurmaModalProps extends BaseModalProps {
  initialData?: Partial<Turma>;
  turmaIdToEdit?: string;
  onSaveComplete?: (
    error: any | null,
    savedData?: Turma,
    mode?: ModalMode
  ) => void;
}

const TurmaModal: React.FC<TurmaModalProps> = ({
  open,
  mode,
  onClose,
  initialData,
  turmaIdToEdit,
  onSaveComplete,
}) => {
  const isViewMode = mode === ModalMode.VIEW;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultFormValues: TurmaFormData = useMemo(
    () => ({
      nome: "",
      ativo: true,
      ...(initialData || {}), // Directly spread initialData as fields match TurmaFormData
    }),
    [initialData]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<TurmaFormData>({
    // resolver: yupResolver(turmaSchema), // Uncomment if using yup
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

  const watchedAtivo = watch("ativo");

  const onSubmit: SubmitHandler<TurmaFormData> = async (formData) => {
    if (isViewMode) return;
    setIsSubmitting(true);

    // Fields in TurmaFormData directly match Turma table structure (nome, ativo)
    const dataToSave = { ...formData };

    try {
      let savedResult: Turma | undefined;
      if (mode === ModalMode.CREATE) {
        const { data: newTurma, error } = await supabase
          .from("turmas") // Target 'turmas' table
          .insert([dataToSave])
          .select()
          .single();
        if (error) throw error;
        savedResult = newTurma as Turma;
      } else if (mode === ModalMode.EDIT && turmaIdToEdit) {
        const { data: updatedTurma, error } = await supabase
          .from("turmas") // Target 'turmas' table
          .update(dataToSave)
          .eq("id", turmaIdToEdit)
          .select()
          .single();
        if (error) throw error;
        savedResult = updatedTurma as Turma;
      }
      onSaveComplete?.(null, savedResult, mode);
      onClose();
    } catch (error: any) {
      console.error("Error saving turma:", error.message || error);
      onSaveComplete?.(error, { ...formData, id: turmaIdToEdit || "" } as Turma, mode);
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
            {mode === ModalMode.CREATE && "Nova Turma"}
            {mode === ModalMode.VIEW && "Detalhes da Turma"}
            {mode === ModalMode.EDIT && "Editar Turma"}
          </Styles.ModalTitle>
          <Styles.CloseButton onClick={onClose}>×</Styles.CloseButton>
        </Styles.ModalHeader>

        <Styles.ModalBody>
          <Styles.Form onSubmit={handleSubmit(onSubmit)}>
            <Styles.FormGroup>
              <Styles.Label htmlFor="nome">Nome da Turma</Styles.Label>
              <Styles.Input
                id="nome"
                {...register("nome", { required: "Nome é obrigatório" })}
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
                marginTop: "15px",
                marginBottom: "15px",
              }}
            >
              <input
                type="checkbox"
                id="ativo"
                {...register("ativo")}
                disabled={isViewMode}
                style={{ width: "auto", height: "16px", cursor: isViewMode ? 'not-allowed': 'pointer' }}
                checked={watchedAtivo}
                onChange={(e) => setValue("ativo", e.target.checked, { shouldValidate: true, shouldDirty: true })}
              />
              <Styles.Label
                htmlFor="ativo"
                style={{ marginBottom: 0, fontWeight: "normal", cursor: isViewMode ? 'not-allowed': 'pointer' }}
              >
                Ativa
              </Styles.Label>
            </Styles.FormGroup>
            {errors.ativo && (
              <Styles.ErrorMsg>{errors.ativo.message}</Styles.ErrorMsg>
            )}

            {!isViewMode && (
              <Styles.SubmitButtonContainer style={{ justifyContent: 'flex-end', marginTop: '20px' }}>
                <Styles.SubmitButton type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Salvando..."
                    : mode === ModalMode.EDIT
                    ? "Salvar Alterações"
                    : "Salvar Turma"}
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
