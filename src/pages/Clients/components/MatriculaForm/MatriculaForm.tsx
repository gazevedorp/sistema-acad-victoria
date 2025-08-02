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
  PlanoFromSupabase,
  TurmaFromSupabase,
} from "../ClientModal/ClientModal.definitions";

async function fetchPlanosFromDB(): Promise<PlanoFromSupabase[]> {
  const { data, error } = await supabase
    .from("planos")
    .select("id, nome, valor_mensal, modalidade_id");
  if (error) {
    console.error("MatriculaForm: Erro ao buscar planos:", error.message);
    return [];
  }
  return data || [];
}

async function fetchTurmasByIds(
  turmaIds: string[]
): Promise<TurmaFromSupabase[]> {
  if (!turmaIds || turmaIds.length === 0) return [];
  const { data, error } = await supabase
    .from("turmas")
    .select("id, nome, horarios_descricao, modalidade_id")
    .in("id", turmaIds);
  if (error) {
    console.error(
      "MatriculaForm: Erro ao buscar detalhes das turmas:",
      error.message
    );
    return [];
  }
  return data || [];
}

async function fetchTurmasByModalidadeId(
  modalidadeId?: string | null
): Promise<TurmaFromSupabase[]> {
  if (!modalidadeId) return [];
  const { data, error } = await supabase
    .from("turmas")
    .select("id, nome, horarios_descricao, modalidade_id")
    .eq("modalidade_id", modalidadeId);
  if (error) {
    console.error(
      "MatriculaForm: Erro ao buscar turmas por modalidade:",
      error.message
    );
    return [];
  }
  return data || [];
}

