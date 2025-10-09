import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Styles from "./ClientModal.styles";
import Loader from "../../../../components/Loader/Loader";
import { MaskPattern, convertDateForInput } from "../../../../utils/formatter";
import {
  ModalMode,
  BaseModalProps,
  DadosCadastraisFormData,
  dadosCadastraisSchema,
  MaskPatternType,
} from "./ClientModal.definitions";
import { supabase } from "../../../../lib/supabase";
import MatriculaForm from "../MatriculaForm/MatriculaForm";
import FrequenciaForm from "../FrequenciaForm/FrequenciaForm";
import PagamentosForm from "../PagamentosForm/PagamentosForm";

interface ClientModalProps extends BaseModalProps {
  initialData?: Partial<DadosCadastraisFormData>;
  alunoIdToEdit?: string;
  onSaveComplete?: (
    error: any | null,
    savedData?: any,
    mode?: ModalMode
  ) => void;
}

const ClientModal: React.FC<ClientModalProps> = ({
  open,
  mode,
  onClose,
  initialData,
  alunoIdToEdit,
  onSaveComplete,
}) => {
  const isViewMode = mode === ModalMode.VIEW;
  const isEditMode = mode === ModalMode.EDIT;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alunoNome, setAlunoNome] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'dados' | 'matricula' | 'frequencia' | 'pagamentos'>('dados');

  const defaultFormValues: DadosCadastraisFormData = useMemo(
    () => ({
      nome: "",
      cpf: "",
      rg: undefined,
      data_nascimento: "",
      sexo: "",
      telefone: "",
      email: undefined,
      cep: "",
      rua: "",
      bairro: "",
      cidade: "",
      estado: "",
      possuiResponsavel: false,
      responsavelNome: undefined,
      responsavelCpf: undefined,
      responsavelTelefone: undefined,
      observacoes: undefined,
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
  } = useForm({
    //@ts-expect-error yupResolver type issue with this version or setup
    resolver: yupResolver(dadosCadastraisSchema),
    defaultValues: defaultFormValues,
  }) as any;

  useEffect(() => {
    if (open) {
      const dataToReset =
        mode === ModalMode.CREATE
          ? {
              nome: "",
              cpf: "",
              rg: undefined,
              data_nascimento: "",
              sexo: "",
              telefone: "",
              email: undefined,
              cep: "",
              rua: "",
              bairro: "",
              cidade: "",
              estado: "",
              possuiResponsavel: false,
              responsavelNome: undefined,
              responsavelCpf: undefined,
              responsavelTelefone: undefined,
              observacoes: undefined,
            }
          : {
              ...defaultFormValues,
              ...initialData,
              data_nascimento: initialData?.data_nascimento ? convertDateForInput(initialData.data_nascimento) : ""
            };
      reset(dataToReset as DadosCadastraisFormData);
    }
  }, [initialData, mode, reset, defaultFormValues, open]);

  useEffect(() => {
    if (open) {
      if (isEditMode && initialData?.nome) {
        setAlunoNome(initialData.nome);
      } else if (mode === ModalMode.CREATE) {
        setAlunoNome("");
      }
    }
  }, [isEditMode, initialData, mode, open]);

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
  const handleTelefoneChange = createMaskedInputHandler("telefone", "phone", 15);
  const handleResponsavelCpfChange = createMaskedInputHandler("responsavelCpf", "cpfCnpj", 14);
  const handleResponsavelTelefoneChange = createMaskedInputHandler("responsavelTelefone", "phone", 15);

  const handleCepChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\D/g, "");
      let maskedValue = mask.applyMask(rawValue, "cep");
      if (maskedValue.length > 9) {
        maskedValue = maskedValue.substring(0, 9);
      }
      setValue("cep", maskedValue as any, {
        shouldValidate: true,
        shouldDirty: true,
      });

      // Buscar CEP na API ViaCEP quando tiver 8 dígitos
      if (rawValue.length === 8) {
        try {
          const response = await fetch(`https://viacep.com.br/ws/${rawValue}/json/`);
          const data = await response.json();

          if (!data.erro) {
            // Preencher automaticamente os campos de endereço
            if (data.logradouro) setValue("rua", data.logradouro, { shouldValidate: true });
            if (data.bairro) setValue("bairro", data.bairro, { shouldValidate: true });
            if (data.localidade) setValue("cidade", data.localidade, { shouldValidate: true });
            if (data.uf) setValue("estado", data.uf.toUpperCase(), { shouldValidate: true });
          }
        } catch (error) {
          console.error("Erro ao buscar CEP:", error);
        }
      }
    },
    [mask, setValue]
  );

  const onSubmit: SubmitHandler<DadosCadastraisFormData> = async (data) => {
    if (isViewMode) return;

    setIsSubmitting(true);
    const cleanedDataSubmit: any = {
      alunoNome: data.nome,
      alunoCPF: data.cpf ? String(data.cpf).replace(/\D/g, "") : null,
      alunoIdentidade: data.rg || null,
      alunoCelular: data.telefone ? String(data.telefone).replace(/\D/g, "") : null,
      alunoEmail: data.email || null,
      alunoSexo: data.sexo === "F" ? 1 : data.sexo === "M" ? 0 : null,
      alunoDataNascimento: data.data_nascimento || null,
      alunoCEP: data.cep ? String(data.cep).replace(/\D/g, "") : null,
      alunoEndereco: data.rua || null,
      alunoBairro: data.bairro || null,
      alunoCidade: data.cidade || null,
      alunoEstado: data.estado || null,
    };

    if (data.possuiResponsavel) {
      cleanedDataSubmit.alunoResponsavel = data.responsavelNome || null;
      cleanedDataSubmit.alunoResponsavelCPF = data.responsavelCpf ? String(data.responsavelCpf).replace(/\D/g, "") : null;
      cleanedDataSubmit.alunoTelefoneResponsavel = data.responsavelTelefone ? String(data.responsavelTelefone).replace(/\D/g, "") : null;
    } else {
      cleanedDataSubmit.alunoResponsavel = null;
      cleanedDataSubmit.alunoResponsavelCPF = null;
      cleanedDataSubmit.alunoTelefoneResponsavel = null;
    }

    cleanedDataSubmit.alunoObs = data.observacoes || null;

    try {
      // Verificar duplicatas de CPF ou RG antes de salvar
      if (cleanedDataSubmit.alunoCPF || cleanedDataSubmit.alunoIdentidade) {
        let duplicateQuery = supabase
          .from("alunos_old")
          .select("alunoID, alunoNome, alunoCPF, alunoIdentidade");

        // Construir a query de duplicatas
        const orConditions: string[] = [];
        if (cleanedDataSubmit.alunoCPF) {
          orConditions.push(`alunoCPF.eq.${cleanedDataSubmit.alunoCPF}`);
        }
        if (cleanedDataSubmit.alunoIdentidade) {
          orConditions.push(`alunoIdentidade.eq.${cleanedDataSubmit.alunoIdentidade}`);
        }

        if (orConditions.length > 0) {
          duplicateQuery = duplicateQuery.or(orConditions.join(','));
        }

        // Se estiver editando, excluir o próprio aluno da verificação
        if (mode === ModalMode.EDIT && alunoIdToEdit) {
          duplicateQuery = duplicateQuery.neq("alunoID", alunoIdToEdit);
        }

        const { data: duplicates, error: duplicateError } = await duplicateQuery;

        if (duplicateError) {
          console.error("Erro ao verificar duplicatas:", duplicateError);
          onSaveComplete?.(new Error("Erro ao verificar duplicatas"), null, mode);
          setIsSubmitting(false);
          return;
        }

        if (duplicates && duplicates.length > 0) {
          const duplicate = duplicates[0];
          let errorMsg = `Já existe um aluno cadastrado com `;

          if (cleanedDataSubmit.alunoCPF && duplicate.alunoCPF === cleanedDataSubmit.alunoCPF) {
            errorMsg += `o CPF ${data.cpf}`;
          } else if (cleanedDataSubmit.alunoIdentidade && duplicate.alunoIdentidade === cleanedDataSubmit.alunoIdentidade) {
            errorMsg += `o RG ${cleanedDataSubmit.alunoIdentidade}`;
          }

          errorMsg += `: ${duplicate.alunoNome}`;

          onSaveComplete?.(new Error(errorMsg), null, mode);
          setIsSubmitting(false);
          return;
        }
      }

      let result;
      if (mode === ModalMode.CREATE) {
        result = await supabase
          .from("alunos_old")
          .insert([cleanedDataSubmit])
          .select();
      } else if (mode === ModalMode.EDIT) {
        result = await supabase
          .from("alunos_old")
          .update(cleanedDataSubmit)
          .eq("alunoID", alunoIdToEdit)
          .select();
      }

      if (result?.error) {
        console.error("Erro ao salvar:", result.error.message);
        onSaveComplete?.(result.error, null, mode);
      } else if (result?.data) {
        console.log("Salvo com sucesso:", result.data);
        onSaveComplete?.(null, result.data[0], mode);
      } else {
        console.error("Resultado inesperado:", result);
        onSaveComplete?.(new Error("Resultado inesperado"), null, mode);
      }
    } catch (error) {
      console.error("Erro interno:", error);
      onSaveComplete?.(error, null, mode);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormFields = () => (
    <>
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

      <Styles.FormRow3>
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
        <Styles.FormGroup>
          <Styles.Label htmlFor="data_nascimento">Data de Nascimento</Styles.Label>
          <Styles.Input
            id="data_nascimento"
            type="date"
            {...register("data_nascimento")}
            disabled={isViewMode}
          />
          {errors.data_nascimento && (
            <Styles.ErrorMsg>{errors.data_nascimento.message}</Styles.ErrorMsg>
          )}
        </Styles.FormGroup>
      </Styles.FormRow3>

      <Styles.FormRow3>
        <Styles.FormGroup>
          <Styles.Label htmlFor="sexo">Sexo</Styles.Label>
          <Styles.Select
            id="sexo"
            {...register("sexo")}
            disabled={isViewMode}
          >
            <option value="">Selecione...</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </Styles.Select>
          {errors.sexo && (
            <Styles.ErrorMsg>{errors.sexo.message}</Styles.ErrorMsg>
          )}
        </Styles.FormGroup>
        <Styles.FormGroup>
          <Styles.Label htmlFor="telefone">Telefone</Styles.Label>
          <Styles.Input
            id="telefone"
            value={watchedTelefone || ""}
            onChange={handleTelefoneChange}
            maxLength={15}
            placeholder="(00) 00000-0000"
            disabled={isViewMode}
          />
          {errors.telefone && (
            <Styles.ErrorMsg>{errors.telefone.message}</Styles.ErrorMsg>
          )}
        </Styles.FormGroup>
        <Styles.FormGroup>
          <Styles.Label htmlFor="email">Email</Styles.Label>
          <Styles.Input
            id="email"
            type="email"
            {...register("email")}
            disabled={isViewMode}
          />
          {errors.email && (
            <Styles.ErrorMsg>{errors.email.message}</Styles.ErrorMsg>
          )}
        </Styles.FormGroup>
      </Styles.FormRow3>

      <Styles.FormRow3>
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
        <Styles.FormGroup>
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
          <Styles.Input
            id="estado"
            {...register("estado")}
            maxLength={2}
            placeholder="SP"
            disabled={isViewMode}
          />
          {errors.estado && (
            <Styles.ErrorMsg>{errors.estado.message}</Styles.ErrorMsg>
          )}
        </Styles.FormGroup>
      </Styles.FormRow3>

      <Styles.FormRow>
        <Styles.FormGroup>
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
        <Styles.FormGroup>
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

      <Styles.FormGroup>
        <Styles.CheckboxContainer>
          <Styles.Checkbox
            id="possuiResponsavel"
            type="checkbox"
            {...register("possuiResponsavel")}
            disabled={isViewMode}
          />
          <Styles.CheckboxLabel htmlFor="possuiResponsavel">
            Possui Responsável
          </Styles.CheckboxLabel>
        </Styles.CheckboxContainer>
      </Styles.FormGroup>

      {watchedPossuiResponsavel && (
        <Styles.FormRow3>
          <Styles.FormGroup>
            <Styles.Label htmlFor="responsavelNome">Nome do Responsável</Styles.Label>
            <Styles.Input
              id="responsavelNome"
              {...register("responsavelNome")}
              disabled={isViewMode}
            />
            {errors.responsavelNome && (
              <Styles.ErrorMsg>{errors.responsavelNome.message}</Styles.ErrorMsg>
            )}
          </Styles.FormGroup>
          <Styles.FormGroup>
            <Styles.Label htmlFor="responsavelCpf">CPF do Responsável</Styles.Label>
            <Styles.Input
              id="responsavelCpf"
              value={watchedResponsavelCpf || ""}
              onChange={handleResponsavelCpfChange}
              maxLength={14}
              placeholder="000.000.000-00"
              disabled={isViewMode}
            />
            {errors.responsavelCpf && (
              <Styles.ErrorMsg>{errors.responsavelCpf.message}</Styles.ErrorMsg>
            )}
          </Styles.FormGroup>
          <Styles.FormGroup>
            <Styles.Label htmlFor="responsavelTelefone">Telefone do Responsável</Styles.Label>
            <Styles.Input
              id="responsavelTelefone"
              value={watchedResponsavelTelefone || ""}
              onChange={handleResponsavelTelefoneChange}
              maxLength={15}
              placeholder="(00) 00000-0000"
              disabled={isViewMode}
            />
            {errors.responsavelTelefone && (
              <Styles.ErrorMsg>{errors.responsavelTelefone.message}</Styles.ErrorMsg>
            )}
          </Styles.FormGroup>
        </Styles.FormRow3>
      )}

      <Styles.FormGroup>
        <Styles.Label htmlFor="observacoes">Observações</Styles.Label>
        <Styles.TextArea
          id="observacoes"
          {...register("observacoes")}
          rows={4}
          disabled={isViewMode}
          placeholder="Observações gerais sobre o aluno..."
        />
        {errors.observacoes && (
          <Styles.ErrorMsg>{errors.observacoes.message}</Styles.ErrorMsg>
        )}
      </Styles.FormGroup>
    </>
  );

  if (!open) return null;

  return (
    <Styles.ModalOverlay>
      <Styles.ModalContainer>
        <Styles.ModalHeader>
          <Styles.ModalTitle>
            {mode === ModalMode.CREATE && "Novo Aluno"}
            {mode === ModalMode.VIEW && `Detalhes do Aluno${alunoNome ? ` - ${alunoNome}` : ''}`}
            {mode === ModalMode.EDIT && `Editar Aluno${alunoNome ? ` - ${alunoNome}` : ''}`}
          </Styles.ModalTitle>
          <Styles.CloseButton onClick={onClose}>×</Styles.CloseButton>
        </Styles.ModalHeader>

        {/* Tabs - apenas para edição e visualização */}
        {(mode === ModalMode.EDIT || mode === ModalMode.VIEW) && (
          <Styles.ModalTabsContainer>
            <Styles.ModalTab 
              active={activeTab === 'dados'} 
              onClick={() => setActiveTab('dados')}
              type="button"
            >
              Dados
            </Styles.ModalTab>
            <Styles.ModalTab 
              active={activeTab === 'matricula'} 
              onClick={() => setActiveTab('matricula')}
              type="button"
            >
              Matrícula
            </Styles.ModalTab>
            <Styles.ModalTab 
              active={activeTab === 'frequencia'} 
              onClick={() => setActiveTab('frequencia')}
              type="button"
            >
              Frequência
            </Styles.ModalTab>
            <Styles.ModalTab 
              active={activeTab === 'pagamentos'} 
              onClick={() => setActiveTab('pagamentos')}
              type="button"
            >
              Pagamentos
            </Styles.ModalTab>
          </Styles.ModalTabsContainer>
        )}

        <Styles.ModalBody>
          {mode === ModalMode.CREATE ? (
            // Modo criar: formulário completo
            <Styles.Form onSubmit={handleSubmit(onSubmit)}>
              {renderFormFields()}

              <Styles.SubmitButtonContainer>
                <Styles.SubmitButton type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader /> : "Criar Aluno"}
                </Styles.SubmitButton>
              </Styles.SubmitButtonContainer>
            </Styles.Form>
          ) : (
            // Modo edição/visualização: conteúdo com tabs
            <Styles.ModalTabContent>
              {activeTab === 'dados' && (
                <Styles.Form onSubmit={handleSubmit(onSubmit)}>
                  {renderFormFields()}
                  
                  {!isViewMode && (
                    <Styles.SubmitButtonContainer>
                      <Styles.SubmitButton type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader /> : "Salvar Dados"}
                      </Styles.SubmitButton>
                    </Styles.SubmitButtonContainer>
                  )}
                </Styles.Form>
              )}

              {activeTab === 'matricula' && (
                <MatriculaForm
                  mode={mode}
                  alunoId={alunoIdToEdit!}
                  alunoName={alunoNome}
                  onSaveComplete={onSaveComplete as any}
                />
              )}

              {activeTab === 'frequencia' && (
                <FrequenciaForm 
                  alunoId={alunoIdToEdit || ''} 
                />
              )}

              {activeTab === 'pagamentos' && (
                <PagamentosForm 
                  alunoId={alunoIdToEdit || ''} 
                />
              )}
            </Styles.ModalTabContent>
          )}
        </Styles.ModalBody>
      </Styles.ModalContainer>
    </Styles.ModalOverlay>
  );
};

export default ClientModal;