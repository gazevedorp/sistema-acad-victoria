import React, { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
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
  } = useForm<AbrirCaixaFormData>({
    resolver: yupResolver(abrirCaixaSchema),
    defaultValues: {
      valorInicial: 0.0,
      observacoesAbertura: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({ valorInicial: 0.0, observacoesAbertura: "" });
    }
  }, [open, reset]);

  const onSubmit: SubmitHandler<AbrirCaixaFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      await onAbrirCaixa(data);
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
              <Styles.Label htmlFor="valorInicial">
                Valor Inicial (R$)
              </Styles.Label>
              <Styles.Input
                type="number"
                id="valorInicial"
                step="0.01"
                min="0"
                {...register("valorInicial")}
                placeholder="0.00"
              />
              {errors.valorInicial && (
                <Styles.ErrorMsg>{errors.valorInicial.message}</Styles.ErrorMsg>
              )}
            </Styles.FormGroup>
            <Styles.FormGroup>
              <Styles.Label htmlFor="observacoesAbertura">
                Observações (Opcional)
              </Styles.Label>
              <Styles.Textarea
                id="observacoesAbertura"
                {...register("observacoesAbertura")}
                rows={3}
              />
              {errors.observacoesAbertura && (
                <Styles.ErrorMsg>
                  {errors.observacoesAbertura.message}
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
                {isSubmitting ? <Loader size={20} /> : "Abrir Caixa"}
              </Styles.PrimaryButton>
            </Styles.ButtonContainer>
          </Styles.Form>
        </Styles.ModalBody>
      </Styles.ModalContainer>
    </Styles.ModalOverlay>
  );
};

export default AbrirCaixaModal;
