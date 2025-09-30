import { useState, useCallback, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { toast } from "react-toastify";
import { fetchHomePageSummaryData, ClienteAtivoSummary } from "../services/homeServices";

export interface ActiveCaixaDetails {
  id: string | null;
}

export const useHomeSummary = (currentUser: User | null) => {
  const [onSummaryLoading, setSummaryLoading] = useState<boolean>(true);
  const [clientsActiveSummary, setClientsActiveSummary] = useState<ClienteAtivoSummary[]>([]);
  const [totalEntradasCaixaAberto, setTotalEntradasCaixaAberto] = useState<number>(0);
  const [totalSaidasCaixaAberto, setTotalSaidasCaixaAberto] = useState<number>(0);
  const [activeCaixaDetails, setActiveCaixaDetails] = useState<ActiveCaixaDetails>({ id: null });

  const loadSummaryData = useCallback(async (caixaId?: string | null) => {
    if (!currentUser) {
      setSummaryLoading(false);
      return;
    }

    setSummaryLoading(true);
    try {
      const data = await fetchHomePageSummaryData(caixaId);
      setClientsActiveSummary(data.clientsActiveSummary);
      setTotalEntradasCaixaAberto(data.totalEntradasCaixaAberto);
      setTotalSaidasCaixaAberto(data.totalSaidasCaixaAberto);
    } catch (error) {
      toast.error("Erro ao carregar dados do resumo.");
      setClientsActiveSummary([]);
      setTotalEntradasCaixaAberto(0);
      setTotalSaidasCaixaAberto(0);
    } finally {
      setSummaryLoading(false);
    }
  }, [currentUser]);

  const handleActiveCaixaUpdate = useCallback((updatedCaixa: any | null) => {
    setActiveCaixaDetails({ id: updatedCaixa?.id || null });
  }, []);

  const handleRequestSummaryRefresh = useCallback(() => {
    if (currentUser) {
      loadSummaryData(activeCaixaDetails.id);
    }
  }, [currentUser, activeCaixaDetails.id, loadSummaryData]);

  useEffect(() => {
    if (currentUser) {
      loadSummaryData(activeCaixaDetails.id);
    } else {
      setClientsActiveSummary([]);
      setTotalEntradasCaixaAberto(0);
      setTotalSaidasCaixaAberto(0);
      setSummaryLoading(false);
    }
  }, [currentUser, activeCaixaDetails.id, loadSummaryData]);

  return {
    onSummaryLoading,
    clientsActiveSummary,
    totalEntradasCaixaAberto,
    totalSaidasCaixaAberto,
    activeCaixaDetails,
    handleActiveCaixaUpdate,
    handleRequestSummaryRefresh,
  };
};