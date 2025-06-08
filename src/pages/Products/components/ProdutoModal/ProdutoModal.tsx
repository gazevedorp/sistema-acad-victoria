import React, { useState, useMemo, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import * as Styles from "./ProdutoModal.styles";
import {
  ModalMode,
  ProdutoFormData,
} from "./ProdutoModal.definitions";
import { Product } from "../../../../types/ProductType"; // Corrected import
import { supabase } from "../../../../lib/supabase";

// TODO: Implement yup schema and resolver for validation if needed
// import { yupResolver } from "@hookform/resolvers/yup";
// import { produtoSchema } from "./ProdutoModal.validation";

interface BaseModalProps {
  open: boolean;
  mode: ModalMode;
  onClose: () => void;
}

interface ProdutoModalProps extends BaseModalProps {
  initialData?: Partial<Product>;
  produtoIdToEdit?: string;
  onSaveComplete?: (
    error: any | null,
    savedData?: Product,
    mode?: ModalMode
  ) => void;
}

const ProdutoModal: React.FC<ProdutoModalProps> = ({
  open,
  mode,
  onClose,
  initialData,
  produtoIdToEdit,
  onSaveComplete,
}) => {
  const isViewMode = mode === ModalMode.VIEW;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultFormValues: ProdutoFormData = useMemo(
    () => ({
      nome: "",
      valor: 0, // 'valor' field directly used, no 'valor_mensal' mapping
      ativo: true,
      ...(initialData || {}), // Fields in Product and ProdutoFormData match (nome, valor, ativo)
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
  } = useForm<ProdutoFormData>({
    // resolver: yupResolver(produtoSchema), // Uncomment if using yup
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (open) {
      const dataToReset =
        mode === ModalMode.CREATE
          ? { nome: "", valor: 0, ativo: true }
          : { ...defaultFormValues, ...initialData };
      reset(dataToReset);
    }
  }, [initialData, mode, reset, defaultFormValues, open]);

  const watchedAtivo = watch("ativo");

  const onSubmit: SubmitHandler<ProdutoFormData> = async (formData) => {
    if (isViewMode) return;
    setIsSubmitting(true);

    // formData directly matches the 'produtos' table structure (nome, valor, ativo)
    const dataToSave = { ...formData };

    try {
      let savedResult: Product | undefined;
      if (mode === ModalMode.CREATE) {
        const { data: newProduto, error } = await supabase
          .from("produtos") // Target 'produtos' table
          .insert([dataToSave])
          .select()
          .single();
        if (error) throw error;
        savedResult = newProduto as Product;
      } else if (mode === ModalMode.EDIT && produtoIdToEdit) {
        const { data: updatedProduto, error } = await supabase
          .from("produtos") // Target 'produtos' table
          .update(dataToSave)
          .eq("id", produtoIdToEdit)
          .select()
          .single();
        if (error) throw error;
        savedResult = updatedProduto as Product;
      }
      onSaveComplete?.(null, savedResult, mode);
      onClose();
    } catch (error: any) {
      console.error("Error saving produto:", error.message || error);
      onSaveComplete?.(error, { ...formData, id: produtoIdToEdit || "" } as Product, mode);
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
            {mode === ModalMode.CREATE && "Novo Produto"}
            {mode === ModalMode.VIEW && "Detalhes do Produto"}
            {mode === ModalMode.EDIT && "Editar Produto"}
          </Styles.ModalTitle>
          <Styles.CloseButton onClick={onClose}>×</Styles.CloseButton>
        </Styles.ModalHeader>

        <Styles.ModalBody>
          <Styles.Form onSubmit={handleSubmit(onSubmit)}>
            <Styles.FormGroup>
              <Styles.Label htmlFor="nome">Nome do Produto</Styles.Label>
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
              <Styles.Label htmlFor="valor">Valor (R$)</Styles.Label>
              <Styles.Input
                id="valor" // Changed from valor_mensal
                type="number"
                step="0.01"
                {...register("valor", { // Changed from valor_mensal
                  required: "Valor é obrigatório",
                  valueAsNumber: true,
                  min: { value: 0, message: "Valor não pode ser negativo" }
                })}
                disabled={isViewMode}
                placeholder="Ex: 29.99"
              />
              {errors.valor && ( // Changed from valor_mensal
                <Styles.ErrorMsg>{errors.valor.message}</Styles.ErrorMsg>
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
            {errors.ativo &&
              <Styles.ErrorMsg>{errors.ativo.message}</Styles.ErrorMsg>
            }

            {!isViewMode && (
              <Styles.SubmitButtonContainer style={{ justifyContent: 'flex-end', marginTop: '20px' }}>
                <Styles.SubmitButton type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Salvando..."
                    : mode === ModalMode.EDIT
                    ? "Salvar Alterações"
                    : "Salvar Produto"}
                </Styles.SubmitButton>
              </Styles.SubmitButtonContainer>
            )}
          </Styles.Form>
        </Styles.ModalBody>
      </Styles.ModalContainer>
    </Styles.ModalOverlay>
  );
};

export default ProdutoModal;
