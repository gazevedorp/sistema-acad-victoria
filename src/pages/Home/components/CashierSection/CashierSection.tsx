import React, { useEffect, useState, useCallback } from "react";
import * as Styles from "./CashierSection.styles"; // Styles for this section
import { ActionButtonsContainer } from "./CashierSection.styles"; // Import the new container and button
import { supabase } from "../../../../lib/supabase";
import { User } from "@supabase/supabase-js";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import jsPDF from "jspdf";

import TransactionHistoryModal from '../TransactionHistoryModal/TransactionHistoryModal'; // Import the new modal
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
import { useFechamentoCaixaTemplateStore } from "../../../../store/fechamentoCaixaTemplateStore";

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

const HARDCODED_FORMAS_PAGAMENTO: FormaPagamentoParaSelect[] = [
  { id: "dinheiro", nome: "Dinheiro" }, { id: "pix", nome: "PIX" },
  { id: "debito", nome: "Cartão de Débito" }, { id: "credito", nome: "Cartão de Crédito" },
];

// --- UTILITY FUNCTIONS ---
// (No utility functions specific to the removed table elements remain here)

// --- PROPS DEFINITION ---
interface CashierSectionProps {
  currentUser: User | null;
  onActiveCaixaUpdate: (activeCaixa: ActiveCaixa | null) => void;
  // This prop is to trigger summary refresh in Home.tsx
  onRequestSummaryRefresh: () => void;
}

const CashierSection: React.FC<CashierSectionProps> = ({ currentUser, onActiveCaixaUpdate, onRequestSummaryRefresh }) => {
  const { templateAtivo } = useFechamentoCaixaTemplateStore();
  const [activeCaixaDetails, setActiveCaixaDetails] = useState<ActiveCaixa | null>(null);

  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [showAbrirCaixaModal, setShowAbrirCaixaModal] = useState(false);
  const [showFecharCaixaModal, setShowFecharCaixaModal] = useState(false);
  const [alunosListCaixa, setAlunosListCaixa] = useState<AlunoParaSelect[]>([]);
  const [produtosListCaixa, setProdutosListCaixa] = useState<ProdutoParaSelect[]>([]);
  const [isLoadingCaixaSelectData, setIsLoadingCaixaSelectData] = useState(false);
  const [isSubmittingCaixaAction, setIsSubmittingCaixaAction] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false); // State for history modal

  const checkActiveCaixa = useCallback(async (user: User | null) => {
    if (!user) {
      setActiveCaixaDetails(null);
      onActiveCaixaUpdate(null);
      return;
    }
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
  }, [onActiveCaixaUpdate]);

  const fetchCaixaMovimentacoes = useCallback(async (_caixaId?: string | null) => {
    // This function is kept for compatibility but doesn't store data locally anymore
    return;
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
        const newActiveCaixa = { ...nCaixa, valor_inicial: Number(nCaixa.valor_inicial || 0) };
        setActiveCaixaDetails(newActiveCaixa);
        onActiveCaixaUpdate(newActiveCaixa); // Inform Home
        setShowAbrirCaixaModal(false);
        toast.success("Caixa aberto com sucesso!");
        onRequestSummaryRefresh(); // Request summary refresh
      }
    } catch (e: any) { toast.error("Erro ao abrir caixa: " + e.message); }
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
    } catch (e: any) { toast.error("Erro ao registrar movimentação: " + e.message); }
    finally { setIsSubmittingCaixaAction(false); }
  };

