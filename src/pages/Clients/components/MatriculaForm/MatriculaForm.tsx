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

interface MatriculaFormProps {
  alunoId: string;
  alunoName: string;
  mode: ModalMode;
  onSaveComplete: (
    error: any | null,
    savedData?: Partial<MatriculaFormData & { valorCobradoFinal?: number }>
  ) => void;
  onNavigateBack: () => void;
}

const MatriculaForm: React.FC<MatriculaFormProps> = ({
  alunoId,
  alunoName,
  mode,
  onSaveComplete,
  onNavigateBack,
}) => {
  const isViewMode = mode === ModalMode.VIEW;
  const isEditMode = mode === ModalMode.EDIT;

  const [isLoadingInitialData, setIsLoadingInitialData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [planosDB, setPlanosDB] = useState<PlanoFromSupabase[]>([]);
  const [turmasDisponiveisParaPlano, setTurmasDisponiveisParaPlano] = useState<
    TurmaFromSupabase[]
  >([]);
  const [turmasConhecidas, setTurmasConhecidas] = useState<
    Map<string, TurmaFromSupabase>
  >(new Map());
  const [isLoadingPlanos, setIsLoadingPlanos] = useState(false);
  const [isLoadingTurmasParaAdicionar, setIsLoadingTurmasParaAdicionar] =
    useState(false);

  const [planoParaAdicionarId, setPlanoParaAdicionarId] = useState<string>("");
  const [turmaParaAdicionarId, setTurmaParaAdicionarId] = useState<string>("");
  const [calculatedValorCobrado, setCalculatedValorCobrado] =
    useState<number>(0);
  const [existingMatriculaId, setExistingMatriculaId] = useState<
    string | undefined
  >(undefined);
  const [displayedValorTotalBruto, setDisplayedValorTotalBruto] =
    useState<number>(0);
  const [displayedDiscountPercentage, setDisplayedDiscountPercentage] =
    useState<number>(0);

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
              `id, data_matricula, data_vencimento, status_matricula, observacoes, valor_cobrado_final, matricula_itens (plano_id, turma_id, valor_original_plano)` // Changed dia_vencimento to data_vencimento
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

            let diaVencimentoCalculado = getDefaultMatriculaValues().diaVencimento;
            if (matriculaData.data_vencimento) {
              // data_vencimento is YYYY-MM-DD. We need the day.
              // Supabase returns date strings that can be directly used to construct a Date object.
              // Ensure parsing is robust. Adding 'T00:00:00Z' makes it explicit UTC.
              try {
                const dateObj = new Date(matriculaData.data_vencimento + 'T00:00:00Z');
                if (!isNaN(dateObj.getTime())) { // Check if dateObj is valid
                  diaVencimentoCalculado = dateObj.getUTCDate();
                } else {
                  console.warn("MatriculaForm: Invalid data_vencimento received", matriculaData.data_vencimento);
                  // Fallback to default if parsing fails, though ideally this shouldn't happen with DB data
                }
              } catch (e) {
                  console.error("MatriculaForm: Error parsing data_vencimento", e);
                  // Fallback to default on error
              }
            }


            const formData: MatriculaFormData = {
              dataMatricula:
                matriculaData.data_matricula ||
                getDefaultMatriculaValues().dataMatricula,
              diaVencimento: diaVencimentoCalculado,
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
      fetchPlanosFromDB()
        .then(setPlanosDB)
        .finally(() => setIsLoadingPlanos(false));
    }
  }, [isViewMode]);

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
      setDisplayedValorTotalBruto(0); // Adicionado
      setDisplayedDiscountPercentage(0); // Adicionado
      return;
    }
    const valorTotalMensal = watchedMatriculaItens.reduce(
      (sum, item) => sum + item.valorOriginalPlano,
      0
    );
    let discountPercentage = 0;
    const numberOfItems = watchedMatriculaItens.length;
    if (numberOfItems === 2) discountPercentage = 0.05;
    else if (numberOfItems >= 3) discountPercentage = 0.1;

    const valorDoDesconto = valorTotalMensal * discountPercentage;
    const finalValue = Math.max(0, valorTotalMensal - valorDoDesconto);

    setDisplayedValorTotalBruto(valorTotalMensal); // Adicionado
    setDisplayedDiscountPercentage(discountPercentage * 100); // Adicionado (multiplica por 100 para exibir como %)
    setCalculatedValorCobrado(finalValue);
  }, [watchedMatriculaItens]);

  const handleAddMatriculaItem = useCallback(() => {
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
      const atuaisItens = getValues("matriculaItens") || [];
      if (
        !atuaisItens.find(
          (item) =>
            item.planoId === novoItem.planoId &&
            item.turmaId === novoItem.turmaId
        )
      ) {
        setValue("matriculaItens", [...atuaisItens, novoItem], {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
      setPlanoParaAdicionarId("");
      setTurmaParaAdicionarId("");
    }
  }, [
    planoParaAdicionarId,
    turmaParaAdicionarId,
    planosDB,
    getValues,
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

    const numeroDePlanos = matriculaItens.length;
    let porcentagemDeDesconto = 0;
    if (numeroDePlanos === 2) {
      porcentagemDeDesconto = 0.05;
    } else if (numeroDePlanos >= 3) {
      porcentagemDeDesconto = 0.1;
    }

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
      porcentagem_desconto: porcentagemDeDesconto,
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
        };
      });

      if (itensParaSalvar.length > 0) {
        const { error: itensError } = await supabase
          .from("matricula_detalhes")
          .insert(itensParaSalvar);
        if (itensError) throw itensError;
      }

      // Create initial record in financeiro_matricula
      if (currentMatriculaId) {
        const financeiroMatriculaPayload = {
          id_matricula: currentMatriculaId,
          id_aluno: alunoId, // prop
          vencimento: dataVencimentoFormatada, // from matriculaPrincipalPayload context
          valor_total: calculatedValorCobrado, // from state, used in matriculaPrincipalPayload
          pago: false,
          id_caixa: null, // Explicitly null, not tied to an open cashier session
        };

        const { error: financeiroError } = await supabase
          .from('financeiro_matricula')
          .insert([financeiroMatriculaPayload]);

        if (financeiroError) {
          // Log the error, but proceed with onSaveComplete for the main matricula.
          // The calling component/page can decide if this is a critical failure.
          // For now, we allow matricula to be saved even if financial record fails,
          // as this might be a recoverable situation or handled by other processes.
          console.error(
            "Erro ao criar registro financeiro inicial da matrícula:",
            financeiroError
          );
          // Optionally, you could pass this error information along:
          // onSaveComplete({ ...error, financeiroError }, formData);
          // For now, we stick to the original error handling for onSaveComplete.
        } else {
          console.log("Registro financeiro inicial da matrícula criado com sucesso.", financeiroMatriculaPayload);
        }
      } else {
        console.warn("currentMatriculaId não definido, não foi possível criar o registro financeiro inicial.");
      }

      onSaveComplete(null, {
        ...formData,
      });
    } catch (error: any) {
      console.error("Erro ao salvar matrícula ou registro financeiro no Supabase:", error);
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
            Adicionar Plano e Turma
          </Styles.SectionTitle>
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
                {planosDB.map(
                  (p) =>
                    !(getValues("matriculaItens") || []).find(
                      (item) => item.planoId === p.id
                    ) && (
                      <option key={p.id} value={p.id}>
                        {p.nome} -{" "}
                        {Number(p.valor_mensal).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </option>
                    )
                )}
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
          <Styles.ActionButtonSmall
            type="button"
            onClick={handleAddMatriculaItem}
            disabled={!planoParaAdicionarId || !turmaParaAdicionarId}
            style={{ alignSelf: "flex-start", marginBottom: "15px" }}
          >
            Adicionar Item à Matrícula
          </Styles.ActionButtonSmall>
        </>
      )}

      {(watchedMatriculaItens || []).length > 0 ? (
        <>
          <Styles.SectionTitle style={{ fontSize: "0.95rem" }}>
            Itens da Matrícula Adicionados
          </Styles.SectionTitle>
          <Styles.MatriculaItemsList>
            {watchedMatriculaItens.map((item, index) => {
              const planoDetalhe = planosDB.find((p) => p.id === item.planoId);
              const turmaDetalhe = turmasConhecidas.get(item.turmaId);
              return (
                <Styles.MatriculaItemCard
                  key={`${item.planoId}-${item.turmaId}-${index}`}
                >
                  <div>
                    <strong>Plano:</strong>{" "}
                    {planoDetalhe?.nome || `ID ${item.planoId}`}
                    <br />
                    <strong>Turma:</strong>{" "}
                    {turmaDetalhe?.nome || `ID Turma: ${item.turmaId}`}{" "}
                    {turmaDetalhe?.horarios_descricao
                      ? `(${turmaDetalhe.horarios_descricao})`
                      : ""}
                    <br />
                    <strong>Valor Original:</strong>{" "}
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
        isViewMode && <p>Nenhum item de matrícula encontrado.</p>
      )}

      {errors.matriculaItens && (
        <Styles.ErrorMsg>
          {typeof errors.matriculaItens === "object" &&
          !Array.isArray(errors.matriculaItens) &&
          errors.matriculaItens.message
            ? errors.matriculaItens.message
            : "Adicione pelo menos um plano e turma à matrícula."}
        </Styles.ErrorMsg>
      )}

      <Styles.FormRow style={{ marginTop: "15px", alignItems: "flex-end" }}>
        {" "}
        {/* alignItems para alinhar a base se as alturas dos labels variarem */}
        <Styles.FormGroup style={{ marginBottom: 0 }}>
          {" "}
          {/* Remove margem inferior para melhor alinhamento na linha */}
          <Styles.Label>Valor Original</Styles.Label>
          <Styles.DisplayField>
            {displayedValorTotalBruto.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </Styles.DisplayField>
        </Styles.FormGroup>
        <Styles.FormGroup style={{ marginBottom: 0 }}>
          <Styles.Label>Desconto Aplicado</Styles.Label>
          <Styles.DisplayField>
            {displayedDiscountPercentage.toFixed(0)}%
          </Styles.DisplayField>
        </Styles.FormGroup>
        <Styles.FormGroup style={{ marginBottom: 0 }}>
          <Styles.Label style={{ fontWeight: "bold" }}>
            Valor Final
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
            type="button"
            onClick={onNavigateBack}
            style={{ backgroundColor: Styles.COLORS.textMuted, order: 1 }}
          >
            Dados Cadastrais
          </Styles.SubmitButton>
          <Styles.SubmitButton
            type="submit"
            disabled={isSubmitting}
            style={{ order: 2 }}
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
