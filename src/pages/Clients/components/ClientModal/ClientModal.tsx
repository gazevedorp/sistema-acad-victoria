import React, { useMemo, useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { FaWhatsapp, FaPhone } from "react-icons/fa";
import * as Styles from "./ClientModal.styles";
// Removido import de ClientTypes - tipo será definido aqui
import { MaskPattern } from "../../../../utils/formatter"; // Assumindo que você tem ou criará máscara de CPF aqui
import Loader from "../../../../components/Loader/Loader";

// --- Definição do Tipo Client (direto no arquivo) ---
interface Client {
  id?: string; // Presente na edição/visualização
  cpf: string; // Campo renomeado e obrigatório
  rg?: string; // Opcional
  endereco: string; // Obrigatório
  nome: string; // Obrigatório
  telefone: string; // Obrigatório
  email?: string; // Opcional
  // Campos de timestamp podem existir no objeto completo, mas não no form
  created_at?: string | Date;
  updated_at?: string | Date;
}
// -----------------------------------------------------

// eslint-disable-next-line react-refresh/only-export-components
export enum ModalMode {
  CREATE = "create",
  VIEW = "view",
  EDIT = "edit",
}

interface ClientModalProps {
  open: boolean;
  mode: ModalMode;
  client: Omit<Client, "id" | "created_at" | "updated_at"> | Client | null; // Ajustado para refletir Client local
  onClose: () => void;
  onSave: (data: Omit<Client, "id" | "created_at" | "updated_at">) => void; // Ajustado
}

// --- Função de Validação de CPF (Exemplo Básico) ---
// Fonte: Implementações comuns encontradas online (verificar adequação para seu caso)
function isValidCPF(cpf: string | null | undefined): boolean {
  if (!cpf) return false;
  cpf = cpf.replace(/[^\d]+/g, ''); // Remove caracteres não numéricos
  if (cpf.length !== 11) return false;
  // Elimina CPFs invalidos conhecidos
  if (/^(\d)\1+$/.test(cpf)) return false;

  let add = 0;
  for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
  let rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9))) return false;

  add = 0;
  for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
  rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(10))) return false;

  return true;
}
// -----------------------------------------------------


// --- Schema de Validação Atualizado ---
const schema = yup.object().shape({
  cpf: yup
    .string()
    .required("CPF é obrigatório")
    .transform(value => value.replace(/[^\d]/g, '')) // Remove máscara antes de validar
    .test('cpf-valido', 'CPF inválido', value => isValidCPF(value)), // Usa a função de validação
  rg: yup.string(), // Opcional
  endereco: yup
    .string()
    .required("Endereço é obrigatório")
    .min(5, "Endereço muito curto"),
  nome: yup
    .string()
    .required("Nome é obrigatório")
    .min(3, "Mínimo de 3 caracteres"),
  telefone: yup
    .string()
    .required("Telefone é obrigatório")
    .transform(value => value.replace(/[^\d]/g, '')) // Remove máscara antes de validar
    .matches(/^\d{10,11}$/, "Telefone inválido (DDD + 8 ou 9 dígitos)"),
  email: yup.string().email("E-mail inválido"), // Opcional mas valida formato
});
// -----------------------------------------


