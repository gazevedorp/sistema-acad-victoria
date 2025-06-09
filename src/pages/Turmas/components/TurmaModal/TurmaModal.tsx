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
  const [modalidades, setModalidades] = useState<{ id: string; nome: string }[]>([]);

  const defaultFormValues: TurmaFormData = useMemo(
    () => ({
      nome: "",
      ativo: true,
      modalidade_id: null, // Default to null or undefined
      ...(initialData || {}),
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
          ? { nome: "", ativo: true, modalidade_id: null }
          : { ...defaultFormValues, ...initialData };
      reset(dataToReset);

      if (mode !== ModalMode.VIEW) {
        fetchModalidades();
      }
    }
  }, [initialData, mode, reset, defaultFormValues, open]);

  const fetchModalidades = async () => {
    try {
      const { data, error } = await supabase
        .from("modalidades")
        .select("id, nome")
        .eq("ativo", true); // Fetch only active modalities
      if (error) {
        console.error("Error fetching modalities:", error);
        setModalidades([]);
        return;
      }
      setModalidades(data || []);
    } catch (err) {
      console.error("Unexpected error fetching modalities:", err);
      setModalidades([]);
    }
  };

  // useEffect to call fetchModalidades when the modal opens and is not in VIEW mode
  useEffect(() => {
    if (open && mode !== ModalMode.VIEW) {
      fetchModalidades();
    }
  }, [open, mode]);

  const watchedAtivo = watch("ativo");

  const onSubmit: SubmitHandler<TurmaFormData> = async (formData) => {
    if (isViewMode) return;
    setIsSubmitting(true);

    const dataToSave = {
      nome: formData.nome,
      ativo: formData.ativo,
      modalidade_id: formData.modalidade_id || null, // Ensure null if undefined
    };

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

            <Styles.FormGroup style={{ marginTop: '10px' }}>
              <Styles.Label htmlFor="modalidade_id">Modalidade</Styles.Label>
              <Styles.Select
                id="modalidade_id"
                {...register("modalidade_id")} // Register with react-hook-form
                disabled={isViewMode}
              >
                <option value="">Selecione uma modalidade</option>
                {modalidades.map((modalidade) => (
                  <option key={modalidade.id} value={modalidade.id}>
                    {modalidade.nome}
                  </option>
                ))}
              </Styles.Select>
              {errors.modalidade_id && (
                <Styles.ErrorMsg>{errors.modalidade_id.message}</Styles.ErrorMsg>
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
