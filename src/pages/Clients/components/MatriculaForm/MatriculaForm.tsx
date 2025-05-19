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
        .from('planos')
        .select('id, nome, valor_mensal, modalidade_id');
    if (error) {
        console.error("MatriculaForm: Erro ao buscar planos:", error.message);
        return [];
    }
    return data || [];
}

async function fetchTurmasByIds(turmaIds: string[]): Promise<TurmaFromSupabase[]> {
    if (!turmaIds || turmaIds.length === 0) return [];
    const { data, error } = await supabase
        .from('turmas')
        .select('id, nome, horarios_descricao, modalidade_id')
        .in('id', turmaIds);
    if (error) {
        console.error("MatriculaForm: Erro ao buscar detalhes das turmas:", error.message);
        return [];
    }
    return data || [];
}

async function fetchTurmasByModalidadeId(modalidadeId?: string | null): Promise<TurmaFromSupabase[]> {
    if (!modalidadeId) return [];
    const { data, error } = await supabase
        .from('turmas')
        .select('id, nome, horarios_descricao, modalidade_id')
        .eq('modalidade_id', modalidadeId);
    if (error) {
        console.error("MatriculaForm: Erro ao buscar turmas por modalidade:", error.message);
        return [];
    }
    return data || [];
}

interface MatriculaFormProps {
    alunoId: string;
    alunoName: string;
    mode: ModalMode;
    onSaveComplete: (error: any | null, savedData?: Partial<MatriculaFormData & { valorCobradoFinal?: number }>) => void;
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
    const [turmasDisponiveisParaPlano, setTurmasDisponiveisParaPlano] = useState<TurmaFromSupabase[]>([]);
    const [turmasConhecidas, setTurmasConhecidas] = useState<Map<string, TurmaFromSupabase>>(new Map());
    const [isLoadingPlanos, setIsLoadingPlanos] = useState(false);
    const [isLoadingTurmasParaAdicionar, setIsLoadingTurmasParaAdicionar] = useState(false);

    const [planoParaAdicionarId, setPlanoParaAdicionarId] = useState<string>("");
    const [turmaParaAdicionarId, setTurmaParaAdicionarId] = useState<string>("");
    const [calculatedValorCobrado, setCalculatedValorCobrado] = useState<number>(0);
    const [existingMatriculaId, setExistingMatriculaId] = useState<string | undefined>(undefined);

