import React, { useEffect, useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jsPDF from "jspdf";

import * as Styles from "./CashierSection.styles";
import { ActionButtonsContainer } from "./CashierSection.styles";
import { useFechamentoCaixaTemplateStore } from "../../../../store/fechamentoCaixaTemplateStore";
import { useCashier } from "../../hooks/useCashier";
import { ActiveCaixa, FinanceiroItem } from "../../services/homeServices";

import TransactionHistoryModal from '../TransactionHistoryModal/TransactionHistoryModal';
import CaixaModal from "../../../Caixa/components/CaixaModal/CaixaModal";
import {
  CaixaModalFormData,
  FormaPagamentoParaSelect,
} from "../../../Caixa/components/CaixaModal/CaixaModal.definitions";
import AbrirCaixaModal from "../../../Caixa/components/AbrirCaixaModal/AbrirCaixaModal";
import { AbrirCaixaFormData } from "../../../Caixa/components/AbrirCaixaModal/AbrirCaixaModal.definitions";
import FecharCaixaModal from "../../../Caixa/components/FecharCaixaModal/FecharCaixaModal";
import { FecharCaixaFormData } from "../../../Caixa/components/FecharCaixaModal/FecharCaixaModal.definitions";

// --- CONSTANTS ---
const HARDCODED_FORMAS_PAGAMENTO: FormaPagamentoParaSelect[] = [
  { id: "dinheiro", nome: "Dinheiro" },
  { id: "pix", nome: "PIX" },
  { id: "debito", nome: "Cartão de Débito" },
  { id: "credito", nome: "Cartão de Crédito" },
];

// --- PROPS DEFINITION ---
interface CashierSectionProps {
  currentUser: User | null;
  onActiveCaixaUpdate: (activeCaixa: ActiveCaixa | null) => void;
  onRequestSummaryRefresh: () => void;
}

const CashierSection: React.FC<CashierSectionProps> = ({ 
  currentUser, 
  onActiveCaixaUpdate, 
  onRequestSummaryRefresh 
}) => {
  const { templateAtivo } = useFechamentoCaixaTemplateStore();
  
  const {
    activeCaixaDetails,
    alunosListCaixa,
    produtosListCaixa,
    isLoadingCaixaSelectData,
    isSubmittingCaixaAction,
    loadCaixaSelectsData,
    handleAbrirCaixa,
    handleSaveMovimentacao,
    handleFecharCaixa,
  } = useCashier(currentUser, onActiveCaixaUpdate, onRequestSummaryRefresh);

  // Modal states
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [showAbrirCaixaModal, setShowAbrirCaixaModal] = useState(false);
  const [showFecharCaixaModal, setShowFecharCaixaModal] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // --- PDF GENERATION ---
  const generatePDFFechamentoCaixa = useCallback((
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
    
    const margin = 10;
    let currentY = 15;
    const lineHeight = 5;
    const sectionSpacing = 8;

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

    // Informações do cabeçalho
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

        const linhaCompleta = movimentacaoInfo.join(" | ");
        const linhasQuebradas = doc.splitTextToSize(linhaCompleta, pageWidth - 2 * margin);
        
        linhasQuebradas.forEach((linha: string) => {
          if (currentY > pageHeight - 25) {
            doc.addPage();
            currentY = margin;
          }
          doc.text(`${index + 1}. ${linha}`, margin, currentY);
          currentY += lineHeight;
        });
        
        currentY += 1;
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
      const observacoesQuebradas = doc.splitTextToSize(observacoesFechamento, pageWidth - 2 * margin);
      observacoesQuebradas.forEach((linha: string) => {
        if (currentY > pageHeight - 20) {
          doc.addPage();
          currentY = margin;
        }
        doc.text(linha, margin, currentY);
        currentY += lineHeight;
      });
    }

    doc.save(`fechamento-caixa-${caixaInfo.id.substring(0, 8)}.pdf`);
    toast.success("PDF de fechamento gerado!");
  }, [templateAtivo, currentUser]);

  // --- EVENT HANDLERS ---
  const handleNovaMovimentacaoClick = useCallback(() => {
    if (!currentUser) {
      toast.warn("Usuário não autenticado.");
      return;
    }
    if (activeCaixaDetails?.usuario_id === currentUser.id) {
      setIsFinanceModalOpen(true);
    } else if (!activeCaixaDetails) {
      setShowAbrirCaixaModal(true);
    }
  }, [currentUser, activeCaixaDetails]);

  const handleAbrirModalFechamento = useCallback(() => {
    setShowFecharCaixaModal(true);
  }, []);

  const handleCloseAbrirCaixaModal = useCallback(() => {
    setShowAbrirCaixaModal(false);
  }, []);

  const handleCloseFinanceModal = useCallback(() => {
    setIsFinanceModalOpen(false);
  }, []);

  const handleCloseFecharCaixaModal = useCallback(() => {
    setShowFecharCaixaModal(false);
  }, []);

  const handleAbrirCaixaSubmit = useCallback(async (formData: AbrirCaixaFormData) => {
    await handleAbrirCaixa({
      valor_inicial: formData.valor_inicial,
      observacoes: formData.observacoes_abertura || undefined
    });
    setShowAbrirCaixaModal(false);
  }, [handleAbrirCaixa]);

  const handleSaveMovimentacaoSubmit = useCallback(async (data: Partial<CaixaModalFormData>) => {
    if (!activeCaixaDetails) return;

    const payload = {
      tipo: data.tipo || "",
      forma_pagamento: data.forma_pagamento || "",
      valor: Number(data.valor || 0),
      descricao: data.descricao || undefined,
      cliente_id: data.cliente_id || undefined,
      produto_id: data.produto_id || undefined,
    };

    await handleSaveMovimentacao(payload);
    setIsFinanceModalOpen(false);
  }, [activeCaixaDetails, handleSaveMovimentacao]);

  const handleConfirmarFechamentoCaixa = useCallback(async (formData: FecharCaixaFormData) => {
    const result = await handleFecharCaixa(formData.observacoes_fechamento);
    if (result) {
      generatePDFFechamentoCaixa(result.caixa, result.transacoes, result.totais, formData.observacoes_fechamento);
    }
    setShowFecharCaixaModal(false);
  }, [handleFecharCaixa, generatePDFFechamentoCaixa]);

  // --- EFFECTS ---
  useEffect(() => {
    if (currentUser && (isFinanceModalOpen || showAbrirCaixaModal)) {
      loadCaixaSelectsData();
    }
  }, [currentUser, isFinanceModalOpen, showAbrirCaixaModal, loadCaixaSelectsData]);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!currentUser) return;

      if (event.key === "F1") {
        event.preventDefault();
        if (activeCaixaDetails && activeCaixaDetails.usuario_id === currentUser.id) {
          handleAbrirModalFechamento();
        } else if (!activeCaixaDetails) {
          setShowAbrirCaixaModal(true);
        }
      }
      else if (event.key === "F2" && activeCaixaDetails && activeCaixaDetails.usuario_id === currentUser.id) {
        event.preventDefault();
        setIsFinanceModalOpen(true);
      }
      else if (event.key === "F3" && activeCaixaDetails && activeCaixaDetails.usuario_id === currentUser.id) {
        event.preventDefault();
        setIsHistoryModalOpen(true);
      }
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
  }, [currentUser, activeCaixaDetails, showAbrirCaixaModal, isFinanceModalOpen, showFecharCaixaModal, isHistoryModalOpen, handleAbrirModalFechamento, handleCloseAbrirCaixaModal, handleCloseFinanceModal, handleCloseFecharCaixaModal]);

  if (!currentUser) {
    return <Styles.SectionContainer>Por favor, faça login para acessar o caixa.</Styles.SectionContainer>;
  }

  return (
    <Styles.SectionContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ flexGrow: 1 }}>
          {/* Placeholder for potential future content */}
        </div>
        <ActionButtonsContainer>
          {activeCaixaDetails && activeCaixaDetails.usuario_id === currentUser.id ? (
            <Styles.FecharCaixaButton onClick={handleAbrirModalFechamento} disabled={isSubmittingCaixaAction || isLoadingCaixaSelectData}>
              Fechar Caixa [F1]
            </Styles.FecharCaixaButton>
          ) : (
            <Styles.CadastrarButton onClick={handleNovaMovimentacaoClick} disabled={isLoadingCaixaSelectData || isSubmittingCaixaAction}>
              Abrir Caixa [F1]
            </Styles.CadastrarButton>
          )}
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

      {showAbrirCaixaModal && (
        <AbrirCaixaModal
          open={showAbrirCaixaModal}
          onClose={handleCloseAbrirCaixaModal}
          onAbrirCaixa={handleAbrirCaixaSubmit}
          userName={currentUser.email || "Usuário"}
        />
      )}

      {isFinanceModalOpen && activeCaixaDetails && (
        <CaixaModal
          open={isFinanceModalOpen}
          onClose={handleCloseFinanceModal}
          onSave={handleSaveMovimentacaoSubmit}
          alunosList={alunosListCaixa}
          produtosList={produtosListCaixa}
          formasPagamentoList={HARDCODED_FORMAS_PAGAMENTO}
        />
      )}

      {showFecharCaixaModal && activeCaixaDetails && (
        <FecharCaixaModal
          open={showFecharCaixaModal}
          onClose={handleCloseFecharCaixaModal}
          onConfirmFechar={handleConfirmarFechamentoCaixa}
          caixaId={activeCaixaDetails.id}
        />
      )}

      {activeCaixaDetails && (
        <TransactionHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          currentUser={currentUser}
          activeCaixaId={activeCaixaDetails.id}
        />
      )}
    </Styles.SectionContainer>
  );
};

export default CashierSection;