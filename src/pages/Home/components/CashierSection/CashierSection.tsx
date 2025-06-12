import React, { useEffect, useState, useCallback } from "react";
import * as Styles from "./CashierSection.styles"; // Styles for this section
import { ActionButtonsContainer } from "./CashierSection.styles"; // Import the new container and button
import { supabase } from "../../../../lib/supabase";
import { User } from "@supabase/supabase-js";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const [activeCaixaDetails, setActiveCaixaDetails] = useState<ActiveCaixa | null>(null);
  const [caixaMovimentacoes, setCaixaMovimentacoes] = useState<FinanceiroItem[]>([]);
  const [isCaixaLoading, setIsCaixaLoading] = useState<boolean>(true); // Initial loading for caixa details and movs
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
    caixaInfo: ActiveCaixa & { data_fechamento?: string }, // Adicionado data_fechamento aqui
    transacoes: FinanceiroItem[],
    totais: { entradas: number; saidas: number; saldo: number },
    observacoesFechamento?: string
  ) => {
    const doc = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight(); // Para o rodapé
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let currentY = 20;
    const lineHeight = 6; // Altura da linha para texto normal
    const smallLineHeight = 5;
    const sectionSpacing = 8;

    // Cabeçalho Principal
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("ACADEMIA VICTÓRIA", pageWidth / 2, currentY, { align: "center" });
    currentY += lineHeight * 1.5;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const dataCaixaFechado = caixaInfo.data_fechamento
      ? new Date(caixaInfo.data_fechamento).toLocaleDateString("pt-BR", {
          timeZone: "America/Sao_Paulo",
        })
      : new Date().toLocaleDateString("pt-BR", {
          timeZone: "America/Sao_Paulo",
        });
    doc.text(
      `Relatório de Movimentação de Caixa do dia ${dataCaixaFechado}`,
      pageWidth / 2,
      currentY,
      { align: "center" }
    );
    currentY += sectionSpacing * 1.5;

    // Seção de Resumo do Fechamento (Duas Colunas)
    doc.setFontSize(10);
    const col1X = margin;
    const col2X = margin + contentWidth / 2 + 5; // Ponto de início da segunda coluna
    const labelColWidth = 35; // Largura para os rótulos

    const addSummaryLine = (
      labelCol1: string,
      valueCol1: string,
      labelCol2: string,
      valueCol2: string
    ) => {
      doc.setFont("helvetica", "bold");
      doc.text(labelCol1, col1X, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(valueCol1, col1X + labelColWidth, currentY);

      doc.setFont("helvetica", "bold");
      doc.text(labelCol2, col2X, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(valueCol2, col2X + labelColWidth, currentY);
      currentY += lineHeight;
    };

    const fechamentoNumero = `Nº: ${caixaInfo.id
      .substring(0, 8)
      .toUpperCase()}`;
    const dataAberturaFormatada = caixaInfo.data_abertura
      ? new Date(caixaInfo.data_abertura).toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          hour12: false,
        })
      : "N/A";
    const dataFechamentoFormatada = caixaInfo.data_fechamento
      ? new Date(caixaInfo.data_fechamento).toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          hour12: false,
        })
      : new Date().toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          hour12: false,
        });
    const valorInicialFormatado = Number(
      caixaInfo.valor_inicial || 0
    ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const totalRecebidoFormatado = totais.entradas.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    const valorRetiradoFormatado = totais.saidas.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    const valorAdicionadoFormatado = (
      totais.entradas - totais.saidas
    ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const saldoFinalFormatado = totais.saldo.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    addSummaryLine(
      "Fechamento:",
      fechamentoNumero,
      "Funcionário:",
      currentUser?.email || "N/A"
    );
    addSummaryLine(
      "Hora Inicial:",
      dataAberturaFormatada.split(" ")[1] || "",
      "Dt. Fechamento:",
      dataFechamentoFormatada.split(" ")[0] || ""
    );
    addSummaryLine(
      "Valor Inicial:",
      valorInicialFormatado,
      "Hora Final:",
      dataFechamentoFormatada.split(" ")[1] || ""
    );
    currentY += smallLineHeight; // Espaço extra antes das observações

    doc.setFont("helvetica", "bold");
    doc.text("Observações Abertura:", col1X, currentY);
    doc.setFont("helvetica", "normal");
    currentY += smallLineHeight;
    const obsAberturaLines = doc.splitTextToSize(
      caixaInfo.observacoes_abertura || "-",
      contentWidth
    );
    doc.text(obsAberturaLines, col1X, currentY);
    currentY += obsAberturaLines.length * smallLineHeight + 2;

    if (observacoesFechamento) {
      doc.setFont("helvetica", "bold");
      doc.text("Observações Fechamento:", col1X, currentY);
      doc.setFont("helvetica", "normal");
      currentY += smallLineHeight;
      const obsFechamentoLines = doc.splitTextToSize(
        observacoesFechamento,
        contentWidth
      );
      doc.text(obsFechamentoLines, col1X, currentY);
      currentY += obsFechamentoLines.length * smallLineHeight;
    }
    currentY += smallLineHeight; // Espaço extra

    addSummaryLine(
      "Total Recebido:",
      totalRecebidoFormatado,
      "Val. Adicionado:",
      "R$ 0,00"
    );
    addSummaryLine(
      "Val. Retirado:",
      valorRetiradoFormatado,
      "Valor Próx. Caixa:",
      saldoFinalFormatado
    );
    addSummaryLine(
      "Valor Fechado:",
      saldoFinalFormatado,
      "Valor LEVADO:",
      saldoFinalFormatado
    ); // "Valor Levado" igual ao fechado por enquanto

    currentY += lineHeight / 2;
    doc.setDrawColor(180, 180, 180); // Cinza para a linha
    doc.line(margin, currentY, pageWidth - margin, currentY); // Linha horizontal
    currentY += sectionSpacing;

    // Seção de Detalhes dos Valores Recebidos (ou Todas as Movimentações)
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DETALHES DAS MOVIMENTAÇÕES", pageWidth / 2, currentY, {
      align: "center",
    });
    currentY += sectionSpacing;

    doc.setFontSize(9);
    if (transacoes.length > 0) {
      transacoes.forEach((item, index) => {
        if (currentY > pageHeight - 30) {
          // Checa espaço para o rodapé e próxima transação
          doc.addPage();
          currentY = margin;
        }

        let descPrincipal = "";
        let linhaCpf = "";
        let linhaDescEspecifica = `Descrição: ${item.descricao || "-"}`;
        const valorItemFormatado = Number(item.valor).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });

        // Formata o tipo de transação e busca nomes
        switch (item.tipo) {
          case "pagamento":
            descPrincipal = `MENSALIDADE`;
            if (item.cliente_cpf) linhaCpf = `CPF: ${item.cliente_cpf}`;
            break;
          case "venda":
            descPrincipal = `VENDA DE PRODUTO(S)`;
            // Poderia adicionar cliente se venda for associada a cliente
            // linhaCpf = ... (se aplicável e tiver CPF do cliente da venda)
            break;
          case "saida":
            descPrincipal = `SAÍDA DE CAIXA`;
            break;
          default:
            descPrincipal = item.tipo.toUpperCase();
        }

        doc.setFont("helvetica", "bold");
        doc.text(descPrincipal, margin, currentY);
        currentY += smallLineHeight;

        if (linhaCpf) {
          doc.setFont("helvetica", "normal");
          doc.text(linhaCpf, margin, currentY);
          currentY += smallLineHeight;
        }

        doc.setFont("helvetica", "normal");
        doc.text(linhaDescEspecifica, margin, currentY);
        currentY += smallLineHeight;

        // Linha 4 (Dados Financeiros) - Simplificada para o que temos
        // Vencimento, Desc, Acresc não estão nos dados atuais
        // Usaremos "Forma Pag." e "Valor"
        const formaPagamento =
          item.forma_pagamento.charAt(0).toUpperCase() +
          item.forma_pagamento.slice(1); // Capitaliza
        doc.text(`Forma Pag.: ${formaPagamento}`, margin, currentY);
        doc.text(
          `Valor: ${valorItemFormatado}`,
          margin + contentWidth / 2,
          currentY,
          { align: "left" }
        ); // Alinha valor à direita da primeira metade
        currentY += smallLineHeight;

        if (index < transacoes.length - 1) {
          doc.setDrawColor(220, 220, 220); // Cinza mais claro para separador de item
          doc.line(margin, currentY, pageWidth - margin, currentY);
          currentY += 3; // Espaço após a linha
        }
      });
    } else {
      doc.setFont("helvetica", "normal");
      doc.text(
        "Nenhuma movimentação registrada neste caixa.",
        margin,
        currentY
      );
      currentY += lineHeight;
    }

    currentY += sectionSpacing; // Espaço antes do total recebido (se aplicável)
    // Se você quiser um "TOTAL RECEBIDO" geral (incluindo entradas e saídas como no exemplo, o que é estranho)
    // Ou podemos manter o resumo financeiro que já está no cabeçalho.
    // O exemplo parece somar todos os "Subtotais" listados.
    // No nosso caso, temos 'Total de Entradas' e 'Total de Saídas' já calculados.
    // Vamos adicionar um "Total Geral Movimentado no Caixa (Entradas)" se fizer sentido.
    doc.setFont("helvetica", "bold");
    doc.text(
      `TOTAL DE VALORES RECEBIDOS (ENTRADAS): ${totais.entradas.toLocaleString(
        "pt-BR",
        { style: "currency", currency: "BRL" }
      )}`,
      pageWidth - margin,
      currentY,
      { align: "right" }
    );
    currentY += lineHeight;
    doc.text(
      `TOTAL DE VALORES RETIRADOS (SAÍDAS): ${totais.saidas.toLocaleString(
        "pt-BR",
        { style: "currency", currency: "BRL" }
      )}`,
      pageWidth - margin,
      currentY,
      { align: "right" }
    );

    // Rodapé com Data de Emissão e Paginação
    const pageCount = (doc as any).internal.getNumberOfPages(); // Necessário cast para acessar internal
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      const dataEmissao = `Emitido: ${new Date().toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour12: false,
      })}`;
      doc.text(dataEmissao, margin, pageHeight - 10);
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth - margin - 20,
        pageHeight - 10
      );
    }

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
      generatePDFFechamentoCaixa(updatedActiveCaixaForPDF, (trans || []) as FinanceiroItem[], { e: totalEntradas, s: totalSaidas, sal: saldoFinal }, formData.observacoes_fechamento);

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
          {/* Placeholder for potential future content or remove if layout is handled by parent/ActionButtonsContainer exclusively */}
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
        showAbrirCaixaModal && (
          <AbrirCaixaModal
            open={showAbrirCaixaModal}
            onClose={handleCloseAbrirCaixaModal}
            onAbrirCaixa={handleAbrirCaixa}
            userName={currentUser.email || "Usuário"}
            isSubmitting={isSubmittingCaixaAction}
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
            isSubmitting={isSubmittingCaixaAction}
            isLoadingSelectData={isLoadingCaixaSelectData}
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
            isSubmitting={isSubmittingCaixaAction}
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
