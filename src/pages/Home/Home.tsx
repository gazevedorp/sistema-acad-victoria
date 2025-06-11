import React, { useEffect, useState, useCallback } from "react";
import * as Styles from "./Home.styles";
import { supabase } from "../../lib/supabase";
import { User } from "@supabase/supabase-js";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SummarySection from "./components/SummarySection/SummarySection";
import StudentsSection from "./components/StudentsSection/StudentsSection";
import CashierSection, { ActiveCaixa as CashierActiveCaixa } from "./components/CashierSection/CashierSection";

// --- TYPE DEFINITIONS ---

interface MovimentacaoCaixaAtivoSummary { // This is for summary, so it stays
  tipo: string;
  valor: number;
}

// ActiveCaixa type is now imported from CashierSection if needed, or defined locally for summary state
// For summary, we only need the ID to pass to fetchHomePageSummaryData.
interface HomeActiveCaixaDetails {
  id: string | null;
}

const Home: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [onSummaryLoading, setSummaryLoading] = useState<boolean>(true);
  const [clientsActiveSummary, setClientsActiveSummary] = useState<{ id: string; ativo: boolean }[]>([]);
  const [totalEntradasCaixaAberto, setTotalEntradasCaixaAberto] = useState<number>(0);
  const [totalSaidasCaixaAberto, setTotalSaidasCaixaAberto] = useState<number>(0);

  // State to hold active caixa details relevant for Home (e.g., for summary)
  // This will be updated by a callback from CashierSection
  const [homeActiveCaixaDetails, setHomeActiveCaixaDetails] = useState<HomeActiveCaixaDetails>({ id: null });

  const fetchHomePageSummaryData = useCallback(async (userId?: string, caixaId?: string | null) => {
    setSummaryLoading(true);
    try {
      const fetchActiveStudentsPromise = supabase.from("alunos").select("id, ativo").eq("ativo", true);
    finally { setSummaryLoading(false); }
  }, [supabase]); // Added supabase dependency

  // All Caixa related callbacks and useEffects MOVED to CashierSection:
  // - checkUserAndActiveCaixaCallback
  // - fetchCaixaMovimentacoesCallback
  // - fetchDadosParaCaixaSelectsCallback
  // - handleNovaMovimentacaoClick and modal close handlers
  // - handleAbrirCaixa, handleSaveMovimentacao, generatePDFFechamentoCaixa, handleConfirmarFechamentoCaixa
  // - adjustCaixaSearchString, filteredCaixaMovimentacoes, currentCaixaTableData
  // - useEffects for loading user, caixa details, movimentacoes, select data

  // Callback for CashierSection to update Home's knowledge of active caixa
  const handleActiveCaixaUpdate = useCallback((updatedCaixa: CashierActiveCaixa | null) => {
    setHomeActiveCaixaDetails({ id: updatedCaixa?.id || null });
    // Summary will be re-fetched via useEffect dependency on homeActiveCaixaDetails.id or currentUser
  }, []);

  // Callback for CashierSection to request a summary refresh
  const handleRequestSummaryRefresh = useCallback(() => {
    if (currentUser) { // Only refresh if user is available
      fetchHomePageSummaryData(currentUser.id, homeActiveCaixaDetails.id);
    }
  }, [currentUser, homeActiveCaixaDetails.id, fetchHomePageSummaryData]);


  useEffect(() => {
    const loadInitialUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      // Initial check for active caixa is now handled by CashierSection's own useEffect.
      // Home will receive updates via handleActiveCaixaUpdate.
    };
    loadInitialUser();
  }, [supabase]); // Added supabase dependency

  useEffect(() => {
    // Fetch summary data when currentUser or the relevant part of homeActiveCaixaDetails (its ID) changes.
    if (currentUser) {
      fetchHomePageSummaryData(currentUser.id, homeActiveCaixaDetails.id);
    } else {
      // If no user, clear summary data or set to default state
      setClientsActiveSummary([]);
      setTotalEntradasCaixaAberto(0);
      setTotalSaidasCaixaAberto(0);
      setSummaryLoading(false); // Stop loading if no user
    }
  }, [currentUser, homeActiveCaixaDetails.id, fetchHomePageSummaryData]);


  return (
    <Styles.Container>
      <SummarySection
        clientsActiveSummary={clientsActiveSummary}
        totalEntradasCaixaAberto={totalEntradasCaixaAberto}
        totalSaidasCaixaAberto={totalSaidasCaixaAberto}
        onSummaryLoading={onSummaryLoading}
      />
      <StudentsSection />
      <CashierSection
        currentUser={currentUser}
        onActiveCaixaUpdate={handleActiveCaixaUpdate}
        onRequestSummaryRefresh={handleRequestSummaryRefresh}
      />
      {/* All Modals (AbrirCaixaModal, CaixaModal, FecharCaixaModal) are now inside CashierSection */}
      <ToastContainer autoClose={3000} hideProgressBar/>
    </Styles.Container>
  );
};
export default Home;
