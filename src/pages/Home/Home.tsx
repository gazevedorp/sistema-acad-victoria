import React, { useEffect, useState, useCallback } from "react";
import * as Styles from "./Home.styles";
import { TopContentContainer, SummaryArea, CashierActionsArea } from "./Home.styles"; // Import new layout components
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
      // Fetch active students
      const fetchActiveStudentsPromise = supabase
        .from("alunos")
        .select("id, ativo")
        .eq("ativo", true);

      // Fetch financial data only if caixaId is present
      let fetchFinanceiroPromise;
      if (caixaId) {
        fetchFinanceiroPromise = supabase
          .from("financeiro")
          .select("tipo, valor")
          .eq("caixa_id", caixaId);
      } else {
        // Resolve with empty data if no caixaId, to maintain Promise.all structure
        fetchFinanceiroPromise = Promise.resolve({ data: [], error: null });
      }

      const [activeStudentsRes, financeiroRes] = await Promise.all([
        fetchActiveStudentsPromise,
        fetchFinanceiroPromise,
      ]);

      if (activeStudentsRes.error) {
        console.error("Erro ao buscar resumo de alunos ativos:", activeStudentsRes.error.message);
        toast.error("Erro ao buscar resumo de alunos ativos.");
        setClientsActiveSummary([]); // Clear or set to default on error
      } else if (activeStudentsRes.data) {
        setClientsActiveSummary(activeStudentsRes.data as { id: string; ativo: boolean }[]);
      }

      if (financeiroRes.error) {
        console.error("Erro ao buscar resumo financeiro do caixa:", financeiroRes.error.message);
        // Don't toast an error here if it's just because caixaId was null
        if (caixaId) { // Only toast if there was an actual attempt to fetch with a caixaId
            toast.error("Erro ao buscar resumo financeiro do caixa.");
        }
        setTotalEntradasCaixaAberto(0);
        setTotalSaidasCaixaAberto(0);
      } else if (financeiroRes.data && caixaId) { // Ensure caixaId was present for this logic
        const movs = financeiroRes.data as MovimentacaoCaixaAtivoSummary[];
        let ent = 0;
        let sai = 0;
        movs.forEach((m) => {
          if (m.tipo === "pagamento" || m.tipo === "venda") {
            ent += m.valor;
          } else if (m.tipo === "saida") {
            sai += m.valor;
          }
        });
        setTotalEntradasCaixaAberto(ent);
        setTotalSaidasCaixaAberto(sai);
      } else {
        // If no caixaId or no data, set totals to 0
        setTotalEntradasCaixaAberto(0);
        setTotalSaidasCaixaAberto(0);
      }
    } catch (err: any) {
      console.error("Erro inesperado ao buscar dados para o sumário da home:", err);
      toast.error("Erro inesperado ao buscar dados para o sumário.");
      setClientsActiveSummary([]);
      setTotalEntradasCaixaAberto(0);
      setTotalSaidasCaixaAberto(0);
    } finally {
      setSummaryLoading(false);
    }
  }, [supabase]); // supabase is a dependency of useCallback

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
      <TopContentContainer>
        <SummaryArea>
          <SummarySection
            clientsActiveSummary={clientsActiveSummary}
            totalEntradasCaixaAberto={totalEntradasCaixaAberto}
            totalSaidasCaixaAberto={totalSaidasCaixaAberto}
            onSummaryLoading={onSummaryLoading}
          />
        </SummaryArea>
        <CashierActionsArea>
          <CashierSection
            currentUser={currentUser}
            onActiveCaixaUpdate={handleActiveCaixaUpdate}
            onRequestSummaryRefresh={handleRequestSummaryRefresh}
          />
        </CashierActionsArea>
      </TopContentContainer>

      <StudentsSection />

      <ToastContainer autoClose={3000} hideProgressBar/>
    </Styles.Container>
  );
};
export default Home;
