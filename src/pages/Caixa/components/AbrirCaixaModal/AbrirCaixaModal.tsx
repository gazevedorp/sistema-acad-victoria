import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Styles from "./AbrirCaixaModal.styles";
import {
  AbrirCaixaFormData,
  abrirCaixaSchema,
} from "./AbrirCaixaModal.definitions";
import Loader from "../../../../components/Loader/Loader"; // Ajuste o caminho

interface AbrirCaixaModalProps {
  open: boolean;
  onClose: () => void;
  onAbrirCaixa: (formData: AbrirCaixaFormData) => Promise<void>;
  userName: string;
}

const AbrirCaixaModal: React.FC<AbrirCaixaModalProps> = ({
  open,
  onClose,
  onAbrirCaixa,
  userName,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(abrirCaixaSchema),
    defaultValues: {
      valor_inicial: 0.0,
      observacoes_abertura: null,
    },
  });

  useEffect(() => {
    if (open) {
      reset({ valor_inicial: 0.0, observacoes_abertura: null });
    }
  }, [open, reset]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await onAbrirCaixa(data as AbrirCaixaFormData);
      // O onClose pode ser chamado pelo componente pai após o sucesso de onAbrirCaixa
    } catch (error) {
      console.error("Erro ao submeter abertura de caixa", error);
      // Toast de erro já deve ser tratado na função onAbrirCaixa no pai
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
            Abrir Novo Caixa para {userName}
          </Styles.ModalTitle>
          <Styles.CloseButton onClick={onClose}>×</Styles.CloseButton>
        </Styles.ModalHeader>
        <Styles.ModalBody>
          <Styles.Form onSubmit={handleSubmit(onSubmit)}>
            <Styles.FormGroup>
              <Styles.Label htmlFor="valor_inicial">
                Valor Inicial (R$)
              </Styles.Label>
              <Styles.Input
                type="number"
                id="valor_inicial"
                step="0.01"
                min="0"
                {...register("valor_inicial")}
                placeholder="0.00"
              />
              {errors.valor_inicial && (
                <Styles.ErrorMsg>{errors.valor_inicial.message}</Styles.ErrorMsg>
              )}
            </Styles.FormGroup>
            <Styles.FormGroup>
              <Styles.Label htmlFor="observacoes_abertura">
                Observações (Opcional)
              </Styles.Label>
              <Styles.Textarea
                id="observacoes_abertura"
                {...register("observacoes_abertura")}
                rows={3}
              />
              {errors.observacoes_abertura && (
                <Styles.ErrorMsg>
                  {errors.observacoes_abertura.message}
                </Styles.ErrorMsg>
              )}
            </Styles.FormGroup>
            <Styles.ButtonContainer>
              <Styles.SecondaryButton
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Styles.SecondaryButton>
              <Styles.PrimaryButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader /> : "Abrir Caixa"}
              </Styles.PrimaryButton>
            </Styles.ButtonContainer>
          </Styles.Form>
        </Styles.ModalBody>
      </Styles.ModalContainer>
    </Styles.ModalOverlay>
  );
};

export default AbrirCaixaModal;
