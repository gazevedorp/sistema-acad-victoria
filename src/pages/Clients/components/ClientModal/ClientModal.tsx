import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Styles from "./ClientModal.styles";
import Loader from "../../../../components/Loader/Loader";
import { MaskPattern } from "../../../../utils/formatter";
import {
  ModalMode,
  BaseModalProps,
  DadosCadastraisFormData,
  dadosCadastraisSchema,
  MaskPatternType,
  UFs,
} from "./ClientModal.definitions";
import { supabase } from "../../../../lib/supabase";
import MatriculaForm from "../MatriculaForm/MatriculaForm";

interface ClientModalProps extends BaseModalProps {
  initialData?: Partial<DadosCadastraisFormData>;
  alunoIdToEdit?: string;
  onSaveComplete?: ( // This is the main onSaveComplete from Clients.tsx
    error: any | null,
    savedData?: any, // Use 'any' to accommodate different save data types or make more generic
    mode?: ModalMode
  ) => void;
}

const ClientModal: React.FC<ClientModalProps> = ({
  open,
  mode,
  onClose,
  initialData,
  alunoIdToEdit,
  onSaveComplete, // Main onSaveComplete
}) => {
  const isViewMode = mode === ModalMode.VIEW;
  const isEditMode = mode === ModalMode.EDIT;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalType, setmodalType] = useState("dados_cadastrais");
  const [alunoNome, setAlunoNome] = useState<string>("");

  const defaultFormValues: DadosCadastraisFormData = useMemo(
    () => ({
      nome: "",
      cpf: "",
      rg: undefined,
      data_nascimento: "",
      telefone: "",
      email: undefined,
      cep: "",
      rua: "",
      numero: "",
      complemento: undefined,
      bairro: "",
      cidade: "",
      estado: "",
      possuiResponsavel: false,
      responsavelNome: undefined,
      responsavelCpf: undefined,
      responsavelTelefone: undefined,
      responsavelParentesco: undefined,
      ...(initialData || {}),
    }),
    [initialData]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<DadosCadastraisFormData>({
    //@ts-expect-error yupResolver type issue with this version or setup
    resolver: yupResolver(dadosCadastraisSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (open) {
      const dataToReset =
        mode === ModalMode.CREATE
          ? {
              nome: "",
              cpf: "",
              rg: undefined,
              data_nascimento: "",
              telefone: "",
              email: undefined,
              cep: "",
              rua: "",
              numero: "",
              complemento: undefined,
              bairro: "",
              cidade: "",
              estado: "",
              possuiResponsavel: false,
              responsavelNome: undefined,
              responsavelCpf: undefined,
              responsavelTelefone: undefined,
              responsavelParentesco: undefined,
            }
          : { ...defaultFormValues, ...initialData };
      reset(dataToReset as DadosCadastraisFormData);
    }
  }, [initialData, mode, reset, defaultFormValues, open]);

  useEffect(() => {
    if (open) {
      if (isEditMode && initialData?.nome) {
        setAlunoNome(initialData.nome);
      } else if (mode === ModalMode.CREATE) {
        setAlunoNome(""); // Reset alunoNome when modal opens in CREATE mode
      }
    }
  }, [isEditMode, initialData, mode, open]); // Dependencies for alunoNome logic

  const mask = useMemo(() => new MaskPattern(), []);

  const watchedCpf = watch("cpf");
  const watchedTelefone = watch("telefone");
  const watchedCep = watch("cep");
  const watchedPossuiResponsavel = watch("possuiResponsavel");
  const watchedResponsavelCpf = watch("responsavelCpf");
  const watchedResponsavelTelefone = watch("responsavelTelefone");

  const createMaskedInputHandler = useCallback(
    (
        fieldName: keyof DadosCadastraisFormData,
        maskType: MaskPatternType,
        maxLength?: number
      ) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, "");
        let maskedValue = mask.applyMask(rawValue, maskType);
        if (maxLength && maskedValue.length > maxLength) {
          maskedValue = maskedValue.substring(0, maxLength);
        }
        setValue(fieldName, maskedValue as any, {
          shouldValidate: true,
          shouldDirty: true,
        });
      },
    [mask, setValue]
  );

  const handleCpfChange = createMaskedInputHandler("cpf", "cpfCnpj", 14);
  const handleTelefoneChange = createMaskedInputHandler(
    "telefone",
    "phone",
    15
  );
  const handleCepChange = createMaskedInputHandler("cep", "cep", 9);
  const handleResponsavelCpfChange = createMaskedInputHandler(
    "responsavelCpf",
    "cpfCnpj",
    14
  );
  const handleResponsavelTelefoneChange = createMaskedInputHandler(
    "responsavelTelefone",
    "phone",
    15
  );

  const onSubmit: SubmitHandler<DadosCadastraisFormData> = async (data) => {
    if (isViewMode) return;

    setIsSubmitting(true);
    const cleanedDataSubmit: Partial<DadosCadastraisFormData> = {
      nome: data.nome,
      cpf: String(data.cpf).replace(/\D/g, ""),
      telefone: String(data.telefone).replace(/\D/g, ""),
      data_nascimento: data.data_nascimento,
      cep: String(data.cep).replace(/\D/g, ""),
      rua: data.rua,
      numero: data.numero,
      bairro: data.bairro,
      cidade: data.cidade,
      estado: data.estado,
    };

    if (data.rg) cleanedDataSubmit.rg = data.rg;
    if (data.email) cleanedDataSubmit.email = data.email;
    if (data.complemento) cleanedDataSubmit.complemento = data.complemento;

    cleanedDataSubmit.possuiResponsavel = data.possuiResponsavel;

    if (data.possuiResponsavel) {
      cleanedDataSubmit.responsavelNome = data.responsavelNome;
      if (data.responsavelCpf)
        cleanedDataSubmit.responsavelCpf = String(data.responsavelCpf).replace(
          /\D/g,
          ""
        );
      if (data.responsavelTelefone)
        cleanedDataSubmit.responsavelTelefone = String(
          data.responsavelTelefone
        ).replace(/\D/g, "");
      cleanedDataSubmit.responsavelParentesco = data.responsavelParentesco;
    } else {
      delete cleanedDataSubmit.responsavelNome;
      delete cleanedDataSubmit.responsavelCpf;
      delete cleanedDataSubmit.responsavelTelefone;
      delete cleanedDataSubmit.responsavelParentesco;
    }

    let resultData: DadosCadastraisFormData | undefined = undefined;

    try {
      if (mode === ModalMode.CREATE) {
        const { data: newAluno, error } = await supabase
          .from("alunos")
          .insert([cleanedDataSubmit as DadosCadastraisFormData])
          .select()
          .single();

        if (error) throw error;
        resultData = newAluno as DadosCadastraisFormData;
        if (resultData && resultData.nome) { // Set alunoNome after successful creation
          setAlunoNome(resultData.nome);
        }
      } else if (mode === ModalMode.EDIT && alunoIdToEdit) {
        const dataToUpdate = { ...cleanedDataSubmit };
        const { data: updatedAluno, error } = await supabase
          .from("alunos")
          .update(dataToUpdate)
          .eq("id", alunoIdToEdit)
          .select()
          .single();

        if (error) throw error;
        resultData = updatedAluno as DadosCadastraisFormData;
      }
      // For DadosCadastrais, call onSaveComplete with DadosCadastraisFormData
      if (onSaveComplete) {
        onSaveComplete(null, resultData, mode);
      }
      onClose(); // Close modal after successful save of DadosCadastrais
    } catch (error: any) {
      console.error("Erro Supabase:", error.message || error);
      if (onSaveComplete) {
        onSaveComplete(
          error,
          cleanedDataSubmit as DadosCadastraisFormData,
          mode
        );
      }
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
            {mode === ModalMode.CREATE && "Novo Aluno"}
            {mode === ModalMode.VIEW && "Detalhes do Aluno"}
            {mode === ModalMode.EDIT && "Editar Aluno"}
          </Styles.ModalTitle>
          <Styles.CloseButton onClick={onClose}>×</Styles.CloseButton>
        </Styles.ModalHeader>

        <Styles.ModalBody>
          {modalType === "dados_cadastrais" ? (
            <Styles.Form onSubmit={handleSubmit(onSubmit)}>
              <Styles.FormGroup>
                <Styles.Label htmlFor="nome">Nome Completo</Styles.Label>
                <Styles.Input
                  id="nome"
                  {...register("nome")}
                  disabled={isViewMode}
                />
                {errors.nome && (
                  <Styles.ErrorMsg>{errors.nome.message}</Styles.ErrorMsg>
                )}
              </Styles.FormGroup>

              <Styles.FormRow>
                <Styles.FormGroup>
                  <Styles.Label htmlFor="cpf">CPF</Styles.Label>
                  <Styles.Input
                    id="cpf"
                    value={watchedCpf || ""}
                    onChange={handleCpfChange}
                    maxLength={14}
                    placeholder="000.000.000-00"
                    disabled={isViewMode || (isEditMode && !!initialData?.cpf)}
                  />
                  {errors.cpf && (
                    <Styles.ErrorMsg>{errors.cpf.message}</Styles.ErrorMsg>
                  )}
                </Styles.FormGroup>
                <Styles.FormGroup>
                  <Styles.Label htmlFor="rg">RG</Styles.Label>
                  <Styles.Input
                    id="rg"
                    {...register("rg")}
                    disabled={isViewMode}
                  />
                  {errors.rg && (
                    <Styles.ErrorMsg>{errors.rg.message}</Styles.ErrorMsg>
                  )}
                </Styles.FormGroup>
              </Styles.FormRow>

              <Styles.FormRow>
                <Styles.FormGroup>
                  <Styles.Label htmlFor="data_nascimento">
                    Data de Nascimento
                  </Styles.Label>
                  <Styles.Input
                    id="data_nascimento"
                    type="date"
                    {...register("data_nascimento")}
                    disabled={isViewMode}
                  />
                  {errors.data_nascimento && (
                    <Styles.ErrorMsg>
                      {errors.data_nascimento.message}
                    </Styles.ErrorMsg>
                  )}
                </Styles.FormGroup>
                <Styles.FormGroup>
                  <Styles.Label htmlFor="telefone">Telefone</Styles.Label>
                  <Styles.Input
                    id="telefone"
                    value={watchedTelefone || ""}
                    onChange={handleTelefoneChange}
                    maxLength={15}
                    placeholder="(DDD) 9XXXX-XXXX"
                    disabled={isViewMode}
                  />
                  {errors.telefone && (
                    <Styles.ErrorMsg>{errors.telefone.message}</Styles.ErrorMsg>
                  )}
                </Styles.FormGroup>
              </Styles.FormRow>

              <Styles.FormGroup>
                <Styles.Label htmlFor="email">E-mail</Styles.Label>
                <Styles.Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="email@exemplo.com"
                  disabled={isViewMode}
                />
                {errors.email && (
                  <Styles.ErrorMsg>{errors.email.message}</Styles.ErrorMsg>
                )}
              </Styles.FormGroup>

              <hr
                style={{
                  margin: "20px 0 15px 0",
                  borderColor: Styles.COLORS.borderDefault,
                  borderWidth: "0.5px",
                }}
              />

              <Styles.FormRow>
                <Styles.FormGroup>
                  <Styles.Label htmlFor="cep">CEP</Styles.Label>
                  <Styles.Input
                    id="cep"
                    value={watchedCep || ""}
                    onChange={handleCepChange}
                    maxLength={9}
                    placeholder="00000-000"
                    disabled={isViewMode}
                  />
                  {errors.cep && (
                    <Styles.ErrorMsg>{errors.cep.message}</Styles.ErrorMsg>
                  )}
                </Styles.FormGroup>
                <Styles.FormGroup style={{ flexGrow: 2 }}>
                  <Styles.Label htmlFor="rua">Rua</Styles.Label>
                  <Styles.Input
                    id="rua"
                    {...register("rua")}
                    disabled={isViewMode}
                  />
                  {errors.rua && (
                    <Styles.ErrorMsg>{errors.rua.message}</Styles.ErrorMsg>
                  )}
                </Styles.FormGroup>
              </Styles.FormRow>

              <Styles.FormRow>
                <Styles.FormGroup>
                  <Styles.Label htmlFor="numero">Número</Styles.Label>
                  <Styles.Input
                    id="numero"
                    {...register("numero")}
                    disabled={isViewMode}
                  />
                  {errors.numero && (
                    <Styles.ErrorMsg>{errors.numero.message}</Styles.ErrorMsg>
                  )}
                </Styles.FormGroup>
                <Styles.FormGroup>
                  <Styles.Label htmlFor="complemento">Complemento</Styles.Label>
                  <Styles.Input
                    id="complemento"
                    {...register("complemento")}
                    disabled={isViewMode}
                  />
                  {errors.complemento && (
                    <Styles.ErrorMsg>
                      {errors.complemento.message}
                    </Styles.ErrorMsg>
                  )}
                </Styles.FormGroup>
                <Styles.FormGroup style={{ flexGrow: 2 }}>
                  <Styles.Label htmlFor="bairro">Bairro</Styles.Label>
                  <Styles.Input
                    id="bairro"
                    {...register("bairro")}
                    disabled={isViewMode}
                  />
                  {errors.bairro && (
                    <Styles.ErrorMsg>{errors.bairro.message}</Styles.ErrorMsg>
                  )}
                </Styles.FormGroup>
              </Styles.FormRow>

              <Styles.FormRow>
                <Styles.FormGroup style={{ flexGrow: 2 }}>
                  <Styles.Label htmlFor="cidade">Cidade</Styles.Label>
                  <Styles.Input
                    id="cidade"
                    {...register("cidade")}
                    disabled={isViewMode}
                  />
                  {errors.cidade && (
                    <Styles.ErrorMsg>{errors.cidade.message}</Styles.ErrorMsg>
                  )}
                </Styles.FormGroup>
                <Styles.FormGroup>
                  <Styles.Label htmlFor="estado">Estado (UF)</Styles.Label>
                  <Styles.Select
                    id="estado"
                    {...register("estado")}
                    disabled={isViewMode}
                  >
                    <option value="">UF</option>
                    {UFs.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </Styles.Select>
                  {errors.estado && (
                    <Styles.ErrorMsg>{errors.estado.message}</Styles.ErrorMsg>
                  )}
                </Styles.FormGroup>
              </Styles.FormRow>

              <hr
                style={{
                  margin: "20px 0 15px 0",
                  borderColor: Styles.COLORS.borderDefault,
                  borderWidth: "0.5px",
                }}
              />

              <Styles.FormGroup
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "15px",
                }}
              >
                <input
                  type="checkbox"
                  id="possuiResponsavel"
                  {...register("possuiResponsavel")}
                  disabled={isViewMode}
                  style={{ width: "auto" }}
                />
                <Styles.Label
                  htmlFor="possuiResponsavel"
                  style={{ marginBottom: 0, fontWeight: "normal" }}
                >
                  Possui responsável?
                </Styles.Label>
              </Styles.FormGroup>

              {watchedPossuiResponsavel && (
                <>
                  <Styles.FormGroup>
                    <Styles.Label htmlFor="responsavelNome">
                      Nome do Responsável
                    </Styles.Label>
                    <Styles.Input
                      id="responsavelNome"
                      {...register("responsavelNome")}
                      disabled={isViewMode}
                    />
                    {errors.responsavelNome && (
                      <Styles.ErrorMsg>
                        {errors.responsavelNome.message}
                      </Styles.ErrorMsg>
                    )}
                  </Styles.FormGroup>
                  <Styles.FormRow>
                    <Styles.FormGroup>
                      <Styles.Label htmlFor="responsavelCpf">
                        CPF do Responsável
                      </Styles.Label>
                      <Styles.Input
                        id="responsavelCpf"
                        value={watchedResponsavelCpf || ""}
                        onChange={handleResponsavelCpfChange}
                        maxLength={14}
                        placeholder="000.000.000-00"
                        disabled={isViewMode}
                      />
                      {errors.responsavelCpf && (
                        <Styles.ErrorMsg>
                          {errors.responsavelCpf.message}
                        </Styles.ErrorMsg>
                      )}
                    </Styles.FormGroup>
                    <Styles.FormGroup>
                      <Styles.Label htmlFor="responsavelTelefone">
                        Telefone do Responsável
                      </Styles.Label>
                      <Styles.Input
                        id="responsavelTelefone"
                        value={watchedResponsavelTelefone || ""}
                        onChange={handleResponsavelTelefoneChange}
                        maxLength={15}
                        placeholder="(DDD) 9XXXX-XXXX"
                        disabled={isViewMode}
                      />
                      {errors.responsavelTelefone && (
                        <Styles.ErrorMsg>
                          {errors.responsavelTelefone.message}
                        </Styles.ErrorMsg>
                      )}
                    </Styles.FormGroup>
                  </Styles.FormRow>
                  <Styles.FormGroup>
                    <Styles.Label htmlFor="responsavelParentesco">
                      Parentesco
                    </Styles.Label>
                    <Styles.Input
                      id="responsavelParentesco"
                      {...register("responsavelParentesco")}
                      disabled={isViewMode}
                    />
                    {errors.responsavelParentesco && (
                      <Styles.ErrorMsg>
                        {errors.responsavelParentesco.message}
                      </Styles.ErrorMsg>
                    )}
                  </Styles.FormGroup>
                </>
              )}

              {!isViewMode && (
                <Styles.SubmitButtonContainer>
                  <Styles.SubmitButton
                    disabled={mode !== ModalMode.EDIT} // Only enable Matricula if editing an existing client
                    onClick={() => setmodalType("matricula")}
                    type="button"
                    style={{
                      backgroundColor: Styles.COLORS.textMuted,
                    }}
                  >
                    Matricula
                  </Styles.SubmitButton>
                  <Styles.SubmitButton type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader />
                    ) : mode === ModalMode.EDIT ? (
                      "Salvar Alterações"
                    ) : (
                      "Salvar Dados Cadastrais"
                    )}
                  </Styles.SubmitButton>
                </Styles.SubmitButtonContainer>
              )}
            </Styles.Form>
          ) : (
            <MatriculaForm
              mode={mode}
              alunoId={alunoIdToEdit!}
              alunoName={alunoNome}
              onSaveComplete={onSaveComplete as any}
              onNavigateBack={() => setmodalType("dados_cadastrais")}
            />
          )}
        </Styles.ModalBody>
      </Styles.ModalContainer>
    </Styles.ModalOverlay>
  );
};

export default ClientModal;
