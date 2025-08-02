// src/pages/FormasPagamento/components/FormaPagamentoModal/FormaPagamentoModal.tsx
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { FiX } from "react-icons/fi";
import * as Styles from "./FormaPagamentoModal.styles";
import Loader from "../../../../components/Loader/Loader";
import {
  ModalMode,
  BaseModalProps,
  FormaPagamentoModalFormData,
  formaPagamentoModalSchema,
} from "./FormaPagamentoModal.definitions";

interface FormaPagamentoModalProps extends BaseModalProps {
  initialData?: Partial<FormaPagamentoModalFormData>;
  onSave?: (data: FormaPagamentoModalFormData) => Promise<void>;
  isSubmitting?: boolean;
}

const FormaPagamentoModal: React.FC<FormaPagamentoModalProps> = ({
  open,
  mode,
  onClose,
  initialData,
  onSave,
  isSubmitting = false,
}) => {
  const isViewMode = mode === ModalMode.VIEW;
  const isCreateMode = mode === ModalMode.CREATE;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(formaPagamentoModalSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      ativo_venda: true,
      ativo_mensalidade: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        setValue("nome", initialData.nome || "");
        setValue("descricao", initialData.descricao || "");
        setValue("ativo_venda", initialData.ativo_venda ?? true);
        setValue("ativo_mensalidade", initialData.ativo_mensalidade ?? true);
      } else {
        reset({
          nome: "",
          descricao: "",
          ativo_venda: true,
          ativo_mensalidade: true,
        });
      }
    }
  }, [open, initialData, setValue, reset]);

  const onSubmit = async (data: FormaPagamentoModalFormData) => {
    if (onSave && !isViewMode) {
      await onSave(data);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case ModalMode.CREATE:
        return "Nova Forma de Pagamento";
      case ModalMode.EDIT:
        return "Editar Forma de Pagamento";
      case ModalMode.VIEW:
        return "Visualizar Forma de Pagamento";
      default:
        return "Forma de Pagamento";
    }
  };

  if (!open) return null;

  return (
    <Styles.ModalOverlay onClick={handleOverlayClick}>
      <Styles.ModalContent>
        <Styles.ModalHeader>
          <Styles.ModalTitle>{getModalTitle()}</Styles.ModalTitle>
          <Styles.CloseButton onClick={onClose} type="button">
            <FiX />
          </Styles.CloseButton>
        </Styles.ModalHeader>

        <Styles.Form onSubmit={handleSubmit(onSubmit)}>
          <Styles.FormGroup>
            <Styles.Label htmlFor="nome">Nome *</Styles.Label>
            <Styles.Input
              id="nome"
              type="text"
              placeholder="Ex: Cartão de Crédito, PIX, Dinheiro..."
              disabled={isViewMode || isSubmitting}
              {...register("nome")}
            />
            {errors.nome && (
              <Styles.ErrorMessage>{errors.nome.message}</Styles.ErrorMessage>
            )}
          </Styles.FormGroup>

          <Styles.FormGroup>
            <Styles.Label htmlFor="descricao">Descrição</Styles.Label>
            <Styles.TextArea
              id="descricao"
              placeholder="Descrição opcional da forma de pagamento..."
              disabled={isViewMode || isSubmitting}
              {...register("descricao")}
            />
            {errors.descricao && (
              <Styles.ErrorMessage>{errors.descricao.message}</Styles.ErrorMessage>
            )}
          </Styles.FormGroup>

          <Styles.FormGroup>
            <Styles.CheckboxContainer>
              <Styles.Checkbox
                id="ativo_venda"
                type="checkbox"
                disabled={isViewMode || isSubmitting}
                {...register("ativo_venda")}
              />
              <Styles.CheckboxLabel htmlFor="ativo_venda">
                Ativa para vendas de produtos
              </Styles.CheckboxLabel>
            </Styles.CheckboxContainer>
            {errors.ativo_venda && (
              <Styles.ErrorMessage>{errors.ativo_venda.message}</Styles.ErrorMessage>
            )}
          </Styles.FormGroup>

          <Styles.FormGroup>
            <Styles.CheckboxContainer>
              <Styles.Checkbox
                id="ativo_mensalidade"
                type="checkbox"
                disabled={isViewMode || isSubmitting}
                {...register("ativo_mensalidade")}
              />
              <Styles.CheckboxLabel htmlFor="ativo_mensalidade">
                Ativa para pagamento de mensalidades
              </Styles.CheckboxLabel>
            </Styles.CheckboxContainer>
            {errors.ativo_mensalidade && (
              <Styles.ErrorMessage>{errors.ativo_mensalidade.message}</Styles.ErrorMessage>
            )}
          </Styles.FormGroup>

          <Styles.ButtonGroup>
            <Styles.Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {isViewMode ? "Fechar" : "Cancelar"}
            </Styles.Button>
            {!isViewMode && (
              <Styles.Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader color="#fff" />
                ) : (
                  isCreateMode ? "Criar" : "Salvar"
                )}
              </Styles.Button>
            )}
          </Styles.ButtonGroup>
        </Styles.Form>
      </Styles.ModalContent>
    </Styles.ModalOverlay>
  );
};

export default FormaPagamentoModal;