const generatePDFFechamentoCaixa = (
    caixaInfo: ActiveCaixa & { data_fechamento?: string },
    transacoes: FinanceiroItem[],
    totais: { entradas: number; saidas: number; saldo: number },
    observacoesFechamento?: string
  ) => {
    const doc = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
    });

    const template = templateAtivo;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Layout minimalista - margens menores para aproveitar melhor a página
    const margin = 10;
    let currentY = 15;
    const lineHeight = 5;
    const sectionSpacing = 8;

    // Configurar fonte padrão
    doc.setFontSize(12);
    doc.setTextColor("#000000");

    // === CABEÇALHO ===
    if (template.informacoes.titulo) {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(template.informacoes.titulo, pageWidth / 2, currentY, { align: "center" });
      currentY += lineHeight + 2;
    }

    if (template.informacoes.subtitulo) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(template.informacoes.subtitulo, pageWidth / 2, currentY, { align: "center" });
      currentY += lineHeight;
    }

    // Informações do cabeçalho em linha
    const headerInfo = [];
    if (template.informacoes.mostrarData) {
      const dataFormatada = caixaInfo.data_fechamento
        ? new Date(caixaInfo.data_fechamento).toLocaleDateString("pt-BR")
        : new Date().toLocaleDateString("pt-BR");
      headerInfo.push(`Data: ${dataFormatada}`);
    }
    if (template.informacoes.mostrarUsuario && currentUser) {
      headerInfo.push(`Usuário: ${currentUser.email}`);
    }
    
    if (headerInfo.length > 0) {
      doc.setFontSize(10);
      doc.text(headerInfo.join(" | "), pageWidth / 2, currentY, { align: "center" });
      currentY += lineHeight + sectionSpacing;
    }

    // === RESUMO DO CAIXA ===
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO DO CAIXA", margin, currentY);
    currentY += lineHeight + 2;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const resumoInfo = [];
    if (template.informacoes.mostrarNumeroCaixa) {
      resumoInfo.push(`Caixa: ${caixaInfo.id.substring(0, 8).toUpperCase()}`);
    }
    if (template.informacoes.mostrarDataAbertura) {
      const dataAbertura = new Date(caixaInfo.data_abertura).toLocaleString("pt-BR", { hour12: false });
      resumoInfo.push(`Abertura: ${dataAbertura}`);
    }
    if (template.informacoes.mostrarDataFechamento) {
      const dataFechamento = caixaInfo.data_fechamento
        ? new Date(caixaInfo.data_fechamento).toLocaleString("pt-BR", { hour12: false })
        : new Date().toLocaleString("pt-BR", { hour12: false });
      resumoInfo.push(`Fechamento: ${dataFechamento}`);
    }
    if (template.informacoes.mostrarValorInicial) {
      resumoInfo.push(`Valor Inicial: ${Number(caixaInfo.valor_inicial || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`);
    }
    
    resumoInfo.forEach(info => {
      doc.text(info, margin, currentY);
      currentY += lineHeight;
    });
    
    if (template.informacoes.mostrarObservacoesAbertura && caixaInfo.observacoes_abertura) {
      doc.text(`Obs. Abertura: ${caixaInfo.observacoes_abertura}`, margin, currentY);
      currentY += lineHeight;
    }
    
    currentY += sectionSpacing;

    // === MOVIMENTAÇÕES ===
    if (template.informacoes.mostrarMovimentacoes && transacoes.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("MOVIMENTAÇÕES", margin, currentY);
      currentY += lineHeight + 2;
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      transacoes.forEach((item, index) => {
        if (currentY > pageHeight - 25) {
          doc.addPage();
          currentY = margin;
        }

        // Criar linha única com as informações
        const movimentacaoInfo = [];
        
        if (template.informacoes.mostrarTipoMovimentacao) {
          let tipoDesc = "";
          switch (item.tipo) {
            case "pagamento": tipoDesc = "PAGAMENTO"; break;
            case "venda": tipoDesc = "VENDA"; break;
            case "saida": tipoDesc = "SAÍDA"; break;
            default: tipoDesc = item.tipo.toUpperCase();
          }
          movimentacaoInfo.push(tipoDesc);
        }
        
        if (template.informacoes.mostrarDescricao && item.descricao) {
          movimentacaoInfo.push(item.descricao);
        }
        
        if (template.informacoes.mostrarClienteNome && item.cliente_nome) {
          movimentacaoInfo.push(`Cliente: ${item.cliente_nome}`);
        }
        
        if (template.informacoes.mostrarProdutoNome && item.produto_nome) {
          movimentacaoInfo.push(`Produto: ${item.produto_nome}`);
        }
        
        if (template.informacoes.mostrarFormaPagamento) {
          movimentacaoInfo.push(item.forma_pagamento);
        }
        
        if (template.informacoes.mostrarValor) {
          movimentacaoInfo.push(Number(item.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
        }

        // Montar a linha completa
        const linhaCompleta = movimentacaoInfo.join(" | ");
        
        // Verificar se a linha cabe na página, se não quebrar
        const linhasQuebradas = doc.splitTextToSize(linhaCompleta, pageWidth - 2 * margin);
        linhasQuebradas.forEach((linha: string) => {
          if (currentY > pageHeight - 25) {
            doc.addPage();
            currentY = margin;
          }
          doc.text(`${index + 1}. ${linha}`, margin, currentY);
          currentY += lineHeight;
        });
        
        currentY += 1; // Pequeno espaço entre movimentações
      });
      
      currentY += sectionSpacing;
    }

    // === TOTAIS ===
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAIS", margin, currentY);
    currentY += lineHeight + 2;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    if (template.informacoes.mostrarTotalEntradas) {
      doc.text(`Total Entradas: ${totais.entradas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`, margin, currentY);
      currentY += lineHeight;
    }
    if (template.informacoes.mostrarTotalSaidas) {
      doc.text(`Total Saídas: ${totais.saidas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`, margin, currentY);
      currentY += lineHeight;
    }
    if (template.informacoes.mostrarSaldoFinal) {
      doc.setFont("helvetica", "bold");
      doc.text(`SALDO FINAL: ${totais.saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`, margin, currentY);
      currentY += lineHeight;
    }
    
    currentY += sectionSpacing;

    // === OBSERVAÇÕES DE FECHAMENTO ===
    if (template.informacoes.mostrarObservacoesFechamento && observacoesFechamento) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("OBSERVAÇÕES DE FECHAMENTO", margin, currentY);
      currentY += lineHeight + 2;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const obsLines = doc.splitTextToSize(observacoesFechamento, pageWidth - 2 * margin);
      obsLines.forEach((linha: string) => {
        doc.text(linha, margin, currentY);
        currentY += lineHeight;
      });
      
      currentY += sectionSpacing;
    }

    // === ASSINATURAS ===
    if (template.informacoes.mostrarAssinaturas) {
      currentY += sectionSpacing;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      // Duas colunas para assinaturas
      const coluna1X = margin;
      const coluna2X = pageWidth / 2 + 10;
      
      // Linha de assinatura 1
      doc.line(coluna1X, currentY, coluna1X + 80, currentY);
      doc.text("Responsável pelo Caixa", coluna1X, currentY + 5);
      
      // Linha de assinatura 2
      doc.line(coluna2X, currentY, coluna2X + 80, currentY);
      doc.text("Supervisor/Gerente", coluna2X, currentY + 5);
      
      currentY += 15;
    }

    // === DATA DE GERAÇÃO ===
    if (template.informacoes.mostrarDataGeracao) {
      currentY = pageHeight - 10;
      doc.setFontSize(8);
      doc.setTextColor("#666666");
      const dataEmissao = new Date().toLocaleString("pt-BR", { hour12: false });
      doc.text(`Documento gerado em ${dataEmissao}`, margin, currentY);
    }

    // Salvar PDF
    doc.save(
      `fechamento_caixa_${caixaInfo.id.substring(0, 8)}_${
        new Date().toISOString().split("T")[0]
      }.pdf`
    );
    toast.success("PDF de fechamento gerado!");
  };

  const handleConfirmarFechamentoCaixa = async (formData: FecharCaixaFormData) => {
    if (!activeCaixaDetails || !currentUser || activeCaixaDetails.usuario_id !== currentUser.id) {
      toast.error("Caixa não ativo ou pertence a outro usuário."); return;
    }
    setIsSubmittingCaixaAction(true);
    try {
      const { data: trans, error: transErr } = await supabase.from("financeiro")
        .select("*")
        .eq("caixa_id", activeCaixaDetails.id);
      if (transErr) throw transErr;

      let totalEntradas = 0, totalSaidas = 0;
      (trans || []).forEach(t => {
        if (t.tipo === "pagamento" || t.tipo === "venda") totalEntradas += Number(t.valor);
        else if (t.tipo === "saida") totalSaidas += Number(t.valor);
      });
      const saldoFinal = (activeCaixaDetails.valor_inicial || 0) + totalEntradas - totalSaidas;
      const dataFechamentoISO = new Date().toISOString();

      const updateCaixaPayload = {
        status: "fechado", data_fechamento: dataFechamentoISO,
        observacoes_fechamento: formData.observacoes_fechamento || null,
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
      generatePDFFechamentoCaixa(updatedActiveCaixaForPDF, (trans || []) as FinanceiroItem[], { entradas: totalEntradas, saidas: totalSaidas, saldo: saldoFinal }, formData.observacoes_fechamento);

      toast.success("Caixa fechado com sucesso!");
      setActiveCaixaDetails(null);
      onActiveCaixaUpdate(null); // Inform Home
      setShowFecharCaixaModal(false);
      await fetchCaixaMovimentacoes(null); // Clear movimentacoes
      onRequestSummaryRefresh(); // Request summary refresh
    } catch (e: any) { toast.error("Erro ao fechar caixa: " + e.message); }
    finally { setIsSubmittingCaixaAction(false); }
  };


  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!currentUser) return; // Shortcuts only active if user is logged in

      // F1: Abrir/Fechar Caixa
      if (event.key === "F1") {
        event.preventDefault();
        if (activeCaixaDetails && activeCaixaDetails.usuario_id === currentUser.id) {
          handleAbrirModalFechamento(); // Fechar Caixa
        } else if (!activeCaixaDetails) {
          setShowAbrirCaixaModal(true); // Abrir Caixa
        }
      }
      // F2: Nova Movimentação (only if caixa is open)
      else if (event.key === "F2" && activeCaixaDetails && activeCaixaDetails.usuario_id === currentUser.id) {
        event.preventDefault();
        setIsFinanceModalOpen(true);
      }
      // F3: Histórico (only if caixa is open)
      else if (event.key === "F3" && activeCaixaDetails && activeCaixaDetails.usuario_id === currentUser.id) {
        event.preventDefault();
        setIsHistoryModalOpen(true);
      }
      // Escape: Fechar Modais Abertos
      else if (event.key === "Escape") {
        if (showAbrirCaixaModal) {
          event.preventDefault();
          handleCloseAbrirCaixaModal();
        } else if (isFinanceModalOpen) {
          event.preventDefault();
          handleCloseFinanceModal();
        } else if (showFecharCaixaModal) {
          event.preventDefault();
          handleCloseFecharCaixaModal();
        } else if (isHistoryModalOpen) {
          event.preventDefault();
          setIsHistoryModalOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentUser, activeCaixaDetails, handleAbrirModalFechamento, setIsFinanceModalOpen, setIsHistoryModalOpen, setShowAbrirCaixaModal, showAbrirCaixaModal, isFinanceModalOpen, showFecharCaixaModal, isHistoryModalOpen, handleCloseAbrirCaixaModal, handleCloseFinanceModal, handleCloseFecharCaixaModal]);


  if (!currentUser) { // Early return or placeholder if no user is logged in
    return <Styles.SectionContainer>Por favor, faça login para acessar o caixa.</Styles.SectionContainer>;
  }

  return (
    <Styles.SectionContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        {/* Search Input div removed */}
        <div style={{ flexGrow: 1 }}> {/* This div can be removed if ActionButtonsContainer will fill width or be positioned differently later */}
          {/* Placeholder for potential future content or remove if layout is handled by parent/ActionButtonsContainer exclusivamente */}
        </div>
        <ActionButtonsContainer>
          {activeCaixaDetails && activeCaixaDetails.usuario_id === currentUser.id ? (
            <Styles.FecharCaixaButton onClick={handleAbrirModalFechamento} disabled={isSubmittingCaixaAction || isLoadingCaixaSelectData}>
              Fechar Caixa [F1]
            </Styles.FecharCaixaButton>
          ) :
            (
              <Styles.CadastrarButton onClick={handleNovaMovimentacaoClick} disabled={isLoadingCaixaSelectData || isSubmittingCaixaAction}>
                Abrir Caixa [F1]
              </Styles.CadastrarButton>
            )
          }
          <Styles.CadastrarButton onClick={handleNovaMovimentacaoClick} disabled={isLoadingCaixaSelectData || isSubmittingCaixaAction || !activeCaixaDetails}>
            Nova Mov. [F2]
          </Styles.CadastrarButton>
          <Styles.HistoryButton
            onClick={() => setIsHistoryModalOpen(true)}
            disabled={!activeCaixaDetails || isSubmittingCaixaAction || isLoadingCaixaSelectData}
          >
            Histórico [F3]
          </Styles.HistoryButton>
        </ActionButtonsContainer>
      </div>
      {
        showAbrirCaixaModal && (        <AbrirCaixaModal
          open={showAbrirCaixaModal}
          onClose={handleCloseAbrirCaixaModal}
          onAbrirCaixa={handleAbrirCaixa}
          userName={currentUser.email || "Usuário"}
        />
        )
      }
      {
        isFinanceModalOpen && activeCaixaDetails && (
          <CaixaModal
            open={isFinanceModalOpen}
            onClose={handleCloseFinanceModal}
            onSave={handleSaveMovimentacao}
            alunosList={alunosListCaixa}
            produtosList={produtosListCaixa}
            formasPagamentoList={HARDCODED_FORMAS_PAGAMENTO}
          />
        )
      }
      {
        showFecharCaixaModal && activeCaixaDetails && (
          <FecharCaixaModal
            open={showFecharCaixaModal}
            onClose={handleCloseFecharCaixaModal}
            onConfirmFechar={handleConfirmarFechamentoCaixa}
            caixaId={activeCaixaDetails.id}
          />
        )
      }
      {
        activeCaixaDetails && ( // Conditionally render TransactionHistoryModal
          <TransactionHistoryModal
            isOpen={isHistoryModalOpen}
            onClose={() => setIsHistoryModalOpen(false)}
            currentUser={currentUser}
            activeCaixaId={activeCaixaDetails.id}
          />
        )
      }
    </Styles.SectionContainer >
  );
};

export default CashierSection;