    const getDefaultMatriculaValues = useCallback(() => {
        const hoje = new Date();
        return {
            matriculaItens: [],
            dataMatricula: hoje.toISOString().split('T')[0],
            diaVencimento: hoje.getDate(),
            statusMatricula: 'ativa' as 'ativa' | 'inativa',
            observacoesMatricula: '',
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
        defaultValues: getDefaultMatriculaValues()
    });

    const watchedMatriculaItens = watch("matriculaItens", []);

    const updateTurmasConhecidas = useCallback((turmas: TurmaFromSupabase[]) => {
        setTurmasConhecidas(prevMap => {
            const newMap = new Map(prevMap);
            turmas.forEach(turma => newMap.set(turma.id, turma));
            return newMap;
        });
    }, []);

    useEffect(() => {
        const loadMatriculaData = async () => {
            if ((mode === ModalMode.VIEW || mode === ModalMode.EDIT) && alunoId) {
                setIsLoadingInitialData(true);
                try {
                    const { data: matriculaData, error: matriculaError } = await supabase
                        .from('matriculas')
                        .select(`id, data_matricula, dia_vencimento, status_matricula, observacoes, valor_cobrado_final, matricula_itens (plano_id, turma_id, valor_original_plano)`)
                        .eq('aluno_id', alunoId)
                        .eq('ativo_atual', true)
                        .maybeSingle();

                    if (matriculaError) throw matriculaError;

                    if (matriculaData) {
                        const mappedItens = (matriculaData.matricula_itens || []).map((item: any) => ({
                            planoId: item.plano_id,
                            turmaId: item.turma_id,
                            valorOriginalPlano: item.valor_original_plano,
                        }));

                        const formData: MatriculaFormData = {
                            dataMatricula: matriculaData.data_matricula || getDefaultMatriculaValues().dataMatricula,
                            diaVencimento: matriculaData.dia_vencimento ?? getDefaultMatriculaValues().diaVencimento,
                            statusMatricula: (matriculaData.status_matricula as MatriculaFormData['statusMatricula']) || 'ativa',
                            observacoesMatricula: matriculaData.observacoes || '',
                            matriculaItens: mappedItens,
                        };
                        reset(formData);
                        setExistingMatriculaId(matriculaData.id);
                        setCalculatedValorCobrado(matriculaData.valor_cobrado_final || 0);

                        if (mappedItens.length > 0) {
                            const turmaIds = [...new Set(mappedItens.map(item => item.turmaId).filter(Boolean))];
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
            fetchPlanosFromDB().then(setPlanosDB).finally(() => setIsLoadingPlanos(false));
        }
    }, [isViewMode]);

    useEffect(() => {
        if (planoParaAdicionarId && planosDB.length > 0) {
            const planoSelecionado = planosDB.find(p => p.id === planoParaAdicionarId);
            if (planoSelecionado && planoSelecionado.modalidade_id) {
                setIsLoadingTurmasParaAdicionar(true);
                fetchTurmasByModalidadeId(planoSelecionado.modalidade_id)
                    .then(turmas => {
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
        const valorTotalMensal = watchedMatriculaItens.reduce((sum, item) => sum + item.valorOriginalPlano, 0);
        let discountPercentage = 0;
        const numberOfItems = watchedMatriculaItens.length;
        if (numberOfItems === 2) discountPercentage = 0.05;
        else if (numberOfItems >= 3) discountPercentage = 0.10;

        const valorDoDesconto = valorTotalMensal * discountPercentage;
        const finalValue = Math.max(0, valorTotalMensal - valorDoDesconto);
        setCalculatedValorCobrado(finalValue);
    }, [watchedMatriculaItens]);

    const handleAddMatriculaItem = useCallback(() => {
        if (planoParaAdicionarId && turmaParaAdicionarId) {
            const planoSelecionado = planosDB.find(p => p.id === planoParaAdicionarId);
            if (!planoSelecionado) return;
            const novoItem: MatriculaItem = {
                planoId: planoSelecionado.id,
                turmaId: turmaParaAdicionarId,
                valorOriginalPlano: planoSelecionado.valor_mensal,
            };
            const atuaisItens = getValues("matriculaItens") || [];
            if (!atuaisItens.find(item => item.planoId === novoItem.planoId && item.turmaId === novoItem.turmaId)) {
                setValue("matriculaItens", [...atuaisItens, novoItem], { shouldValidate: true, shouldDirty: true });
            }
            setPlanoParaAdicionarId("");
            setTurmaParaAdicionarId("");
        }
    }, [planoParaAdicionarId, turmaParaAdicionarId, planosDB, getValues, setValue]);

    const handleRemoveMatriculaItem = useCallback((indexToRemove: number) => {
        const atuaisItens = getValues("matriculaItens") || [];
        setValue("matriculaItens", atuaisItens.filter((_, index) => index !== indexToRemove), { shouldValidate: true, shouldDirty: true });
    }, [getValues, setValue]);

    const onSubmit: SubmitHandler<MatriculaFormData> = async (formData) => {
        if (isViewMode) return;
        setIsSubmitting(true);

        const { matriculaItens, ...matriculaPrincipalData } = formData;

        const matriculaSupabasePayload = {
            aluno_id: alunoId,
            data_matricula: matriculaPrincipalData.dataMatricula,
            dia_vencimento: matriculaPrincipalData.diaVencimento,
            status_matricula: matriculaPrincipalData.statusMatricula,
            observacoes: matriculaPrincipalData.observacoesMatricula,
            valor_cobrado_final: calculatedValorCobrado,
            ativo_atual: true,
        };

        try {
            let currentMatriculaId = existingMatriculaId;

            if (mode === ModalMode.CREATE || !existingMatriculaId) {
                await supabase.from('matriculas').update({ ativo_atual: false }).eq('aluno_id', alunoId).eq('ativo_atual', true);
                const { data: newMatricula, error } = await supabase
                    .from('matriculas')
                    .insert(matriculaSupabasePayload)
                    .select('id')
                    .single();
                if (error) throw error;
                currentMatriculaId = newMatricula.id;
            } else {
                const { error } = await supabase
                    .from('matriculas')
                    .update(matriculaSupabasePayload)
                    .eq('id', existingMatriculaId);
                if (error) throw error;
            }

            if (!currentMatriculaId) throw new Error("ID da matrícula não foi estabelecido.");

            await supabase.from('matricula_itens').delete().eq('matricula_id', currentMatriculaId);

            const itensParaSalvar = matriculaItens.map(item => ({
                matricula_id: currentMatriculaId,
                plano_id: item.planoId,
                turma_id: item.turmaId,
                valor_original_plano: item.valorOriginalPlano,
            }));

            if (itensParaSalvar.length > 0) {
                const { error: itensError } = await supabase.from('matricula_itens').insert(itensParaSalvar);
                if (itensError) throw itensError;
            }

            onSaveComplete(null, { ...formData, valorCobradoFinal: calculatedValorCobrado });
        } catch (error: any) {
            console.error("Erro ao salvar matrícula no Supabase:", error);
            onSaveComplete(error, undefined);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingInitialData && (isEditMode || isViewMode)) {
        return <div style={{ padding: '20px', textAlign: 'center' }}><Loader /> Carregando dados da matrícula...</div>;
    }

    return (
        //@ts-expect-error
        <Styles.Form onSubmit={handleSubmit(onSubmit)}>
            <Styles.SectionTitle style={{ marginTop: 0, fontSize: '1rem', color: Styles.COLORS.primary }}>
                {mode === ModalMode.CREATE ? "Nova Matrícula para Aluno: " : (isEditMode ? "Editando Matrícula do Aluno: " : "Visualizando Matrícula Aluno: ")} {alunoName}
            </Styles.SectionTitle>

            {!isViewMode && (
                <>
                    <Styles.SectionTitle style={{ marginTop: '10px', fontSize: '0.95rem' }}>Adicionar Plano e Turma</Styles.SectionTitle>
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
                                <option value="">{isLoadingPlanos ? "Carregando..." : "Selecione um Plano"}</option>
                                {planosDB.map(p => (
                                    !(getValues("matriculaItens") || []).find(item => item.planoId === p.id) &&
                                    <option key={p.id} value={p.id}>{p.nome} - {Number(p.valor_mensal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</option>
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
                                <option value="">{isLoadingTurmasParaAdicionar ? "Carregando..." : (planoParaAdicionarId ? "Selecione uma Turma" : "Escolha um plano")}</option>
                                {turmasDisponiveisParaPlano.map(t => (
                                    <option key={t.id} value={t.id}>{t.nome} {t.horarios_descricao ? `(${t.horarios_descricao})` : ''}</option>
                                ))}
                            </Styles.Select>
                        </Styles.FormGroup>
                    </Styles.FormRow>
                    <Styles.ActionButtonSmall
                        type="button"
                        onClick={handleAddMatriculaItem}
                        disabled={!planoParaAdicionarId || !turmaParaAdicionarId}
                        style={{ alignSelf: 'flex-start', marginBottom: '15px' }}
                    >
                        Adicionar Item à Matrícula
                    </Styles.ActionButtonSmall>
                </>
            )}

            {(watchedMatriculaItens || []).length > 0 ? (
                <>
                    <Styles.SectionTitle style={{ fontSize: '0.95rem' }}>Itens da Matrícula Adicionados</Styles.SectionTitle>
                    <Styles.MatriculaItemsList>
                        {(watchedMatriculaItens).map((item, index) => {
                            const planoDetalhe = planosDB.find(p => p.id === item.planoId);
                            const turmaDetalhe = turmasConhecidas.get(item.turmaId);
                            return (
                                <Styles.MatriculaItemCard key={`${item.planoId}-${item.turmaId}-${index}`}>
                                    <div>
                                        <strong>Plano:</strong> {planoDetalhe?.nome || `ID ${item.planoId}`}<br />
                                        <strong>Turma:</strong> {turmaDetalhe?.nome || `ID Turma: ${item.turmaId}`} {turmaDetalhe?.horarios_descricao ? `(${turmaDetalhe.horarios_descricao})` : ''}<br />
                                        <strong>Valor Original:</strong> {Number(item.valorOriginalPlano).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </div>
                                    {!isViewMode && (
                                        <Styles.RemoveItemButton type="button" onClick={() => handleRemoveMatriculaItem(index)}>
                                            X
                                        </Styles.RemoveItemButton>
                                    )}
                                </Styles.MatriculaItemCard>
                            );
                        })}
                    </Styles.MatriculaItemsList>
                </>
            ) : (isViewMode && <p>Nenhum item de matrícula encontrado.</p>)}

            {errors.matriculaItens && (
                <Styles.ErrorMsg>
                    {typeof errors.matriculaItens === 'object' && !Array.isArray(errors.matriculaItens) && errors.matriculaItens.message
                        ? errors.matriculaItens.message
                        : "Adicione pelo menos um plano e turma à matrícula."}
                </Styles.ErrorMsg>
            )}


            <Styles.FormGroup style={{ marginTop: '15px' }}>
                <Styles.Label>Valor Total Calculado</Styles.Label>
                <Styles.DisplayField>
                    {calculatedValorCobrado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Styles.DisplayField>
            </Styles.FormGroup>

            <Styles.FormRow>
                <Styles.FormGroup>
                    <Styles.Label>Data da Matrícula (Automática)</Styles.Label>
                    <Styles.Input type="date" {...register("dataMatricula")} readOnly disabled={isViewMode} />
                    {errors.dataMatricula && <Styles.ErrorMsg>{errors.dataMatricula.message}</Styles.ErrorMsg>}
                </Styles.FormGroup>
                <Styles.FormGroup>
                    <Styles.Label>Dia Vencimento (Automático)</Styles.Label>
                    <Styles.Input type="number" {...register("diaVencimento")} readOnly disabled={isViewMode} />
                    {errors.diaVencimento && <Styles.ErrorMsg>{errors.diaVencimento.message}</Styles.ErrorMsg>}
                </Styles.FormGroup>
            </Styles.FormRow>
            <Styles.FormGroup>
                <Styles.Label>Status</Styles.Label>
                <Styles.Select {...register("statusMatricula")} disabled={isViewMode}>
                    <option value="ativa">Ativa</option>
                    <option value="inativa">Inativa</option>
                </Styles.Select>
                {errors.statusMatricula && <Styles.ErrorMsg>{errors.statusMatricula.message}</Styles.ErrorMsg>}
            </Styles.FormGroup>
            <Styles.FormGroup>
                <Styles.Label>Observações</Styles.Label>
                <Styles.Textarea {...register("observacoesMatricula")} rows={3} disabled={isViewMode} />
                {errors.observacoesMatricula && <Styles.ErrorMsg>{errors.observacoesMatricula.message}</Styles.ErrorMsg>}
            </Styles.FormGroup>

            {!isViewMode && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', alignItems: 'center' }}>
                    <Styles.SubmitButton type="button" onClick={onNavigateBack} style={{ backgroundColor: Styles.COLORS.textMuted, order: 1 }}>
                        Voltar Dados Cadastrais
                    </Styles.SubmitButton>
                    <Styles.SubmitButton type="submit" disabled={isSubmitting} style={{ order: 2 }}>
                        {isSubmitting ? <Loader /> : (isEditMode && existingMatriculaId ? "Atualizar Matrícula" : "Salvar Matrícula")}
                    </Styles.SubmitButton>
                </div>
            )}
        </Styles.Form>
    );
};

export default MatriculaForm;