async function fetchAllTurmas(): Promise<TurmaFromSupabase[]> {
  const { data, error } = await supabase
    .from("turmas")
    .select("id, nome, horarios_descricao, modalidade_id");
  if (error) {
    console.error("MatriculaForm: Erro ao buscar todas as turmas:", error.message);
    return [];
  }
  return data || [];
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
  alunoName,
  mode,
  onSaveComplete,
}) => {
  const isViewMode = mode === ModalMode.VIEW;
  const isEditMode = mode === ModalMode.EDIT;

  const [isLoadingInitialData, setIsLoadingInitialData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [planosDB, setPlanosDB] = useState<PlanoFromSupabase[]>([]);
  const [turmasDisponiveisParaPlano, setTurmasDisponiveisParaPlano] = useState<
    TurmaFromSupabase[]
  >([]);
  const [todasAsTurmas, setTodasAsTurmas] = useState<TurmaFromSupabase[]>([]);
  const [turmasConhecidas, setTurmasConhecidas] = useState<
    Map<string, TurmaFromSupabase>
  >(new Map());
  const [isLoadingPlanos, setIsLoadingPlanos] = useState(false);
  const [isLoadingTurmasParaAdicionar, setIsLoadingTurmasParaAdicionar] =
    useState(false);

  const [planoParaAdicionarId, setPlanoParaAdicionarId] = useState<string>("");
  const [turmaParaAdicionarId, setTurmaParaAdicionarId] = useState<string>("");
  const [isPlanoPersonalizado, setIsPlanoPersonalizado] = useState<boolean>(false);
  const [planoPersonalizadoNome, setPlanoPersonalizadoNome] = useState<string>("");
  const [planoPersonalizadoValor, setPlanoPersonalizadoValor] = useState<number>(0);
  const [turmasPersonalizadas, setTurmasPersonalizadas] = useState<string[]>([]);
  const [calculatedValorCobrado, setCalculatedValorCobrado] =
    useState<number>(0);
  const [existingMatriculaId, setExistingMatriculaId] = useState<
    string | undefined
  >(undefined);

  const getDefaultMatriculaValues = useCallback(() => {
    const hoje = new Date();
    return {
      matriculaItens: [],
      dataMatricula: hoje.toISOString().split("T")[0],
      diaVencimento: hoje.getDate(),
      statusMatricula: "ativa" as "ativa" | "inativa",
      observacoesMatricula: "",
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    reset,
  } = useForm<MatriculaFormData>({
    //@ts-expect-error
    resolver: yupResolver(matriculaSchema),
    defaultValues: getDefaultMatriculaValues(),
  });

  const watchedMatriculaItens = watch("matriculaItens", []);

  const updateTurmasConhecidas = useCallback((turmas: TurmaFromSupabase[]) => {
    setTurmasConhecidas((prevMap) => {
      const newMap = new Map(prevMap);
      turmas.forEach((turma) => newMap.set(turma.id, turma));
      return newMap;
    });
  }, []);

  useEffect(() => {
    const loadMatriculaData = async () => {
      if ((mode === ModalMode.VIEW || mode === ModalMode.EDIT) && alunoId) {
        setIsLoadingInitialData(true);
        try {
          const { data: matriculaData, error: matriculaError } = await supabase
            .from("matriculas")
            .select(
              `id, data_matricula, dia_vencimento, status_matricula, observacoes, valor_cobrado_final, matricula_itens (plano_id, turma_id, valor_original_plano)`
            )
            .eq("aluno_id", alunoId)
            .eq("ativo_atual", true)
            .maybeSingle();

          if (matriculaError) throw matriculaError;

          if (matriculaData) {
            const mappedItens = (matriculaData.matricula_itens || []).map(
              (item: any) => ({
                planoId: item.plano_id,
                turmaId: item.turma_id,
                valorOriginalPlano: item.valor_original_plano,
              })
            );

            const formData: MatriculaFormData = {
              dataMatricula:
                matriculaData.data_matricula ||
                getDefaultMatriculaValues().dataMatricula,
              diaVencimento:
                matriculaData.dia_vencimento ??
                getDefaultMatriculaValues().diaVencimento,
              statusMatricula:
                (matriculaData.status_matricula as MatriculaFormData["statusMatricula"]) ||
                "ativa",
              observacoesMatricula: matriculaData.observacoes || "",
              matriculaItens: mappedItens,
            };
            reset(formData);
            setExistingMatriculaId(matriculaData.id);
            setCalculatedValorCobrado(matriculaData.valor_cobrado_final || 0);

            if (mappedItens.length > 0) {
              const turmaIds = [
                ...new Set(
                  mappedItens.map((item) => item.turmaId).filter(Boolean)
                ),
              ];
              if (turmaIds.length > 0) {
                const turmasData = await fetchTurmasByIds(turmaIds);
                updateTurmasConhecidas(turmasData);
              }
            }
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
        setCalculatedValorCobrado(0);
        setTurmasConhecidas(new Map());
        setIsLoadingInitialData(false);
      }
    };
    loadMatriculaData();
  }, [alunoId, mode, reset, getDefaultMatriculaValues, updateTurmasConhecidas]);

  useEffect(() => {
    if (!isViewMode) {
      setIsLoadingPlanos(true);
      Promise.all([
        fetchPlanosFromDB(),
        fetchAllTurmas()
      ]).then(([planos, turmas]) => {
        setPlanosDB(planos);
        setTodasAsTurmas(turmas);
        updateTurmasConhecidas(turmas);
      }).finally(() => setIsLoadingPlanos(false));
    }
  }, [isViewMode, updateTurmasConhecidas]);

  useEffect(() => {
    if (planoParaAdicionarId && planosDB.length > 0) {
      const planoSelecionado = planosDB.find(
        (p) => p.id === planoParaAdicionarId
      );
      if (planoSelecionado && planoSelecionado.modalidade_id) {
        setIsLoadingTurmasParaAdicionar(true);
        fetchTurmasByModalidadeId(planoSelecionado.modalidade_id)
          .then((turmas) => {
            setTurmasDisponiveisParaPlano(turmas);
            updateTurmasConhecidas(turmas);
          })
          .finally(() => setIsLoadingTurmasParaAdicionar(false));
      } else {
        setTurmasDisponiveisParaPlano([]);
      }
    } else {
      setTurmasDisponiveisParaPlano([]);
    }
  }, [planoParaAdicionarId, planosDB, updateTurmasConhecidas]);

  useEffect(() => {
    if (!watchedMatriculaItens || watchedMatriculaItens.length === 0) {
      setCalculatedValorCobrado(0);
      return;
    }
    
    // Como agora só temos um plano, não há desconto por múltiplos planos
    const valorTotalMensal = watchedMatriculaItens.reduce(
      (sum, item) => sum + item.valorOriginalPlano,
      0
    );
    
    setCalculatedValorCobrado(valorTotalMensal);
  }, [watchedMatriculaItens]);

  const handleAddMatriculaItem = useCallback(() => {
    // Remover item existente se houver (só pode ter um plano)
    setValue("matriculaItens", [], { shouldValidate: true, shouldDirty: true });
    
    if (isPlanoPersonalizado) {
      // Plano personalizado
      if (planoPersonalizadoNome && planoPersonalizadoValor > 0 && turmasPersonalizadas.length > 0) {
        const itensPersonalizados = turmasPersonalizadas.map(turmaId => ({
          planoId: "personalizado",
          turmaId: turmaId,
          valorOriginalPlano: planoPersonalizadoValor,
          nomePersonalizado: planoPersonalizadoNome,
        }));
        
        setValue("matriculaItens", itensPersonalizados, {
          shouldValidate: true,
          shouldDirty: true,
        });
        
        // Limpar campos
        setPlanoPersonalizadoNome("");
        setPlanoPersonalizadoValor(0);
        setTurmasPersonalizadas([]);
      }
    } else {
      // Plano do banco de dados
      if (planoParaAdicionarId && turmaParaAdicionarId) {
        const planoSelecionado = planosDB.find(
          (p) => p.id === planoParaAdicionarId
        );
        if (!planoSelecionado) return;
        
        const novoItem: MatriculaItem = {
          planoId: planoSelecionado.id,
          turmaId: turmaParaAdicionarId,
          valorOriginalPlano: planoSelecionado.valor_mensal,
        };
        
        setValue("matriculaItens", [novoItem], {
          shouldValidate: true,
          shouldDirty: true,
        });
        
        setPlanoParaAdicionarId("");
        setTurmaParaAdicionarId("");
      }
    }
  }, [
    isPlanoPersonalizado,
    planoPersonalizadoNome,
    planoPersonalizadoValor,
    turmasPersonalizadas,
    planoParaAdicionarId,
    turmaParaAdicionarId,
    planosDB,
    setValue,
  ]);

  const handleRemoveMatriculaItem = useCallback(
    (indexToRemove: number) => {
      const atuaisItens = getValues("matriculaItens") || [];
      setValue(
        "matriculaItens",
        atuaisItens.filter((_, index) => index !== indexToRemove),
        { shouldValidate: true, shouldDirty: true }
      );
    },
    [getValues, setValue]
  );

  const onSubmit: SubmitHandler<MatriculaFormData> = async (formData) => {
    if (isViewMode) return;
    setIsSubmitting(true);

    const { matriculaItens, ...matriculaInfoGeral } = formData;

    // Como agora só temos um plano, não há desconto
    const valorTotalBruto = matriculaItens.reduce(
      (sum, item) => sum + item.valorOriginalPlano,
      0
    );

    const dataMatriculaObj = new Date(
      matriculaInfoGeral.dataMatricula + "T00:00:00Z"
    );
    const dataVencimentoObj = new Date(dataMatriculaObj);
    dataVencimentoObj.setUTCMonth(dataMatriculaObj.getUTCMonth() + 1);
    const dataVencimentoFormatada = dataVencimentoObj
      .toISOString()
      .split("T")[0];

    const matriculaPrincipalPayload = {
      id_aluno: alunoId,
      data_matricula: matriculaInfoGeral.dataMatricula,
      data_vencimento: dataVencimentoFormatada,
      valor_total: valorTotalBruto,
      porcentagem_desconto: 0, // Sem desconto para um único plano
      valor_final_cobrado: calculatedValorCobrado,
      status_matricula: matriculaInfoGeral.statusMatricula,
      observacao: matriculaInfoGeral.observacoesMatricula,
      ativo_atual: true,
    };

    try {
      let currentMatriculaId = existingMatriculaId;

      if (mode === ModalMode.CREATE || !existingMatriculaId) {
        await supabase
          .from("matriculas")
          .update({ ativo_atual: false })
          .eq("id_aluno", alunoId)
          .eq("ativo_atual", true);

        const { data: newMatricula, error: matriculaError } = await supabase
          .from("matriculas")
          .insert(matriculaPrincipalPayload)
          .select("id")
          .single();

        if (matriculaError) throw matriculaError;
        if (!newMatricula || !newMatricula.id)
          throw new Error("Falha ao obter ID da nova matrícula.");
        currentMatriculaId = newMatricula.id;
      } else {
        const { error: updateError } = await supabase
          .from("matriculas")
          .update(matriculaPrincipalPayload)
          .eq("id", existingMatriculaId);
        if (updateError) throw updateError;
      }

      if (!currentMatriculaId) {
        throw new Error("ID da matrícula não foi estabelecido ou encontrado.");
      }

      await supabase
        .from("matricula_detalhes")
        .delete()
        .eq("id_matricula", currentMatriculaId);

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

      if (itensParaSalvar.length > 0) {
        const { error: itensError } = await supabase
          .from("matricula_detalhes")
          .insert(itensParaSalvar);
        if (itensError) throw itensError;
      }

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
      <Styles.SectionTitle
        style={{ marginTop: 0, fontSize: "1rem", color: Styles.COLORS.primary }}
      >
        {mode === ModalMode.CREATE
          ? "Nova Matrícula para Aluno: "
          : isEditMode
          ? "Editando Matrícula do Aluno: "
          : "Visualizando Matrícula Aluno: "}{" "}
        {alunoName}
      </Styles.SectionTitle>

      {!isViewMode && (
        <>
          <Styles.SectionTitle
            style={{ marginTop: "10px", fontSize: "0.95rem" }}
          >
            Configurar Plano (Apenas 1 plano permitido)
          </Styles.SectionTitle>
          
          <Styles.FormGroup>
            <Styles.Label>Tipo de Plano</Styles.Label>
            <Styles.Select
              value={isPlanoPersonalizado ? "personalizado" : "banco"}
              onChange={(e) => {
                const isPersonalizado = e.target.value === "personalizado";
                setIsPlanoPersonalizado(isPersonalizado);
                // Limpar seleções anteriores
                setPlanoParaAdicionarId("");
                setTurmaParaAdicionarId("");
                setPlanoPersonalizadoNome("");
                setPlanoPersonalizadoValor(0);
                setTurmasPersonalizadas([]);
                // Limpar matrícula atual
                setValue("matriculaItens", []);
              }}
            >
              <option value="banco">Plano do Sistema</option>
              <option value="personalizado">Plano Personalizado</option>
            </Styles.Select>
          </Styles.FormGroup>

          {isPlanoPersonalizado ? (
            <>
              <Styles.FormRow>
                <Styles.FormGroup>
                  <Styles.Label>Nome do Plano Personalizado</Styles.Label>
                  <Styles.Input
                    type="text"
                    value={planoPersonalizadoNome}
                    onChange={(e) => setPlanoPersonalizadoNome(e.target.value)}
                    placeholder="Ex: Plano Especial"
                  />
                </Styles.FormGroup>
                <Styles.FormGroup>
                  <Styles.Label>Valor Mensal (R$)</Styles.Label>
                  <Styles.Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={planoPersonalizadoValor}
                    onChange={(e) => setPlanoPersonalizadoValor(Number(e.target.value))}
                    placeholder="0.00"
                  />
                </Styles.FormGroup>
              </Styles.FormRow>
              
              <Styles.FormGroup>
                <Styles.Label>Selecionar Turmas</Styles.Label>
                <div style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid #ccc", padding: "10px", borderRadius: "4px" }}>
                  {todasAsTurmas.map((turma) => (
                    <div key={turma.id} style={{ marginBottom: "5px" }}>
                      <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={turmasPersonalizadas.includes(turma.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTurmasPersonalizadas(prev => [...prev, turma.id]);
                            } else {
                              setTurmasPersonalizadas(prev => prev.filter(id => id !== turma.id));
                            }
                          }}
                          style={{ marginRight: "8px" }}
                        />
                        <span>
                          {turma.nome} {turma.horarios_descricao ? `(${turma.horarios_descricao})` : ""}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </Styles.FormGroup>
            </>
          ) : (
            <>
              <Styles.FormRow>
                <Styles.FormGroup>
                  <Styles.Label>Plano disponível</Styles.Label>
                  <Styles.Select
                    value={planoParaAdicionarId}
                    onChange={(e) => {
                      setPlanoParaAdicionarId(e.target.value);
                      setTurmaParaAdicionarId("");
                    }}
                    disabled={isLoadingPlanos}
                  >
                    <option value="">
                      {isLoadingPlanos ? "Carregando..." : "Selecione um Plano"}
                    </option>
                    {planosDB.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} -{" "}
                        {Number(p.valor_mensal).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </option>
                    ))}
                  </Styles.Select>
                </Styles.FormGroup>
                <Styles.FormGroup>
                  <Styles.Label>Turma para este Plano</Styles.Label>
                  <Styles.Select
                    value={turmaParaAdicionarId}
                    onChange={(e) => setTurmaParaAdicionarId(e.target.value)}
                    disabled={isLoadingTurmasParaAdicionar || !planoParaAdicionarId}
                  >
                    <option value="">
                      {isLoadingTurmasParaAdicionar
                        ? "Carregando..."
                        : planoParaAdicionarId
                        ? "Selecione uma Turma"
                        : "Escolha um plano"}
                    </option>
                    {turmasDisponiveisParaPlano.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome}{" "}
                        {t.horarios_descricao ? `(${t.horarios_descricao})` : ""}
                      </option>
                    ))}
                  </Styles.Select>
                </Styles.FormGroup>
              </Styles.FormRow>
            </>
          )}
          
          <Styles.ActionButtonSmall
            type="button"
            onClick={handleAddMatriculaItem}
            disabled={
              isPlanoPersonalizado 
                ? (!planoPersonalizadoNome || planoPersonalizadoValor <= 0 || turmasPersonalizadas.length === 0)
                : (!planoParaAdicionarId || !turmaParaAdicionarId)
            }
            style={{ alignSelf: "flex-start", marginBottom: "15px" }}
          >
            {watchedMatriculaItens.length > 0 ? "Substituir Plano" : "Definir Plano"}
          </Styles.ActionButtonSmall>
        </>
      )}

      {(watchedMatriculaItens || []).length > 0 ? (
        <>
          <Styles.SectionTitle style={{ fontSize: "0.95rem" }}>
            Plano Configurado
          </Styles.SectionTitle>
          <Styles.MatriculaItemsList>
            {watchedMatriculaItens.map((item, index) => {
              const planoDetalhe = planosDB.find((p) => p.id === item.planoId);
              const turmaDetalhe = turmasConhecidas.get(item.turmaId);
              const isPersonalizado = item.planoId === "personalizado";
              
              return (
                <Styles.MatriculaItemCard
                  key={`${item.planoId}-${item.turmaId}-${index}`}
                >
                  <div>
                    <strong>Plano:</strong>{" "}
                    {isPersonalizado 
                      ? (item.nomePersonalizado || "Plano Personalizado")
                      : (planoDetalhe?.nome || `ID ${item.planoId}`)
                    }
                    <br />
                    <strong>Turma:</strong>{" "}
                    {turmaDetalhe?.nome || `ID Turma: ${item.turmaId}`}{" "}
                    {turmaDetalhe?.horarios_descricao
                      ? `(${turmaDetalhe.horarios_descricao})`
                      : ""}
                    <br />
                    <strong>Valor:</strong>{" "}
                    {Number(item.valorOriginalPlano).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </div>
                  {!isViewMode && (
                    <Styles.RemoveItemButton
                      type="button"
                      onClick={() => handleRemoveMatriculaItem(index)}
                    >
                      X
                    </Styles.RemoveItemButton>
                  )}
                </Styles.MatriculaItemCard>
              );
            })}
          </Styles.MatriculaItemsList>
        </>
      ) : (
        isViewMode && <p>Nenhum plano configurado para esta matrícula.</p>
      )}

      {errors.matriculaItens && (
        <Styles.ErrorMsg>
          {typeof errors.matriculaItens === "object" &&
          !Array.isArray(errors.matriculaItens) &&
          errors.matriculaItens.message
            ? errors.matriculaItens.message
            : "Configure um plano para a matrícula."}
        </Styles.ErrorMsg>
      )}

      <Styles.FormRow style={{ marginTop: "15px", alignItems: "flex-end" }}>
        <Styles.FormGroup style={{ marginBottom: 0 }}>
          <Styles.Label style={{ fontWeight: "bold" }}>
            Valor Mensal
          </Styles.Label>
          <Styles.DisplayField style={{ fontWeight: "bold", fontSize: "1rem" }}>
            {calculatedValorCobrado.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
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
