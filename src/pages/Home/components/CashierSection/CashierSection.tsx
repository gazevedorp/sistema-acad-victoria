import React, { useEffect, useState, useCallback } from "react";
import * as Styles from "./CashierSection.styles"; // Styles for this section
import { supabase } from "../../../../lib/supabase";
import { User } from "@supabase/supabase-js";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import Loader from "../../../../components/Loader/Loader";
import DefaultTable, { TableColumn } from "../../../../components/Table/DefaultTable";
import { FiPlus } from "react-icons/fi"; // For the "Nova Movimentacao" button

import CaixaModal from "../../../Caixa/components/CaixaModal/CaixaModal";
import {
  CaixaModalFormData,
  AlunoParaSelect,
  ProdutoParaSelect,
  FormaPagamentoParaSelect,
} from "../../../Caixa/components/CaixaModal/CaixaModal.definitions";
import AbrirCaixaModal from "../../../Caixa/components/AbrirCaixaModal/AbrirCaixaModal";
import { AbrirCaixaFormData } from "../../../Caixa/components/AbrirCaixaModal/AbrirCaixaModal.definitions";
import FecharCaixaModal from "../../../Caixa/components/FecharCaixaModal/FecharCaixaModal";
import { FecharCaixaFormData } from "../../../Caixa/components/FecharCaixaModal/FecharCaixaModal.definitions";
import { Client } from "../../../../types/ClientTypes"; // For AlunoParaSelect if it uses Client type directly

// --- TYPE DEFINITIONS (Copied from Home.tsx, can be refined or moved to specific type files later) ---
export interface ActiveCaixa { // Exporting if Home needs this type for its state
  id: string;
  usuario_id: string;
  valor_inicial: number;
  data_abertura: string;
  observacoes_abertura?: string | null;
  data_fechamento?: string;
  valor_total_entradas?: number;
  valor_total_saidas?: number;
  saldo_final_calculado?: number;
}

interface FinanceiroItem {
  id: string;
  created_at: string;
  tipo: string;
  forma_pagamento: string;
  valor: number;
  descricao?: string;
  cliente_id?: string;
  produto_id?: string;
  caixa_id?: string;
  cliente_nome?: string;
  produto_nome?: string;
}

// --- CONSTANTS ---
const financeTableColumns: TableColumn<FinanceiroItem>[] = [
  { field: "created_at", header: "Data", formatter: "date" },
  { field: "tipo", header: "Tipo" },
  { field: "forma_pagamento", header: "Pagamento" },
  { field: "valor", header: "Valor", formatter: "money" },
  { field: "descricao", header: "Descrição" },
  { field: "cliente_nome", header: "Cliente" },
  { field: "produto_nome", header: "Produto" },
];

const HARDCODED_FORMAS_PAGAMENTO: FormaPagamentoParaSelect[] = [
  { id: "dinheiro", nome: "Dinheiro" }, { id: "pix", nome: "PIX" },
  { id: "debito", nome: "Cartão de Débito" }, { id: "credito", nome: "Cartão de Crédito" },
];

