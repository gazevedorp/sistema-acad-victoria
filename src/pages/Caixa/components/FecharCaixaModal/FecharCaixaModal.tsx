import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Styles from './FecharCaixaModal.styles';
import { FecharCaixaFormData, fecharCaixaSchema } from './FecharCaixaModal.definitions';
import Loader from '../../../../components/Loader/Loader'; // Ajuste o caminho

interface FecharCaixaModalProps {
  open: boolean;
  onClose: () => void;
  onConfirmFechar: (formData: FecharCaixaFormData) => Promise<void>;
  caixaId?: string; // Para exibir no modal, se desejado
}

const FecharCaixaModal: React.FC<FecharCaixaModalProps> = ({ 
    open, 
    onClose, 
    onConfirmFechar
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FecharCaixaFormData>({
    resolver: yupResolver(fecharCaixaSchema) as any,
    defaultValues: {
      observacoes_fechamento: '',
    }
  });

  useEffect(() => {
    if (open) {
      reset({ observacoes_fechamento: '' });
    }
  }, [open, reset]);

  const onSubmit: SubmitHandler<FecharCaixaFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      await onConfirmFechar(data);
    } catch (error) {
      console.error("Erro ao submeter fechamento de caixa", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Styles.ModalOverlay>
      <Styles.ModalContainer>
        <Styles.ModalHeader>
          <Styles.ModalTitle>Confirmar Fechamento do Caixa</Styles.ModalTitle>
          <Styles.CloseButton onClick={onClose} disabled={isSubmitting}>×</Styles.CloseButton>
        </Styles.ModalHeader>
        <Styles.ModalBody>
          <Styles.Form onSubmit={handleSubmit(onSubmit)}>
            <Styles.ConfirmationText>
              Tem certeza que deseja fechar o caixa atual? 
              {/* {caixaId && ` (ID: ${caixaId.substring(0,6)}...)`} */}
              <br />
              Esta ação não poderá ser desfeita e um relatório PDF será gerado.
            </Styles.ConfirmationText>
            <Styles.FormGroup>
              <Styles.Label htmlFor="observacoes_fechamento">Observações de Fechamento (Opcional)</Styles.Label>
              <Styles.Textarea
                id="observacoes_fechamento"
                {...register("observacoes_fechamento")}
                rows={4}
              />
              {errors.observacoes_fechamento && <Styles.ErrorMsg>{errors.observacoes_fechamento.message}</Styles.ErrorMsg>}
            </Styles.FormGroup>
            <Styles.ButtonContainer>
              <Styles.SecondaryButton type="button" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Styles.SecondaryButton>
              <Styles.PrimaryButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader /> : "Confirmar e Fechar Caixa"}
              </Styles.PrimaryButton>
            </Styles.ButtonContainer>
          </Styles.Form>
        </Styles.ModalBody>
      </Styles.ModalContainer>
    </Styles.ModalOverlay>
  );
};

export default FecharCaixaModal;