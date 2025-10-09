import React, { useState, useEffect, useCallback } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Styles from "./MatriculaForm.styles";
import Loader from "../../../../components/Loader/Loader";
import { supabase } from "../../../../lib/supabase";
import {
  ModalMode,
  MatriculaFormData,
  matriculaSchema,
  MatriculaItem,

} from "../ClientModal/ClientModal.definitions";

// Funções para conversão de datas entre formato HTML (yyyy-mm-dd) e brasileiro (dd/mm/yyyy)
function formatDateToBrazilian(htmlDate: string): string {
  if (!htmlDate) return "";
  const [year, month, day] = htmlDate.split('-');
  return `${day}/${month}/${year}`;
}

function formatDateToHTML(brazilianDate: string): string {
  if (!brazilianDate) return "";
  const [day, month, year] = brazilianDate.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Funções para conversão de valores monetários entre texto do banco e números
function parseMoneyFromDB(dbValue: string | null | undefined): number {
  if (!dbValue) return 0;
  // Remove espaços e converte vírgula para ponto
  const cleanValue = String(dbValue)
    .trim()
    .replace(/\s/g, '')
    .replace(',', '.');
  
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
}

function formatMoneyToDB(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) return "0,00";
  return value.toFixed(2).replace('.', ',');
}

function formatMoneyToDisplay(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) return "R$ 0,00";
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}







async function fetchModalidadeNome(modalidadeID: number): Promise<string> {
  if (!modalidadeID) return "";
  const { data, error } = await supabase
    .from("modalidades_old")
    .select("modalidadeNome")
    .eq("modalidadeID", modalidadeID)
    .maybeSingle();

  if (error) {
    console.error("MatriculaForm: Erro ao buscar modalidade:", error.message);
    return "";
  }

  return data?.modalidadeNome || "";
}

async function fetchModalidadesAtivas(): Promise<Array<{modalidadeID: number, modalidadeNome: string, modalidadeMensal: number}>> {
  const { data, error } = await supabase
    .from("modalidades_old")
    .select("modalidadeID, modalidadeNome, modalidadeMensal")
    .eq("modalidadeAtiva", true)
    .eq("modalidadeExcluida", false)
    .order("modalidadeNome", { ascending: true });

  if (error) {
    console.error("MatriculaForm: Erro ao buscar modalidades:", error.message);
    return [];
  }

  return data || [];
}

async function getNextMatriculaNumero(alunoID: number): Promise<number> {
  const { data, error } = await supabase
    .from("matricula_old")
    .select("matriculaNumero")
    .eq("alunoID", alunoID)
    .order("matriculaNumero", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("MatriculaForm: Erro ao buscar último número de matrícula:", error.message);
    return 1;
  }

  return (data?.matriculaNumero || 0) + 1;
}

interface MatriculaFormProps {
  alunoId: string;
  alunoName: string;
  mode: ModalMode;
  onSaveComplete: (
    error: any | null,
    savedData?: Partial<MatriculaFormData & { valorCobradoFinal?: number }>
  ) => void;
}