// --- UTILITY FUNCTIONS ---
const adjustCaixaSearchString = (text: string | null | undefined): string => {
  if (!text) return "";
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

// --- PROPS DEFINITION ---
interface CashierSectionProps {
  currentUser: User | null;
  onActiveCaixaUpdate: (activeCaixa: ActiveCaixa | null) => void;
  // This prop is to trigger summary refresh in Home.tsx
  onRequestSummaryRefresh: () => void;
}

const CashierSection: React.FC<CashierSectionProps> = ({ currentUser, onActiveCaixaUpdate, onRequestSummaryRefresh }) => {
  const [activeCaixaDetails, setActiveCaixaDetails] = useState<ActiveCaixa | null>(null);
  const [caixaMovimentacoes, setCaixaMovimentacoes] = useState<FinanceiroItem[]>([]);
  const [caixaRowsPerPage, setCaixaRowsPerPage] = useState<number>(10);
  const [caixaCurrentPage, setCaixaCurrentPage] = useState<number>(1);
  const [isCaixaLoading, setIsCaixaLoading] = useState<boolean>(true); // Initial loading for caixa details and movs
  const [caixaInputSearch, setCaixaInputSearch] = useState<string>("");
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [showAbrirCaixaModal, setShowAbrirCaixaModal] = useState(false);
  const [showFecharCaixaModal, setShowFecharCaixaModal] = useState(false);
  const [alunosListCaixa, setAlunosListCaixa] = useState<AlunoParaSelect[]>([]);
  const [produtosListCaixa, setProdutosListCaixa] = useState<ProdutoParaSelect[]>([]);
  const [isLoadingCaixaSelectData, setIsLoadingCaixaSelectData] = useState(false);
  const [isSubmittingCaixaAction, setIsSubmittingCaixaAction] = useState(false);

  const checkActiveCaixa = useCallback(async (user: User | null) => {
    if (!user) {
      setActiveCaixaDetails(null);
      onActiveCaixaUpdate(null);
      return;
    }
    setIsCaixaLoading(true); // For initial check
    try {
      const { data, error } = await supabase.from("caixas").select("id, usuario_id, valor_inicial, data_abertura, observacoes_abertura")
        .eq("usuario_id", user.id).eq("status", "aberto").maybeSingle();
      if (error) {
        toast.error("Erro ao verificar status do caixa.");
        console.error("Error checking active caixa:", error);
        setActiveCaixaDetails(null);
        onActiveCaixaUpdate(null);
      } else {
        const currentActiveCaixa = data ? { ...data, valor_inicial: Number(data.valor_inicial || 0) } : null;
        setActiveCaixaDetails(currentActiveCaixa);
        onActiveCaixaUpdate(currentActiveCaixa);
      }
    } catch (e: any) {
      toast.error("Erro inesperado ao verificar caixa: " + e.message);
      setActiveCaixaDetails(null);
      onActiveCaixaUpdate(null);
    }
    // Note: setIsCaixaLoading(false) will be handled by fetchCaixaMovimentacoes
  }, [onActiveCaixaUpdate]);

  const fetchCaixaMovimentacoes = useCallback(async (caixaId?: string | null) => {
    setIsCaixaLoading(true);
    try {
      if (!caixaId) {
        setCaixaMovimentacoes([]);
        return;
      }
      const { data, error } = await supabase.from("financeiro").select("*, clientes:cliente_id(nome), produtos:produto_id(nome)")
        .eq("caixa_id", caixaId).order("created_at", { ascending: false });
      if (error) {
        toast.error("Erro ao buscar movimentações do caixa.");
        console.error("Error fetching caixa movimentacoes:", error);
        setCaixaMovimentacoes([]);
      } else if (data) {
        setCaixaMovimentacoes(data.map(i => ({ ...i, cliente_nome: (i.clientes as any)?.nome, produto_nome: (i.produtos as any)?.nome })) as FinanceiroItem[]);
      }
    } catch (err) {
      toast.error("Erro inesperado ao buscar movimentações.");
      console.error("Unexpected error fetching movimentacoes:", err);
      setCaixaMovimentacoes([]);
    } finally {
      setIsCaixaLoading(false);
    }
  }, []);

  const fetchDadosParaCaixaSelects = useCallback(async () => {
    if (!currentUser) return; // Should not happen if modals are only available when user is present
    setIsLoadingCaixaSelectData(true);
    try {
      const { data: studentsData, error: studentsError } = await supabase
        .from("alunos").select("id, nome").eq("ativo", true).order("nome", { ascending: true });
      if (studentsError) toast.error("Erro alunos selects: " + studentsError.message);
      else setAlunosListCaixa((studentsData || []).map(s => ({ id: s.id, nome: s.nome })));

      const { data: produtosData, error: produtosError } = await supabase
        .from("produtos").select("id, nome, valor").order("nome", { ascending: true });
      if (produtosError) toast.error("Erro produtos selects: " + produtosError.message);
      else setProdutosListCaixa((produtosData || []).map(p => ({ id: p.id, nome: p.nome, valor: p.valor })));
    } catch (error: any) {
      toast.error("Falha ao carregar dados para os selects do caixa: " + error.message);
    } finally {
      setIsLoadingCaixaSelectData(false);
    }
  }, [currentUser]);

  useEffect(() => {
    checkActiveCaixa(currentUser);
  }, [currentUser, checkActiveCaixa]);

  useEffect(() => {
    fetchCaixaMovimentacoes(activeCaixaDetails?.id);
  }, [activeCaixaDetails, fetchCaixaMovimentacoes]);

  useEffect(() => {
    if (currentUser && (isFinanceModalOpen || showAbrirCaixaModal)) { // Fetch data when user is present and a modal that needs it is opening
        fetchDadosParaCaixaSelects();
    }
  }, [currentUser, isFinanceModalOpen, showAbrirCaixaModal, fetchDadosParaCaixaSelects]);


  const handleNovaMovimentacaoClick = () => {
    if (!currentUser) { toast.warn("Usuário não autenticado."); return; }
    if (activeCaixaDetails?.usuario_id === currentUser.id) {
      setIsFinanceModalOpen(true);
    } else {
      setShowAbrirCaixaModal(true);
    }
  };
  const handleCloseFinanceModal = () => setIsFinanceModalOpen(false);
  const handleCloseAbrirCaixaModal = () => setShowAbrirCaixaModal(false);
  const handleCloseFecharCaixaModal = () => setShowFecharCaixaModal(false);
  const handleAbrirModalFechamento = () => {
    if (!activeCaixaDetails) { toast.info("Nenhum caixa ativo para fechar."); return; }
    setShowFecharCaixaModal(true);
  };

  const handleAbrirCaixa = async (formData: AbrirCaixaFormData) => {
    if (!currentUser) return;
    setIsSubmittingCaixaAction(true);
    try {
      const { data: nCaixa, error } = await supabase.from("caixas")
        .insert([{ ...formData, usuario_id: currentUser.id, status: "aberto" }])
        .select("id, usuario_id, valor_inicial, data_abertura, observacoes_abertura").single();
      if (error) throw error;
      if (nCaixa) {
        const newActiveCaixa = { ...nCaixa, valor_inicial: Number(nCaixa.valor_inicial||0) };
        setActiveCaixaDetails(newActiveCaixa);
        onActiveCaixaUpdate(newActiveCaixa); // Inform Home
        setShowAbrirCaixaModal(false);
        toast.success("Caixa aberto com sucesso!");
        onRequestSummaryRefresh(); // Request summary refresh
      }
    } catch (e:any) { toast.error("Erro ao abrir caixa: " + e.message); }
    finally { setIsSubmittingCaixaAction(false); }
  };

  const handleSaveMovimentacao = async (data: Partial<CaixaModalFormData>) => {
    if (!activeCaixaDetails || !currentUser || activeCaixaDetails.usuario_id !== currentUser.id) {
      toast.error("Caixa não está ativo ou pertence a outro usuário."); return;
    }
    setIsSubmittingCaixaAction(true);
    const payload: any = { ...data, caixa_id: activeCaixaDetails.id, usuario_id_transacao: currentUser.id };
    Object.keys(payload).forEach(k => (payload[k] === undefined || payload[k] === "") && delete payload[k]);

    try {
      const { error } = await supabase.from("financeiro").insert([payload]);
      if (error) throw error;
      toast.success("Movimentação registrada com sucesso!");
      fetchCaixaMovimentacoes(activeCaixaDetails.id); // Refresh movimentacoes
      handleCloseFinanceModal();
      onRequestSummaryRefresh(); // Request summary refresh
    } catch (e:any) { toast.error("Erro ao registrar movimentação: " + e.message); }
    finally { setIsSubmittingCaixaAction(false); }
  };

  const generatePDFFechamentoCaixa = (caixa: ActiveCaixa, trans: FinanceiroItem[], tots: { e: number; s: number; sal: number }, obs?: string) => {
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let currentY = 20;

    doc.setFontSize(16);
    doc.text("Fechamento de Caixa", pageWidth / 2, currentY, { align: "center" });
    currentY += 10;
    doc.setFontSize(10);
    doc.text(`ID Caixa: ${caixa.id.substring(0,6)}...`, margin, currentY); currentY += 7;
    doc.text(`Usuário: ${currentUser?.email || 'N/A'}`, margin, currentY); currentY += 7;
    doc.text(`Abertura: ${new Date(caixa.data_abertura).toLocaleString('pt-BR')}`, margin, currentY); currentY += 7;
    doc.text(`Fechamento: ${new Date(caixa.data_fechamento!).toLocaleString('pt-BR')}`, margin, currentY); currentY += 7;
    doc.text(`Valor Inicial: ${Number(caixa.valor_inicial).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`, margin, currentY); currentY += 7;
    if(caixa.observacoes_abertura) {doc.text(`Obs. Abertura: ${caixa.observacoes_abertura}`, margin, currentY); currentY+=7;}
    if(obs){doc.text(`Obs. Fechamento: ${obs}`, margin, currentY); currentY+=7;}
    doc.text(`Total Entradas: ${tots.e.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`, margin, currentY); currentY += 7;
    doc.text(`Total Saídas: ${tots.s.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`, margin, currentY); currentY += 7;
    doc.text(`Saldo Final Calculado: ${tots.sal.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`, margin, currentY); currentY += 10;

    autoTable(doc, {
      startY: currentY,
      head: [['Data', 'Tipo', 'Pgto', 'Valor', 'Descrição', 'Cliente', 'Produto']],
      body: trans.map(t => [
        new Date(t.created_at).toLocaleTimeString('pt-BR'),
        t.tipo,
        t.forma_pagamento,
        Number(t.valor).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}),
        t.descricao||'-',
        t.cliente_nome||'-',
        t.produto_nome||'-'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] } // Example color
    });
    doc.save(`fechamento_caixa_${caixa.id.substring(0,6)}.pdf`);
    toast.success("PDF de fechamento gerado!");
  };

  const handleConfirmarFechamentoCaixa = async (formData: FecharCaixaFormData) => {
    if (!activeCaixaDetails || !currentUser || activeCaixaDetails.usuario_id !== currentUser.id) {
      toast.error("Caixa não ativo ou pertence a outro usuário."); return;
    }
    setIsSubmittingCaixaAction(true);
    try {
      const { data: trans, error: transErr } = await supabase.from("financeiro")
        .select("*, cliente_nome:clientes(nome), produto_nome:produtos(nome)")
        .eq("caixa_id", activeCaixaDetails.id);
      if (transErr) throw transErr;

      let totalEntradas = 0, totalSaidas = 0;
      (trans||[]).forEach(t => {
        if (t.tipo === "pagamento" || t.tipo === "venda") totalEntradas += Number(t.valor);
        else if (t.tipo === "saida") totalSaidas += Number(t.valor);
      });
      const saldoFinal = (activeCaixaDetails.valor_inicial||0) + totalEntradas - totalSaidas;
      const dataFechamentoISO = new Date().toISOString();

      const updateCaixaPayload = {
        status: "fechado", data_fechamento: dataFechamentoISO,
        obs_fechamento: formData.observacoes_fechamento || null,
        valor_total_entradas: totalEntradas, valor_total_saidas: totalSaidas,
        saldo_final_calculado: saldoFinal
      };
      const { error: updateErr } = await supabase.from("caixas").update(updateCaixaPayload).eq("id", activeCaixaDetails.id);
      if (updateErr) throw updateErr;

      const updatedActiveCaixaForPDF = {
        ...activeCaixaDetails,
        data_fechamento: dataFechamentoISO,
        valor_total_entradas: totalEntradas,
        valor_total_saidas: totalSaidas,
        saldo_final_calculado: saldoFinal
      };
      generatePDFFechamentoCaixa(updatedActiveCaixaForPDF, (trans||[]) as FinanceiroItem[], {e:totalEntradas,s:totalSaidas,sal:saldoFinal}, formData.observacoes_fechamento);

      toast.success("Caixa fechado com sucesso!");
      setActiveCaixaDetails(null);
      onActiveCaixaUpdate(null); // Inform Home
      setShowFecharCaixaModal(false);
      await fetchCaixaMovimentacoes(null); // Clear movimentacoes
      onRequestSummaryRefresh(); // Request summary refresh
    } catch (e:any) { toast.error("Erro ao fechar caixa: " + e.message); }
    finally { setIsSubmittingCaixaAction(false); }
  };

  const filteredCaixaMovimentacoes = caixaMovimentacoes.filter(i =>
    (adjustCaixaSearchString(i.tipo).includes(adjustCaixaSearchString(caixaInputSearch)) ||
     adjustCaixaSearchString(i.descricao).includes(adjustCaixaSearchString(caixaInputSearch)) ||
     adjustCaixaSearchString(i.cliente_nome).includes(adjustCaixaSearchString(caixaInputSearch)) ||
     adjustCaixaSearchString(i.produto_nome).includes(adjustCaixaSearchString(caixaInputSearch)))
  );
  const currentCaixaTableData = filteredCaixaMovimentacoes.slice(
    (caixaCurrentPage - 1) * caixaRowsPerPage,
    ((caixaCurrentPage - 1) * caixaRowsPerPage) + caixaRowsPerPage
  );

  if (!currentUser) { // Early return or placeholder if no user is logged in
    return <Styles.SectionContainer>Por favor, faça login para acessar o caixa.</Styles.SectionContainer>;
  }

  return (
    <Styles.SectionContainer>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
        <div style={{maxWidth:400,flexGrow:1,marginRight:'1rem'}}>
          <Styles.Input value={caixaInputSearch} onChange={(e)=>setCaixaInputSearch(e.target.value)} placeholder="Pesquisar Movimentação"/>
        </div>
        <div style={{display:"flex",gap:"10px"}}>
          {activeCaixaDetails && activeCaixaDetails.usuario_id === currentUser.id && (
            <Styles.FecharCaixaButton onClick={handleAbrirModalFechamento} disabled={isSubmittingCaixaAction || isLoadingCaixaSelectData}>
              Fechar Caixa
            </Styles.FecharCaixaButton>
          )}
          <Styles.CadastrarButton onClick={handleNovaMovimentacaoClick} disabled={isLoadingCaixaSelectData || isSubmittingCaixaAction}>
            <FiPlus />
          </Styles.CadastrarButton>
        </div>
      </div>
      {isCaixaLoading ? (
        <Styles.LoaderDiv><Loader color="#000"/></Styles.LoaderDiv>
      ) : (
        <DefaultTable
          data={currentCaixaTableData}
          columns={financeTableColumns}
          rowsPerPage={caixaRowsPerPage}
          currentPage={caixaCurrentPage}
          totalRows={filteredCaixaMovimentacoes.length}
          onPageChange={setCaixaCurrentPage}
          onRowsPerPageChange={(r)=>{setCaixaRowsPerPage(r);setCaixaCurrentPage(1);}}
        />
      )}
      {showAbrirCaixaModal && (
        <AbrirCaixaModal
          open={showAbrirCaixaModal}
          onClose={handleCloseAbrirCaixaModal}
          onAbrirCaixa={handleAbrirCaixa}
          userName={currentUser.email || "Usuário"}
          isSubmitting={isSubmittingCaixaAction}
        />
      )}
      {isFinanceModalOpen && activeCaixaDetails && (
        <CaixaModal
          open={isFinanceModalOpen}
          onClose={handleCloseFinanceModal}
          onSave={handleSaveMovimentacao}
          alunosList={alunosListCaixa}
          produtosList={produtosListCaixa}
          formasPagamentoList={HARDCODED_FORMAS_PAGAMENTO}
          isSubmitting={isSubmittingCaixaAction}
          isLoadingSelectData={isLoadingCaixaSelectData}
        />
      )}
      {showFecharCaixaModal && activeCaixaDetails && (
        <FecharCaixaModal
          open={showFecharCaixaModal}
          onClose={handleCloseFecharCaixaModal}
          onConfirmFechar={handleConfirmarFechamentoCaixa}
          caixaId={activeCaixaDetails.id}
          isSubmitting={isSubmittingCaixaAction}
        />
      )}
    </Styles.SectionContainer>
  );
};

export default CashierSection;
