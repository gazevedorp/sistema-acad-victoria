import React, { useState, useMemo, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import * as Styles from "./PlanoModal.styles";
import {
  ModalMode,
  PlanoFormData,
} from "./PlanoModal.definitions";
import { Plano } from "../../../../types/PlanoTypes";
import { supabase } from "../../../../lib/supabase";

// TODO: Implement yup schema and resolver for validation if needed
// import { yupResolver } from "@hookform/resolvers/yup";
// import { planoSchema } from "./PlanoModal.validation";

interface BaseModalProps {
  open: boolean;
  mode: ModalMode;
  onClose: () => void;
}

interface PlanoModalProps extends BaseModalProps {
  initialData?: Partial<Plano>;
  planoIdToEdit?: string;
  onSaveComplete?: (
    error: any | null,
    savedData?: Plano,
    mode?: ModalMode
  ) => void;
}

const PlanoModal: React.FC<PlanoModalProps> = ({
  open,
  mode,
  onClose,
  initialData,
  planoIdToEdit,
  onSaveComplete,
}) => {
  const isViewMode = mode === ModalMode.VIEW;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalidades, setModalidades] = useState<{ id: string; nome: string }[]>([]);

  const defaultFormValues: PlanoFormData = useMemo(
    () => ({
      nome: "",
      valor_mensal: 0,
      ativo: true,
      modalidade_id: null, // Default to null or undefined
      // Map 'valor' from initialData to 'valor_mensal' for the form
      ...(initialData ? {
        ...initialData,
        valor_mensal: initialData.valor,
        modalidade_id: initialData.modalidade_id
      } : {}),
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
  } = useForm<PlanoFormData>({
    // resolver: yupResolver(planoSchema), // Uncomment if using yup
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (open) {
      const dataToReset =
        mode === ModalMode.CREATE
          ? { nome: "", valor_mensal: 0, ativo: true, modalidade_id: null }
          : {
              ...defaultFormValues,
              ...(initialData ? {
                ...initialData,
                valor_mensal: initialData.valor,
                modalidade_id: initialData.modalidade_id
              } : {}),
            };
      reset(dataToReset);

      if (mode !== ModalMode.VIEW) {
        fetchModalidades();
      }
    }
  }, [initialData, mode, reset, defaultFormValues, open]); // Removed fetchModalidades from here

  const fetchModalidades = async () => {
    try {
      const { data, error } = await supabase
        .from("modalidades")
        .select("id, nome")
        .eq("ativo", true); // Fetch only active modalities
      if (error) {
        console.error("Error fetching modalidades:", error);
        // Optionally, show a toast error
        setModalidades([]);
        return;
      }
      setModalidades(data || []);
    } catch (err) {
      console.error("Unexpected error fetching modalidades:", err);
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

  const onSubmit: SubmitHandler<PlanoFormData> = async (formData) => {
    if (isViewMode) return;
    setIsSubmitting(true);

    const dataToSave = {
      nome: formData.nome,
      valor: formData.valor_mensal,
      ativo: formData.ativo,
      modalidade_id: formData.modalidade_id || null, // Ensure null if undefined
    };

    try {
      let savedResult: Plano | undefined;
      if (mode === ModalMode.CREATE) {
        const { data: newPlano, error } = await supabase
          .from("planos")
          .insert([dataToSave])
          .select()
          .single();
        if (error) throw error;
        savedResult = newPlano as Plano;
      } else if (mode === ModalMode.EDIT && planoIdToEdit) {
        const { data: updatedPlano, error } = await supabase
          .from("planos")
          .update(dataToSave)
          .eq("id", planoIdToEdit)
          .select()
          .single();
        if (error) throw error;
        savedResult = updatedPlano as Plano;
      }
      // Pass the original formData (with valor_mensal) or mapped savedResult back
      onSaveComplete?.(null, savedResult, mode);
      onClose();
    } catch (error: any) {
      console.error("Error saving plano:", error.message || error);
      // Pass formData (which includes valor_mensal) to the callback on error
      onSaveComplete?.(error, { ...formData, id: planoIdToEdit || "" } as Plano, mode);
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
            {mode === ModalMode.CREATE && "Novo Plano"}
            {mode === ModalMode.VIEW && "Detalhes do Plano"}
            {mode === ModalMode.EDIT && "Editar Plano"}
          </Styles.ModalTitle>
          <Styles.CloseButton onClick={onClose}>×</Styles.CloseButton>
        </Styles.ModalHeader>

        <Styles.ModalBody>
          <Styles.Form onSubmit={handleSubmit(onSubmit)}>
            <Styles.FormGroup>
              <Styles.Label htmlFor="nome">Nome do Plano</Styles.Label>
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

            <Styles.FormGroup style={{marginTop: '10px'}}>
              <Styles.Label htmlFor="valor_mensal">Valor Mensal (R$)</Styles.Label>
              <Styles.Input
                id="valor_mensal"
                type="number"
                step="0.01" // For currency
                {...register("valor_mensal", {
                  required: "Valor é obrigatório",
                  valueAsNumber: true,
                  min: { value: 0, message: "Valor não pode ser negativo" }
                })}
                disabled={isViewMode}
                placeholder="Ex: 99.90"
              />
              {errors.valor_mensal && (
                <Styles.ErrorMsg>{errors.valor_mensal.message}</Styles.ErrorMsg>
              )}
            </Styles.FormGroup>

            <Styles.FormGroup style={{ marginTop: '10px' }}>
              <Styles.Label htmlFor="modalidade_id">Modalidade</Styles.Label>
              <Styles.Select
                id="modalidade_id"
                {...register("modalidade_id")}
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
                Ativo
              </Styles.Label>
            </Styles.FormGroup>
            {errors.ativo && ( // Though checkbox errors are less common without complex validation
              <Styles.ErrorMsg>{errors.ativo.message}</Styles.ErrorMsg>
            )}

            {!isViewMode && (
              <Styles.SubmitButtonContainer style={{ justifyContent: 'flex-end', marginTop: '20px' }}>
                <Styles.SubmitButton type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Salvando..." // Consider using a Loader component
                    : mode === ModalMode.EDIT
                    ? "Salvar Alterações"
                    : "Salvar Plano"}
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