const MatriculaForm: React.FC<MatriculaFormProps> = ({
  alunoId,
  mode,
  onSaveComplete,
}) => {
  const isViewMode = mode === ModalMode.VIEW;
  const isEditMode = mode === ModalMode.EDIT;

  const [isLoadingInitialData, setIsLoadingInitialData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMatricula, setHasMatricula] = useState<boolean>(true);

  const [existingMatriculaId, setExistingMatriculaId] = useState<
    string | undefined
  >(undefined);
  const [modalidadeNome, setModalidadeNome] = useState<string>("");

  // Estados para criação de matrícula
  const [modalidadesDisponiveis, setModalidadesDisponiveis] = useState<Array<{modalidadeID: number, modalidadeNome: string, modalidadeMensal: number}>>([]);
  const [modalidadeSelecionada, setModalidadeSelecionada] = useState<number | null>(null);
  const [isCreatingMatricula, setIsCreatingMatricula] = useState(false);

  const getDefaultMatriculaValues = useCallback(() => {
    const hoje = new Date();
    return {
      matriculaItens: [],
      dataMatricula: hoje.toISOString().split("T")[0],
      diaVencimento: hoje.getDate(),
      matriculaSituacao: "PENDENTE" as any,
      observacoesMatricula: "",
      valorPlano: "0.00",
      valorCobrado: "0.00",
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,

    reset,
  } = useForm<MatriculaFormData>({
    //@ts-expect-error
    resolver: yupResolver(matriculaSchema),
    defaultValues: getDefaultMatriculaValues(),
  });

  const watchedValues = watch();



  useEffect(() => {
    const loadMatriculaData = async () => {
      if ((mode === ModalMode.VIEW || mode === ModalMode.EDIT) && alunoId) {
        setIsLoadingInitialData(true);
        try {
          const { data: matriculaData, error: matriculaError } = await supabase
            .from("matricula_old")
            .select("*")
            .eq("alunoID", alunoId)
            .maybeSingle();

          if (matriculaError) throw matriculaError;

          if (matriculaData) {
            setHasMatricula(true);
            // Buscar nome da modalidade
            if (matriculaData.modalidadeID) {
              const nomeModalidade = await fetchModalidadeNome(matriculaData.modalidadeID);
              setModalidadeNome(nomeModalidade);
            }

            // Debug: verificar valor recebido
            console.log("MatriculaForm DEBUG - matriculaData.matriculaValor:", matriculaData.matriculaValor);
            console.log("MatriculaForm DEBUG - parseMoneyFromDB resultado:", parseMoneyFromDB(matriculaData.matriculaValor || "0.00"));
            console.log("MatriculaForm DEBUG - formatMoneyToDisplay resultado:", formatMoneyToDisplay(parseMoneyFromDB(matriculaData.matriculaValor || "0.00")));
            
            // Para matricula_old, os dados de planos/turmas podem estar em campos separados
            // ou precisaremos buscar em uma tabela de detalhes separada
            const mappedItens: MatriculaItem[] = [];
            
            // TODO: Implementar busca dos itens de matrícula baseado na estrutura real da matricula_old
            // Por enquanto, deixamos vazio para não quebrar
            
            const formData: MatriculaFormData = {
              dataMatricula:
                formatDateToHTML(matriculaData.matriculaDtInicio) ||
                getDefaultMatriculaValues().dataMatricula,
              diaVencimento:
                matriculaData.matriculaDiaVencimento ??
                getDefaultMatriculaValues().diaVencimento,
              matriculaSituacao:
                (matriculaData.matriculaSituacao || "PENDENTE") as any,
              observacoesMatricula: "", // Não há campo de observações na estrutura atual
              matriculaItens: mappedItens,
              valorPlano: matriculaData.matriculaValor || "0.00", // O valor do plano vem do matriculaValor
              valorCobrado: matriculaData.matriculaValor || "0.00", // O valor cobrado também vem do matriculaValor
            };
            reset(formData);
            setExistingMatriculaId(matriculaData.matriculaID);


          } else {
            setHasMatricula(false);
            reset(getDefaultMatriculaValues());
            setExistingMatriculaId(undefined);
          }
        } catch (error) {
          console.error("Erro ao buscar matrícula existente:", error);
          reset(getDefaultMatriculaValues());
          setExistingMatriculaId(undefined);
        } finally {
          setIsLoadingInitialData(false);
        }
      } else {
        reset(getDefaultMatriculaValues());
        setExistingMatriculaId(undefined);

        setIsLoadingInitialData(false);
      }
    };
    loadMatriculaData();
  }, [alunoId, mode, reset, getDefaultMatriculaValues]);

  // Carregar modalidades disponíveis quando não houver matrícula
  useEffect(() => {
    const loadModalidades = async () => {
      if (!hasMatricula && (isEditMode || isViewMode)) {
        const modalidades = await fetchModalidadesAtivas();
        setModalidadesDisponiveis(modalidades);
      }
    };
    loadModalidades();
  }, [hasMatricula, isEditMode, isViewMode]);

  // Função para criar nova matrícula
  const handleCreateMatricula = async () => {
    if (!modalidadeSelecionada) {
      onSaveComplete(new Error("Selecione uma modalidade"), undefined);
      return;
    }

    setIsCreatingMatricula(true);
    try {
      const modalidade = modalidadesDisponiveis.find(m => m.modalidadeID === modalidadeSelecionada);
      if (!modalidade) throw new Error("Modalidade não encontrada");

      const matriculaNumero = await getNextMatriculaNumero(parseInt(alunoId));
      const hoje = new Date();
      const dataInicio = `${hoje.getDate().toString().padStart(2, '0')}/${(hoje.getMonth() + 1).toString().padStart(2, '0')}/${hoje.getFullYear()}`;
      const diaVencimento = hoje.getDate();

      const matriculaPayload = {
        alunoID: parseInt(alunoId),
        modalidadeID: modalidade.modalidadeID,
        matriculaNumero: matriculaNumero,
        matriculaDtInicio: dataInicio,
        matriculaDtInicioGeral: dataInicio,
        matriculaValor: formatMoneyToDB(modalidade.modalidadeMensal),
        matriculaForma: "MENSAL",
        matriculaSituacao: "PENDENTE",
        matriculaDiaVencimento: diaVencimento,
        matriculaDtFim: null,
        matriculaDesconto: formatMoneyToDB(0),
        matriculaDtBloqueio: null,
        matriculaDtTrancamento: null,
        matriculaDtEncerramento: null,
        matriculaMotivoBloqueio: null,
        matriculaMotivoEncerramento: null,
        matriculaMotivoTrancamento: null,
        matriculaExcluida: false,
      };

      const { data: newMatricula, error: matriculaError } = await supabase
        .from("matricula_old")
        .insert(matriculaPayload)
        .select("matriculaID")
        .single();

      if (matriculaError) throw matriculaError;
      if (!newMatricula || !newMatricula.matriculaID) {
        throw new Error("Falha ao criar matrícula.");
      }

      // Criar recebimento automático para a primeira mensalidade
      const mesesAbrev = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
      const mesRef = mesesAbrev[hoje.getMonth()];
      const anoRef = hoje.getFullYear();
      const historicoRecebimento = `MENSALIDADE REF: ${mesRef}/${anoRef} - ${modalidade.modalidadeNome}`;

      const recebimentoPayload = {
        idRelaciona: newMatricula.matriculaID,
        planoID: modalidade.modalidadeID,
        alunoID: parseInt(alunoId),
        contaID: 0,
        recebDtVencimento: dataInicio,
        recebDtEmissao: dataInicio,
        recebValor: formatMoneyToDB(modalidade.modalidadeMensal),
        recebMulta: '0,00',
        recebPago: false,
        recebHistorico: historicoRecebimento,
        recebExcluido: false,
        funcID: 0,
        pagoRecorrente: 0,
        RecebDesconto: '0,00',
        recebFuncIdIsentou: 0,
      };

      const { error: recebimentoError } = await supabase
        .from("recebimentos_old")
        .insert(recebimentoPayload);

      if (recebimentoError) {
        console.error("Erro ao criar recebimento automático:", recebimentoError);
        // Não bloqueia a criação da matrícula, apenas loga o erro
      }

      onSaveComplete(null, {
        dataMatricula: dataInicio,
        diaVencimento: diaVencimento,
        matriculaSituacao: "PENDENTE" as any,
        observacoesMatricula: "",
        matriculaItens: [],
        valorPlano: formatMoneyToDB(modalidade.modalidadeMensal),
        valorCobrado: formatMoneyToDB(modalidade.modalidadeMensal),
      });

      // Recarregar dados
      setHasMatricula(true);
      setExistingMatriculaId(newMatricula.matriculaID);

    } catch (error: any) {
      console.error("Erro ao criar matrícula:", error);
      onSaveComplete(error, undefined);
    } finally {
      setIsCreatingMatricula(false);
    }
  };



  const onSubmit: SubmitHandler<MatriculaFormData> = async (formData) => {
    if (isViewMode) return;
    setIsSubmitting(true);

    const { matriculaItens, ...matriculaInfoGeral } = formData;

    // Como agora só temos um plano, não há desconto
    // const valorTotalBruto = matriculaItens.reduce(
    //   (sum, item) => sum + item.valorOriginalPlano,
    //   0
    // );

    const dataMatriculaObj = new Date(
      matriculaInfoGeral.dataMatricula + "T00:00:00Z"
    );
    const dataVencimentoObj = new Date(dataMatriculaObj);
    dataVencimentoObj.setUTCMonth(dataMatriculaObj.getUTCMonth() + 1);
    const dataVencimentoFormatada = dataVencimentoObj
      .toISOString()
      .split("T")[0];

    const matriculaPrincipalPayload = {
      alunoID: parseInt(alunoId),
      modalidadeID: 1, // Valor padrão, pode ser ajustado conforme necessário
      matriculaDtInicio: formatDateToBrazilian(matriculaInfoGeral.dataMatricula),
      matriculaDtFim: formatDateToBrazilian(dataVencimentoFormatada), // Usando como data fim temporária
      matriculaDesconto: formatMoneyToDB(0),
      matriculaValor: formatMoneyToDB(parseMoneyFromDB(formData.valorCobrado || "0.00")),
      matriculaForma: "MENSAL",
      // Status não é alterado via formulário - mantém o valor original do banco
      matriculaDiaVencimento: matriculaInfoGeral.diaVencimento,
      matriculaDtBloqueio: null,
      matriculaDtTrancamento: null,
      matriculaDtEncerramento: null,
      matriculaMotivoBloqueio: null,
      matriculaMotivoEncerramento: null,
      matriculaMotivoTrancamento: null,
      matriculaExcluida: false,
      matriculaDtInicioGeral: formatDateToBrazilian(matriculaInfoGeral.dataMatricula),
    };

    try {
      let currentMatriculaId = existingMatriculaId;

      if (mode === ModalMode.CREATE || !existingMatriculaId) {
        // Para matricula_old, não há conceito de ativo_atual, apenas inserimos nova matrícula
        const { data: newMatricula, error: matriculaError } = await supabase
          .from("matricula_old")
          .insert(matriculaPrincipalPayload)
          .select("matriculaID")
          .single();

        if (matriculaError) throw matriculaError;
        if (!newMatricula || !newMatricula.matriculaID)
          throw new Error("Falha ao obter ID da nova matrícula.");
        currentMatriculaId = newMatricula.matriculaID;
      } else {
        // Para update, removemos o alunoID do payload
        const { alunoID, ...updatePayload } = matriculaPrincipalPayload;
        const { error: updateError } = await supabase
          .from("matricula_old")
          .update(updatePayload)
          .eq("matriculaID", existingMatriculaId);
        if (updateError) throw updateError;
      }

      if (!currentMatriculaId) {
        throw new Error("ID da matrícula não foi estabelecido ou encontrado.");
      }

      // TODO: Implementar limpeza dos detalhes de matrícula para matricula_old
      // await supabase
      //   .from("matricula_detalhes_old")
      //   .delete()
      //   .eq("matriculaID", currentMatriculaId);

      // TODO: Implementar quando definir estrutura de itens para matricula_old
      /*
      const itensParaSalvar = matriculaItens.map((item) => {
        if (item.planoId === "personalizado") {
          // Para plano personalizado, usamos NULL para o id_plano
          const turmaCorrespondente = turmasConhecidas.get(item.turmaId);
          return {
            id_matricula: currentMatriculaId,
            id_plano: null, // NULL para plano personalizado
            id_turma: item.turmaId,
            id_modalidade: turmaCorrespondente?.modalidade_id || null,
            valor_unitario: item.valorOriginalPlano,
            nome_plano_personalizado: item.nomePersonalizado || "Plano Personalizado",
          };
        } else {
          // Para plano do banco de dados
          const planoCorrespondente = planosDB.find((p) => p.id === item.planoId);
          if (!planoCorrespondente) {
            throw new Error(
              `Plano com ID ${item.planoId} não encontrado nos dados de planos disponíveis.`
            );
          }
          return {
            id_matricula: currentMatriculaId,
            id_plano: item.planoId,
            id_turma: item.turmaId,
            id_modalidade: planoCorrespondente.modalidade_id,
            valor_unitario: item.valorOriginalPlano,
            nome_plano_personalizado: null,
          };
        }
      });
      */

      // TODO: Implementar inserção dos itens de matrícula para matricula_old
      // if (itensParaSalvar.length > 0) {
      //   const { error: itensError } = await supabase
      //     .from("matricula_detalhes_old")
      //     .insert(itensParaSalvar);
      //   if (itensError) throw itensError;
      // }

      onSaveComplete(null, {
        ...formData,
      });
    } catch (error: any) {
      console.error("Erro ao salvar matrícula no Supabase:", error);
      onSaveComplete(error, undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingInitialData && (isEditMode || isViewMode)) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <Loader /> Carregando dados da matrícula...
      </div>
    );
  }

  if (!hasMatricula && (isEditMode || isViewMode)) {
    const modalidadeInfo = modalidadeSelecionada
      ? modalidadesDisponiveis.find(m => m.modalidadeID === modalidadeSelecionada)
      : null;

    const hoje = new Date();
    const dataInicioFormatted = hoje.toISOString().split('T')[0];

    return (
      <div>
        <Styles.SectionTitle style={{ marginTop: "0", fontSize: "1.1rem", marginBottom: "20px" }}>
          Criar Nova Matrícula
        </Styles.SectionTitle>

        <Styles.FormGroup>
          <Styles.Label htmlFor="modalidade">Modalidade/Plano *</Styles.Label>
          <Styles.Select
            id="modalidade"
            value={modalidadeSelecionada || ''}
            onChange={(e) => setModalidadeSelecionada(e.target.value ? parseInt(e.target.value) : null)}
            disabled={isCreatingMatricula}
          >
            <option value="">Selecione uma modalidade...</option>
            {modalidadesDisponiveis.map((mod) => (
              <option key={mod.modalidadeID} value={mod.modalidadeID}>
                {mod.modalidadeNome} - {formatMoneyToDisplay(mod.modalidadeMensal)}
              </option>
            ))}
          </Styles.Select>
        </Styles.FormGroup>

        {modalidadeInfo && (
          <>
            <Styles.FormRow>
              <Styles.FormGroup>
                <Styles.Label>Valor Mensal</Styles.Label>
                <Styles.Input
                  type="text"
                  value={formatMoneyToDisplay(modalidadeInfo.modalidadeMensal)}
                  disabled
                  readOnly
                />
              </Styles.FormGroup>
              <Styles.FormGroup>
                <Styles.Label>Forma de Pagamento</Styles.Label>
                <Styles.Input
                  type="text"
                  value="MENSAL"
                  disabled
                  readOnly
                />
              </Styles.FormGroup>
            </Styles.FormRow>

            <Styles.FormRow>
              <Styles.FormGroup>
                <Styles.Label>Data de Início</Styles.Label>
                <Styles.Input
                  type="date"
                  value={dataInicioFormatted}
                  disabled
                  readOnly
                />
              </Styles.FormGroup>
              <Styles.FormGroup>
                <Styles.Label>Dia de Vencimento</Styles.Label>
                <Styles.Input
                  type="number"
                  value={hoje.getDate()}
                  disabled
                  readOnly
                />
              </Styles.FormGroup>
            </Styles.FormRow>

            <Styles.FormGroup>
              <Styles.Label>Status Inicial</Styles.Label>
              <Styles.Input
                type="text"
                value="PENDENTE"
                disabled
                readOnly
              />
            </Styles.FormGroup>
          </>
        )}

        <Styles.SubmitButtonContainer style={{ marginTop: '20px' }}>
          <Styles.SubmitButton
            type="button"
            onClick={handleCreateMatricula}
            disabled={!modalidadeSelecionada || isCreatingMatricula}
          >
            {isCreatingMatricula ? <Loader /> : "Criar Matrícula"}
          </Styles.SubmitButton>
        </Styles.SubmitButtonContainer>
      </div>
    );
  }

  return (
    //@ts-expect-error
    <Styles.Form onSubmit={handleSubmit(onSubmit)}>

      {/* Informações do Plano (Somente Leitura) */}
      <Styles.SectionTitle
        style={{ marginTop: "10px", fontSize: "0.95rem" }}
      >
        Informações do Plano
      </Styles.SectionTitle>
      
      <Styles.FormRow>
        <Styles.FormGroup>
          <Styles.Label>Plano/Modalidade</Styles.Label>
          <Styles.DisplayField>
            {modalidadeNome || "Carregando..."}
          </Styles.DisplayField>
        </Styles.FormGroup>
      </Styles.FormRow>
      
      {/* Campos ocultos para armazenar os valores originais */}
      <input type="hidden" {...register("valorPlano")} />
      <input type="hidden" {...register("valorCobrado")} />







      <Styles.FormRow style={{ marginTop: "15px", alignItems: "flex-end" }}>
        <Styles.FormGroup style={{ marginBottom: 0 }}>
          <Styles.Label>Valor do Plano</Styles.Label>
          <Styles.DisplayField>
            {(() => {
              const valor = watchedValues.valorPlano || "0.00";
              console.log("MatriculaForm DEBUG - watchedValues.valorPlano:", valor);
              return formatMoneyToDisplay(parseMoneyFromDB(valor));
            })()}
          </Styles.DisplayField>
        </Styles.FormGroup>
        <Styles.FormGroup style={{ marginBottom: 0 }}>
          <Styles.Label style={{ fontWeight: "bold" }}>
            Valor Mensal (Cobrança)
          </Styles.Label>
          <Styles.DisplayField style={{ fontWeight: "bold", fontSize: "1rem" }}>
            {(() => {
              const valor = watchedValues.valorCobrado || "0.00";
              console.log("MatriculaForm DEBUG - watchedValues.valorCobrado:", valor);
              return formatMoneyToDisplay(parseMoneyFromDB(valor));
            })()}
          </Styles.DisplayField>
        </Styles.FormGroup>
      </Styles.FormRow>

      <Styles.FormRow>
        <Styles.FormGroup>
          <Styles.Label>Data da Matrícula (Automática)</Styles.Label>
          <Styles.Input
            type="date"
            {...register("dataMatricula")}
            readOnly
            disabled={isViewMode}
          />
          {errors.dataMatricula && (
            <Styles.ErrorMsg>{errors.dataMatricula.message}</Styles.ErrorMsg>
          )}
        </Styles.FormGroup>
        <Styles.FormGroup>
          <Styles.Label>Dia Vencimento (Automático)</Styles.Label>
          <Styles.Input
            type="number"
            {...register("diaVencimento")}
            readOnly
            disabled={isViewMode}
          />
          {errors.diaVencimento && (
            <Styles.ErrorMsg>{errors.diaVencimento.message}</Styles.ErrorMsg>
          )}
        </Styles.FormGroup>
      </Styles.FormRow>
      <Styles.FormGroup>
        <Styles.Label>Status</Styles.Label>
        <Styles.Input
          type="text"
          {...register("matriculaSituacao")}
          disabled
          readOnly
        />
        {errors.matriculaSituacao && (
          <Styles.ErrorMsg>{errors.matriculaSituacao.message}</Styles.ErrorMsg>
        )}
      </Styles.FormGroup>
      <Styles.FormGroup>
        <Styles.Label>Observações</Styles.Label>
        <Styles.Textarea
          {...register("observacoesMatricula")}
          rows={3}
          disabled={isViewMode}
        />
        {errors.observacoesMatricula && (
          <Styles.ErrorMsg>
            {errors.observacoesMatricula.message}
          </Styles.ErrorMsg>
        )}
      </Styles.FormGroup>

      {!isViewMode && (
        <Styles.SubmitButtonContainer>
          <Styles.SubmitButton
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader />
            ) : isEditMode && existingMatriculaId ? (
              "Atualizar Matrícula"
            ) : (
              "Salvar Matrícula"
            )}
          </Styles.SubmitButton>
        </Styles.SubmitButtonContainer>
      )}
    </Styles.Form>
  );
};

export default MatriculaForm;
