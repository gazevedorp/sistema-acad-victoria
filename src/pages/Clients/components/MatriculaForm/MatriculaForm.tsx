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


  const [existingMatriculaId, setExistingMatriculaId] = useState<
    string | undefined
  >(undefined);
  const [modalidadeNome, setModalidadeNome] = useState<string>("");

  const getDefaultMatriculaValues = useCallback(() => {
    const hoje = new Date();
    return {
      matriculaItens: [],
      dataMatricula: hoje.toISOString().split("T")[0],
      diaVencimento: hoje.getDate(),
      statusMatricula: "ativa" as "ativa" | "inativa",
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
              statusMatricula:
                matriculaData.matriculaSituacao === "ATIVA" ? "ativa" : "inativa",
              observacoesMatricula: "", // Não há campo de observações na estrutura atual
              matriculaItens: mappedItens,
              valorPlano: matriculaData.matriculaValor || "0.00", // O valor do plano vem do matriculaValor
              valorCobrado: matriculaData.matriculaValor || "0.00", // O valor cobrado também vem do matriculaValor
            };
            reset(formData);
            setExistingMatriculaId(matriculaData.matriculaID);


          } else {
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
      matriculaSituacao: matriculaInfoGeral.statusMatricula === "ativa" ? "ATIVA" : "INATIVA",
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
        <Styles.Select {...register("statusMatricula")} disabled={isViewMode}>
          <option value="ativa">Ativa</option>
          <option value="inativa">Inativa</option>
        </Styles.Select>
        {errors.statusMatricula && (
          <Styles.ErrorMsg>{errors.statusMatricula.message}</Styles.ErrorMsg>
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