// --- Tipo para Inputs do Formulário ---
type FormInputs = {
  cpf: string;
  rg?: string;
  endereco: string;
  nome: string;
  telefone: string;
  email?: string;
};
// -------------------------------------

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
    formState: { errors },
    reset,
    watch // Adicionar watch para máscara de CPF e Telefone
  } = useForm<FormInputs>({
    resolver: yupResolver(schema),
    defaultValues: {
      cpf: '',
      rg: '',
      endereco: '',
      nome: '',
      telefone: '',
      email: '',
    }
  });

  const mask = useMemo(() => new MaskPattern(), []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Observar valores para aplicar máscara dinamicamente
  const watchedCpf = watch("cpf");
  const watchedTelefone = watch("telefone");

  // Efeito para popular/resetar form
  useEffect(() => {
    if (open) {
      if (client && (mode === ModalMode.EDIT || mode === ModalMode.VIEW)) {
        setValue("cpf", client.cpf || "");
        setValue("rg", client.rg || "");
        setValue("endereco", client.endereco || "");
        setValue("nome", client.nome || "");
        setValue("telefone", client.telefone || "");
        setValue("email", client.email || "");
      } else {
        reset(); // Limpa para os defaultValues
      }
    }
  }, [client, mode, setValue, reset, open]);

  // Handler para aplicar máscara de Telefone ao digitar
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, ''); // Só dígitos
    const maskedValue = mask.applyMask(rawValue, 'phone'); // Usa sua função de máscara
    setValue("telefone", maskedValue, { shouldValidate: true });
  };

  // Submit handler
  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    setIsSubmitting(true);
    // Limpar máscaras antes de salvar
    const cleanData = {
      ...data,
      cpf: data.cpf.replace(/\D/g, ''),
      telefone: data.telefone.replace(/\D/g, ''),
      rg: data.rg ? data.rg.replace(/\D/g, '') : undefined, // Limpa RG se existir
    };
    try {
      onSave(cleanData);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Funções handleWhatsApp e handleCall (sem mudanças, mas adicionando checagem de null/undefined)
  const handleWhatsApp = (phone: string | undefined) => {
    if (!phone) return;
    const numericPhone = phone.replace(/\D/g, "");
    if (numericPhone.length >= 10) {
      window.open(`https://wa.me/55${numericPhone}`, "_blank");
    } else {
      alert("Número de telefone inválido para WhatsApp.");
    }
  };

  const handleCall = (phone: string | undefined) => {
    if (!phone) return;
    const numericPhone = phone.replace(/\D/g, "");
    if (numericPhone.length >= 10) {
      window.open(`tel:+55${numericPhone}`, "_self");
    } else {
      alert("Número de telefone inválido para ligação.");
    }
  };


  if (!open) return null;

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
          <Styles.Form onSubmit={handleSubmit(onSubmit)}>
            {/* CPF (Obrigatório) */}
            <Styles.FormGroup>
              <Styles.Label>
                CPF{" "}
                {!isViewMode && (
                  <Styles.LabelRequired>(Obrigatório)</Styles.LabelRequired>
                )}
              </Styles.Label>
              {isViewMode ? (
                // Aplicar máscara na visualização
                <Styles.DisplayField>{client?.cpf ? mask.applyMask(client.cpf, "cpfCnpj") : '-'}</Styles.DisplayField>
              ) : (
                <>
                  <Styles.Input
                    type="text" {...register("cpf")}
                  />
                  {errors.cpf && (
                    <Styles.ErrorMsg>{errors.cpf.message}</Styles.ErrorMsg>
                  )}
                </>
              )}
            </Styles.FormGroup>

            {/* RG (Opcional) */}
            <Styles.FormGroup>
              <Styles.Label>RG</Styles.Label>
              {isViewMode ? (
                <Styles.DisplayField>{client?.rg || "-"}</Styles.DisplayField>
              ) : (
                <>
                  <Styles.Input type="text" {...register("rg")} />
                  {errors.rg && (
                    <Styles.ErrorMsg>{errors.rg.message}</Styles.ErrorMsg>
                  )}
                </>
              )}
            </Styles.FormGroup>

            {/* Endereço (Obrigatório) */}
            <Styles.FormGroup>
              <Styles.Label>
                Endereço{" "}
                {!isViewMode && (
                  <Styles.LabelRequired>(Obrigatório)</Styles.LabelRequired>
                )}
              </Styles.Label>
              {isViewMode ? (
                <Styles.DisplayField>{client?.endereco || "-"}</Styles.DisplayField>
              ) : (
                <>
                  <Styles.Input type="text" {...register("endereco")} />
                  {errors.endereco && (
                    <Styles.ErrorMsg>{errors.endereco.message}</Styles.ErrorMsg>
                  )}
                </>
              )}
            </Styles.FormGroup>

            {/* Nome (Obrigatório) */}
            <Styles.FormGroup>
              <Styles.Label>
                Nome{" "}
                {!isViewMode && (
                  <Styles.LabelRequired>(Obrigatório)</Styles.LabelRequired>
                )}
              </Styles.Label>
              {isViewMode ? (
                <Styles.DisplayField>{client?.nome || "-"}</Styles.DisplayField>
              ) : (
                <>
                  <Styles.Input type="text" {...register("nome")} />
                  {errors.nome && (
                    <Styles.ErrorMsg>{errors.nome.message}</Styles.ErrorMsg>
                  )}
                </>
              )}
            </Styles.FormGroup>

            {/* Telefone (Obrigatório) */}
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
                    : "-"}
                </Styles.DisplayField>
              ) : (
                <>
                  <Styles.Input
                    type="text"
                    placeholder="(DDD) 9XXXX-XXXX"
                    // Usar value e onChange para controle da máscara
                    value={watchedTelefone || ''}
                    onChange={handleTelefoneChange}
                    maxLength={15} // Limitar tamanho visual com máscara (ex: (DD) 9XXXX-XXXX)
                  />
                  {errors.telefone && (
                    <Styles.ErrorMsg>{errors.telefone.message}</Styles.ErrorMsg>
                  )}
                </>
              )}
            </Styles.FormGroup>

            {/* Email (Opcional) */}
            <Styles.FormGroup>
              <Styles.Label>E-mail</Styles.Label>
              {isViewMode ? (
                <Styles.DisplayField>{client?.email || "-"}</Styles.DisplayField>
              ) : (
                <>
                  <Styles.Input type="email" {...register("email")} />
                  {errors.email && (
                    <Styles.ErrorMsg>{errors.email.message}</Styles.ErrorMsg>
                  )}
                </>
              )}
            </Styles.FormGroup>

            {/* Botão de Submit */}
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

          {/* Botões de Ação (View Mode) */}
          {isViewMode && client && (
            <Styles.FooterButtonsContainer>
              <Styles.WhatsAppButton
                onClick={() => handleWhatsApp(client?.telefone)}
                title="Abrir WhatsApp"
                disabled={!client?.telefone}
              >
                <FaWhatsapp />
              </Styles.WhatsAppButton>
              <Styles.CallButton
                onClick={() => handleCall(client?.telefone)}
                title="Ligar agora"
                disabled={!client?.telefone}
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