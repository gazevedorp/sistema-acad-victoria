import React, { useMemo, useState } from "react";
import Switch from "react-switch";
import { useForm, SubmitHandler, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { FaWhatsapp, FaPhone } from "react-icons/fa";
import * as Styles from "./ClientModal.styles";
import { Client } from "../../../../types/ClientTypes";
import { MaskPattern } from "../../../../utils/formatter";
import Loader from "../../../../components/Loader/Loader";

// eslint-disable-next-line react-refresh/only-export-components
export enum ModalMode {
  CREATE = "create",
  VIEW = "view",
  EDIT = "edit",
}

interface ClientModalProps {
  open: boolean;
  mode: ModalMode;
  client: Omit<Client, "id"> | Client | null;
  onClose: () => void;
  onSave: (data: Omit<Client, "id">) => void;
}

// Validação: birthday deve estar no formato dd/mm/yyyy
const schema = yup.object().shape({
  nome: yup
    .string()
    .required("Nome é obrigatório")
    .min(3, "Mínimo de 3 caracteres"),
  email: yup.string().email("E-mail inválido"),
  data_nascimento: yup.string(),
  telefone: yup
    .string()
    .required("Telefone é obrigatório")
    .matches(/^\d+$/, "Telefone deve conter apenas números") // Apenas números
    .matches(/^\d{10,11}$/, "Telefone deve ter DDD"), // Validação do DDD e comprimento
  ativo: yup.boolean().required(),
});

type FormInputs = {
  nome: string;
  email: string;
  data_nascimento: string;
  telefone: string;
  ativo: boolean;
};

const ClientModal: React.FC<ClientModalProps> = ({
  open,
  mode,
  client,
  onClose,
  onSave,
}) => {
  const isViewMode = mode === ModalMode.VIEW;
  const isEditMode = mode === ModalMode.EDIT;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm<FormInputs>({
    //@ts-expect-error tupe later
    resolver: yupResolver(schema),
  });

  const mask = useMemo(() => new MaskPattern(), []);
  const activeValue = useWatch({ control, name: "ativo" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (client) {
      setValue("nome", client.nome || "");
      setValue("email", client.email || "");

      if (client.data_nascimento) {
        const bdStr = convertDateToDDMMYYYY(client.data_nascimento);
        setValue("data_nascimento", bdStr);
      } else {
        setValue("data_nascimento", "");
      }

      setValue("telefone", client.telefone || "");
      setValue("ativo", client.ativo ?? false);
    } else {
      setValue("nome", "");
      setValue("email", "");
      setValue("data_nascimento", "");
      setValue("telefone", "");
      setValue("ativo", true);
    }
  }, [client, setValue]);

  // FUNÇÃO QUE MASCARA O INPUT DA DATA
  const handleBirthdayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ""); // remove tudo que não for dígito

    // Limitamos a 8 dígitos (ddmmYYYY)
    if (val.length > 8) {
      val = val.slice(0, 8);
    }

    // Se tiver >= 5 dígitos, formatamos dd/mm/yyyy
    if (val.length >= 5) {
      val = val.replace(/^(\d{2})(\d{2})(\d{1,4})/, "$1/$2/$3");
    } else if (val.length >= 3) {
      // Se entre 3 e 4 dígitos, formatamos dd/mm
      val = val.replace(/^(\d{2})(\d{1,2})/, "$1/$2");
    }

    // Atualiza o RHF
    setValue("data_nascimento", val, { shouldValidate: true });
  };

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    try {
      setIsSubmitting(true);
      onSave(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Converte 'client.birthday' (string 'yyyy-mm-dd' ou Date) para dd/mm/yyyy
  const convertDateToDDMMYYYY = (value: string | Date): string => {
    if (value instanceof Date) {
      const day = String(value.getDate()).padStart(2, "0");
      const month = String(value.getMonth() + 1).padStart(2, "0");
      const year = value.getFullYear();
      return `${day}/${month}/${year}`;
    }
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      const [year, month, day] = value.split("-");
      return `${day}/${month}/${year}`;
    }
    return value; // Se já estiver no formato dd/mm/yyyy ou outro
  };

  if (!open) return null;

  const handleWhatsApp = (phone: string) => {
    const numericPhone = phone.replace(/\D/g, "");
    window.open(`https://wa.me/55${numericPhone}`, "_blank");
  };

  const handleCall = (phone: string) => {
    const numericPhone = phone.replace(/\D/g, "");
    window.open(`tel:+55${numericPhone}`, "_self");
  };

  // Valor atual do campo "birthday" vindo do watch, para exibir no input
  const birthdayValue = watch("data_nascimento");

  return (
    <Styles.ModalOverlay>
      <Styles.ModalContainer>
        <Styles.ModalHeader>
          <Styles.ModalTitle>
            {mode === ModalMode.CREATE && "Cadastrar Aluno"}
            {mode === ModalMode.VIEW && "Detalhes do Aluno"}
            {mode === ModalMode.EDIT && "Editar Aluno"}
          </Styles.ModalTitle>
          <Styles.CloseButton onClick={onClose}>×</Styles.CloseButton>
        </Styles.ModalHeader>

        <Styles.ModalBody>
          {/*@ts-expect-error improve later */}
          <Styles.Form onSubmit={handleSubmit(onSubmit)}>
            <Styles.FormGroup>
              <Styles.Label>
                Nome{" "}
                {!isViewMode && (
                  <Styles.LabelRequired>(Obrigatório)</Styles.LabelRequired>
                )}
              </Styles.Label>
              {isViewMode ? (
                <Styles.DisplayField>{client?.nome}</Styles.DisplayField>
              ) : (
                <>
                  <Styles.Input
                    type="text"
                    disabled={isViewMode}
                    // Mantemos register para ter a validação do RHF,
                    // mas podemos passar {...register("name")} sem onChange custom.
                    {...register("nome")}
                  />
                  {errors.nome && (
                    <Styles.ErrorMsg>{errors.nome.message}</Styles.ErrorMsg>
                  )}
                </>
              )}
            </Styles.FormGroup>

            <Styles.FormGroup>
              <Styles.Label>E-mail</Styles.Label>
              {isViewMode ? (
                <Styles.DisplayField>{client?.email}</Styles.DisplayField>
              ) : (
                <>
                  <Styles.Input
                    type="email"
                    disabled={isViewMode}
                    {...register("email")}
                  />
                  {errors.email && (
                    <Styles.ErrorMsg>{errors.email.message}</Styles.ErrorMsg>
                  )}
                </>
              )}
            </Styles.FormGroup>

            <Styles.FormGroup>
              <Styles.Label>Data de Nascimento</Styles.Label>
              {isViewMode ? (
                <Styles.DisplayField>
                  {client?.data_nascimento
                    ? mask.applyMask(client.data_nascimento, "date")
                    : "-"}
                </Styles.DisplayField>
              ) : (
                <>
                  <Styles.Input
                    type="text"
                    placeholder="dd/mm/yyyy"
                    disabled={isViewMode}
                    // Em vez de {...register("birthday")} com onChange,
                    // Usamos watch + handleBirthdayChange
                    value={birthdayValue ?? ""}
                    onChange={handleBirthdayChange}
                  />
                  {errors.data_nascimento && (
                    <Styles.ErrorMsg>
                      {errors.data_nascimento.message}
                    </Styles.ErrorMsg>
                  )}
                </>
              )}
            </Styles.FormGroup>

            <Styles.FormGroup>
              <Styles.Label>
                Telefone{" "}
                {!isViewMode && (
                  <Styles.LabelRequired>(Obrigatório)</Styles.LabelRequired>
                )}
              </Styles.Label>
              {isViewMode ? (
                <Styles.DisplayField>
                  {client?.telefone
                    ? mask.applyMask(client.telefone, "phone")
                    : ""}
                </Styles.DisplayField>
              ) : (
                <>
                  <Styles.Input
                    type="text"
                    disabled={isViewMode}
                    {...register("telefone")}
                  />
                  {errors.telefone && (
                    <Styles.ErrorMsg>{errors.telefone.message}</Styles.ErrorMsg>
                  )}
                </>
              )}
            </Styles.FormGroup>

            <Styles.FormGroup>
              <Styles.Label>
                Status{" "}
                {!isViewMode && (
                  <Styles.LabelRequired>(Obrigatório)</Styles.LabelRequired>
                )}
              </Styles.Label>
              {isViewMode ? (
                <Styles.DisplayField>
                  {client?.ativo ? "Ativo" : "Inativo"}
                </Styles.DisplayField>
              ) : (
                <Switch
                  checked={activeValue}
                  onChange={(checked) => setValue("ativo", checked)}
                  onColor="#0D88CB"
                  offColor="#ccc"
                  checkedIcon={false}
                  uncheckedIcon={false}
                />
              )}
            </Styles.FormGroup>

            {!isViewMode && (
              <Styles.SubmitButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader />
                ) : isEditMode ? (
                  "Salvar"
                ) : (
                  "Cadastrar"
                )}
              </Styles.SubmitButton>
            )}
          </Styles.Form>

          {isViewMode && (
            <Styles.FooterButtonsContainer>
              <Styles.WhatsAppButton
                onClick={() => handleWhatsApp(client?.telefone || "")}
                title="Abrir WhatsApp"
              >
                <FaWhatsapp />
              </Styles.WhatsAppButton>
              <Styles.CallButton
                onClick={() => handleCall(client?.telefone || "")}
                title="Ligar agora"
              >
                <FaPhone />
              </Styles.CallButton>
            </Styles.FooterButtonsContainer>
          )}
        </Styles.ModalBody>
      </Styles.ModalContainer>
    </Styles.ModalOverlay>
  );
};

export default ClientModal;
