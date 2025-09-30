import { useState, useCallback, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { toast } from "react-toastify";
import {
  ActiveCaixa,
  AlunoParaSelect,
  ProdutoParaSelect,
  checkActiveCaixa,
  fetchCaixaSelectsData,
  abrirCaixa,
  saveMovimentacao,
  fecharCaixa,
} from "../services/homeServices";

export const useCashier = (
  currentUser: User | null,
  onActiveCaixaUpdate: (activeCaixa: ActiveCaixa | null) => void,
  onRequestSummaryRefresh: () => void
) => {
  const [activeCaixaDetails, setActiveCaixaDetails] = useState<ActiveCaixa | null>(null);
  const [alunosListCaixa, setAlunosListCaixa] = useState<AlunoParaSelect[]>([]);
  const [produtosListCaixa, setProdutosListCaixa] = useState<ProdutoParaSelect[]>([]);
  const [isLoadingCaixaSelectData, setIsLoadingCaixaSelectData] = useState(false);
  const [isSubmittingCaixaAction, setIsSubmittingCaixaAction] = useState(false);

  const loadActiveCaixa = useCallback(async (user: User | null) => {
    if (!user) {
      setActiveCaixaDetails(null);
      onActiveCaixaUpdate(null);
      return;
    }

    try {
      const caixa = await checkActiveCaixa(user.id);
      setActiveCaixaDetails(caixa);
      onActiveCaixaUpdate(caixa);
    } catch (error) {
      toast.error("Erro ao verificar status do caixa.");
      console.error("Error checking active caixa:", error);
      setActiveCaixaDetails(null);
      onActiveCaixaUpdate(null);
    }
  }, [onActiveCaixaUpdate]);

  const loadCaixaSelectsData = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoadingCaixaSelectData(true);
    try {
      const data = await fetchCaixaSelectsData();
      setAlunosListCaixa(data.alunos);
      setProdutosListCaixa(data.produtos);
    } catch (error: any) {
      toast.error("Falha ao carregar dados para os selects do caixa: " + error.message);
    } finally {
      setIsLoadingCaixaSelectData(false);
    }
  }, [currentUser]);

  const handleAbrirCaixa = useCallback(async (formData: { valor_inicial: number; observacoes?: string }) => {
    if (!currentUser) {
      toast.warn("Usuário não autenticado.");
      return;
    }

    setIsSubmittingCaixaAction(true);
    try {
      const novoCaixa = await abrirCaixa(
        currentUser.id,
        formData.valor_inicial,
        formData.observacoes
      );

      setActiveCaixaDetails(novoCaixa);
      onActiveCaixaUpdate(novoCaixa);
      toast.success("Caixa aberto com sucesso!");
      onRequestSummaryRefresh();
    } catch (error: any) {
      toast.error("Erro ao abrir caixa: " + error.message);
    } finally {
      setIsSubmittingCaixaAction(false);
    }
  }, [currentUser, onActiveCaixaUpdate, onRequestSummaryRefresh]);

  const handleSaveMovimentacao = useCallback(async (data: {
    tipo: string;
    forma_pagamento: string;
    valor: number;
    descricao?: string;
    cliente_id?: string;
    produto_id?: string;
  }) => {
    if (!activeCaixaDetails || !currentUser) {
      toast.error("Caixa não ativo ou usuário não autenticado.");
      return;
    }

    setIsSubmittingCaixaAction(true);
    try {
      await saveMovimentacao(activeCaixaDetails.id, data);
      toast.success("Movimentação salva com sucesso!");
      onRequestSummaryRefresh();
    } catch (error: any) {
      toast.error("Erro ao salvar movimentação: " + error.message);
    } finally {
      setIsSubmittingCaixaAction(false);
    }
  }, [activeCaixaDetails, currentUser, onRequestSummaryRefresh]);

  const handleFecharCaixa = useCallback(async (observacoesFechamento?: string) => {
    if (!activeCaixaDetails || !currentUser) {
      toast.error("Caixa não ativo ou usuário não autenticado.");
      return null;
    }

    setIsSubmittingCaixaAction(true);
    try {
      const result = await fecharCaixa(activeCaixaDetails.id, observacoesFechamento);
      
      setActiveCaixaDetails(null);
      onActiveCaixaUpdate(null);
      toast.success("Caixa fechado com sucesso!");
      onRequestSummaryRefresh();
      
      return result;
    } catch (error: any) {
      toast.error("Erro ao fechar caixa: " + error.message);
      return null;
    } finally {
      setIsSubmittingCaixaAction(false);
    }
  }, [activeCaixaDetails, currentUser, onActiveCaixaUpdate, onRequestSummaryRefresh]);

  useEffect(() => {
    loadActiveCaixa(currentUser);
  }, [currentUser, loadActiveCaixa]);

  return {
    activeCaixaDetails,
    alunosListCaixa,
    produtosListCaixa,
    isLoadingCaixaSelectData,
    isSubmittingCaixaAction,
    loadCaixaSelectsData,
    handleAbrirCaixa,
    handleSaveMovimentacao,
    handleFecharCaixa,
  };
};