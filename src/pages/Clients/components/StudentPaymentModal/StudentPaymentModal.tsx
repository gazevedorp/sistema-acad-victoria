// src/pages/Clients/components/StudentPaymentModal/StudentPaymentModal.tsx
import React, { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Styles from "./StudentPaymentModal.styles";
import Loader from "../../../../components/Loader/Loader";
import {
  StudentPaymentModalFormData,
  studentPaymentModalSchema,
  FormaPagamentoParaSelect,
} from "./StudentPaymentModal.definitions";

interface StudentPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: StudentPaymentModalFormData, studentId: string) => Promise<void>;
  student: { id: string; nome: string } | null;
  formasPagamentoList: FormaPagamentoParaSelect[];
  isSubmittingExt: boolean; // External submitting state
}

const StudentPaymentModal: React.FC<StudentPaymentModalProps> = ({
  open,
  onClose,
  onSave,
  student,
  formasPagamentoList,
  isSubmittingExt,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<StudentPaymentModalFormData>({
    resolver: yupResolver(studentPaymentModalSchema),
    defaultValues: {
      valor: undefined,
      forma_pagamento: "",
      descricao: undefined, // Changed from "" to undefined
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        valor: undefined,
        forma_pagamento: "",
        descricao: undefined, // Changed from "" to undefined
      });
    }
  }, [open, reset]);

  const onSubmit: SubmitHandler<StudentPaymentModalFormData> = async (data) => {
    if (!student) return;
    await onSave(data, student.id);
    // onClose will be called by parent component after save completes
  };

  if (!open || !student) return null;

  return (
    <Styles.ModalOverlay>
      <Styles.ModalContainer>
        <Styles.ModalHeader>
          <Styles.ModalTitle>Registrar Pagamento para: {student.nome}</Styles.ModalTitle>
          <Styles.CloseButton onClick={onClose}>×</Styles.CloseButton>
        </Styles.ModalHeader>
        <Styles.ModalBody>
          <Styles.Form onSubmit={handleSubmit(onSubmit)}>
            <Styles.FormGroup>
              <Styles.Label htmlFor="valor">Valor (R$)</Styles.Label>
              <Styles.Input type="number" step="0.01" {...register("valor")} id="valor" />
              {errors.valor && <Styles.ErrorMsg>{errors.valor.message}</Styles.ErrorMsg>}
            </Styles.FormGroup>

            <Styles.FormGroup>
              <Styles.Label htmlFor="forma_pagamento">Forma de Pagamento</Styles.Label>
              <Styles.Select {...register("forma_pagamento")} id="forma_pagamento">
                <option value="">Selecione a Forma</option>
                {formasPagamentoList.map((forma) => (
                  <option key={forma.id} value={forma.id}>
                    {forma.nome}
                  </option>
                ))}
              </Styles.Select>
              {errors.forma_pagamento && <Styles.ErrorMsg>{errors.forma_pagamento.message}</Styles.ErrorMsg>}
            </Styles.FormGroup>

            <Styles.FormGroup>
              <Styles.Label htmlFor="descricao">Descrição (Opcional)</Styles.Label>
              <Styles.Textarea {...register("descricao")} id="descricao" rows={3} />
              {errors.descricao && <Styles.ErrorMsg>{errors.descricao.message}</Styles.ErrorMsg>}
            </Styles.FormGroup>

            <Styles.SubmitButtonContainer>
              <Styles.SubmitButton type="submit" disabled={isSubmittingExt}>
                {isSubmittingExt ? <Loader /> : "Registrar Pagamento"}
              </Styles.SubmitButton>
            </Styles.SubmitButtonContainer>
          </Styles.Form>
        </Styles.ModalBody>
      </Styles.ModalContainer>
    </Styles.ModalOverlay>
  );
};

export default StudentPaymentModal;
