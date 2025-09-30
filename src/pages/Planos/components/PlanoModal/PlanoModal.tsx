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

  const defaultFormValues: PlanoFormData = useMemo(
    () => ({
      modalidadeNome: "",
      modalidadeMensal: 0,
      modalidadeAtiva: true,
      // Compatibility mapping
      nome: "",
      valor_mensal: 0,
      ativo: true,
      // Map from initialData
      ...(initialData ? {
        modalidadeNome: initialData.modalidadeNome || initialData.nome || "",
        modalidadeMensal: initialData.modalidadeMensal || initialData.valor || 0,
        modalidadeAtiva: initialData.modalidadeAtiva ?? initialData.ativo ?? true,
        nome: initialData.modalidadeNome || initialData.nome || "",
        valor_mensal: initialData.modalidadeMensal || initialData.valor || 0,
        ativo: initialData.modalidadeAtiva ?? initialData.ativo ?? true
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
          ? { 
              modalidadeNome: "", 
              modalidadeMensal: 0, 
              modalidadeAtiva: true,
              nome: "",
              valor_mensal: 0,
              ativo: true
            }
          : {
              ...defaultFormValues,
              ...(initialData ? {
                modalidadeNome: initialData.modalidadeNome || initialData.nome || "",
                modalidadeMensal: initialData.modalidadeMensal || initialData.valor || 0,
                modalidadeAtiva: initialData.modalidadeAtiva ?? initialData.ativo ?? true,
                nome: initialData.modalidadeNome || initialData.nome || "",
                valor_mensal: initialData.modalidadeMensal || initialData.valor || 0,
                ativo: initialData.modalidadeAtiva ?? initialData.ativo ?? true
              } : {}),
            };
      reset(dataToReset);
    }
  }, [initialData, mode, reset, defaultFormValues, open]);

  const watchedAtivo = watch("modalidadeAtiva") ?? watch("ativo");

  const onSubmit: SubmitHandler<PlanoFormData> = async (formData) => {
    if (isViewMode) return;
    setIsSubmitting(true);

    // Map form data to modalidades_old table structure
    const dataToSave = {
      modalidadeNome: formData.modalidadeNome || formData.nome,
      modalidadeMensal: formData.modalidadeMensal || formData.valor_mensal,
      modalidadeAtiva: formData.modalidadeAtiva ?? formData.ativo,
      modalidadeExcluida: false, // Always false for new/updated records
    };

    try {
      let savedResult: Plano | undefined;
      if (mode === ModalMode.CREATE) {
        const { data: newPlano, error } = await supabase
          .from("modalidades_old")
          .insert([dataToSave])
          .select()
          .single();
        if (error) throw error;
        
        // Map result back to Plano interface
        savedResult = {
          ...newPlano,
          id: newPlano.modalidadeID?.toString(),
          nome: newPlano.modalidadeNome,
          valor: newPlano.modalidadeMensal,
          ativo: newPlano.modalidadeAtiva
        } as Plano;
      } else if (mode === ModalMode.EDIT && planoIdToEdit) {
        const { data: updatedPlano, error } = await supabase
          .from("modalidades_old")
          .update(dataToSave)
          .eq("modalidadeID", parseInt(planoIdToEdit))
          .select()
          .single();
        if (error) throw error;
        
        // Map result back to Plano interface
        savedResult = {
          ...updatedPlano,
          id: updatedPlano.modalidadeID?.toString(),
          nome: updatedPlano.modalidadeNome,
          valor: updatedPlano.modalidadeMensal,
          ativo: updatedPlano.modalidadeAtiva
        } as Plano;
      }
      
      onSaveComplete?.(null, savedResult, mode);
      onClose();
    } catch (error: any) {
      console.error("Error saving modalidade:", error.message || error);
      // Map formData back to Plano interface for error callback
      const errorPlano = {
        modalidadeID: planoIdToEdit ? parseInt(planoIdToEdit) : 0,
        modalidadeNome: formData.modalidadeNome || formData.nome,
        modalidadeMensal: formData.modalidadeMensal || formData.valor_mensal,
        modalidadeAtiva: formData.modalidadeAtiva ?? formData.ativo,
        modalidadeExcluida: false,
        id: planoIdToEdit || "",
        nome: formData.modalidadeNome || formData.nome,
        valor: formData.modalidadeMensal || formData.valor_mensal,
        ativo: formData.modalidadeAtiva ?? formData.ativo
      } as Plano;
      onSaveComplete?.(error, errorPlano, mode);
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
              <Styles.Label htmlFor="modalidadeNome">Nome da Modalidade</Styles.Label>
              <Styles.Input
                id="modalidadeNome"
                {...register("modalidadeNome", { required: "Nome é obrigatório" })}
                disabled={isViewMode}
                autoFocus
              />
              {errors.modalidadeNome && (
                <Styles.ErrorMsg>{errors.modalidadeNome.message}</Styles.ErrorMsg>
              )}
            </Styles.FormGroup>

            <Styles.FormGroup style={{marginTop: '10px'}}>
              <Styles.Label htmlFor="modalidadeMensal">Valor Mensal (R$)</Styles.Label>
              <Styles.Input
                id="modalidadeMensal"
                type="number"
                step="0.01" // For currency
                {...register("modalidadeMensal", {
                  required: "Valor é obrigatório",
                  valueAsNumber: true,
                  min: { value: 0, message: "Valor não pode ser negativo" }
                })}
                disabled={isViewMode}
                placeholder="Ex: 99.90"
              />
              {errors.modalidadeMensal && (
                <Styles.ErrorMsg>{errors.modalidadeMensal.message}</Styles.ErrorMsg>
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
                id="modalidadeAtiva"
                {...register("modalidadeAtiva")}
                disabled={isViewMode}
                style={{ width: "auto", height: "16px", cursor: isViewMode ? 'not-allowed': 'pointer' }}
                checked={watchedAtivo}
                onChange={(e) => setValue("modalidadeAtiva", e.target.checked, { shouldValidate: true, shouldDirty: true })}
              />
              <Styles.Label
                htmlFor="modalidadeAtiva"
                style={{ marginBottom: 0, fontWeight: "normal", cursor: isViewMode ? 'not-allowed': 'pointer' }}
              >
                Ativa
              </Styles.Label>
            </Styles.FormGroup>
            {errors.modalidadeAtiva && ( // Though checkbox errors are less common without complex validation
              <Styles.ErrorMsg>{errors.modalidadeAtiva.message}</Styles.ErrorMsg>
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
