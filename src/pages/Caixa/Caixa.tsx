import React, { useEffect, useState, useCallback } from "react";
import DefaultTable, { TableColumn } from "../../components/Table/DefaultTable";
import { supabase } from "../../lib/supabase";
import { toast, ToastContainer } from "react-toastify";
import Loader from "../../components/Loader/Loader";
import * as Styles from "./Caixa.styles";
import { FiPlus } from "react-icons/fi";
import { User } from "@supabase/supabase-js";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import CaixaModal from "./components/CaixaModal/CaixaModal";
import {
  CaixaModalFormData,
  AlunoParaSelect,
  ProdutoParaSelect,
  FormaPagamentoParaSelect,
} from "./components/CaixaModal/CaixaModal.definitions";

import AbrirCaixaModal from "./components/AbrirCaixaModal/AbrirCaixaModal";
import { AbrirCaixaFormData } from "./components/AbrirCaixaModal/AbrirCaixaModal.definitions";

import FecharCaixaModal from "./components/FecharCaixaModal/FecharCaixaModal";
import { FecharCaixaFormData } from "./components/FecharCaixaModal/FecharCaixaModal.definitions";

interface FinanceiroItem {
  id: string;
  created_at: string;
  tipo: string; // 'pagamento_mensalidade', 'venda_produto', 'saida_caixa'
  forma_pagamento: string;
  valor: number;
  descricao?: string;
  cliente_id?: string;
  produto_id?: string;
  caixa_id?: string;
  // Campos populados por JOIN:
  cliente_nome?: string;
  cliente_cpf?: string;
  produto_nome?: string;
}

interface ActiveCaixa {
  id: string;
  usuario_id: string;
  valor_inicial: number;
  data_abertura: string;
  observacoes_abertura?: string | null;
}

const columns: TableColumn<FinanceiroItem>[] = [
  { field: "created_at", header: "Data", formatter: "date" },
  { field: "tipo", header: "Tipo" },
  { field: "forma_pagamento", header: "Pagamento" },
  { field: "valor", header: "Valor", formatter: "money" },
  { field: "descricao", header: "Descrição" },
];

const HARDCODED_FORMAS_PAGAMENTO: FormaPagamentoParaSelect[] = [
  { id: "dinheiro", nome: "Dinheiro" },
  { id: "pix", nome: "PIX" },
  { id: "debito", nome: "Cartão de Débito" },
];

const Caixa: React.FC = () => {
  const [movimentacoes, setMovimentacoes] = useState<FinanceiroItem[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [onLoading, setLoading] = useState<boolean>(true);
  const [inputSearch, setInputSearch] = useState<string>("");

  const [isCaixaModalOpen, setIsCaixaModalOpen] = useState(false);
  const [showAbrirCaixaModal, setShowAbrirCaixaModal] = useState(false);
  const [showFecharCaixaModal, setShowFecharCaixaModal] = useState(false);

  const [alunosList, setAlunosList] = useState<AlunoParaSelect[]>([]);
  const [produtosList, setProdutosList] = useState<ProdutoParaSelect[]>([]);
  const [formasPagamentoList] = useState<FormaPagamentoParaSelect[]>(
    HARDCODED_FORMAS_PAGAMENTO
  );
  const [isLoadingSelectData, setIsLoadingSelectData] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeCaixa, setActiveCaixa] = useState<ActiveCaixa | null>(null);
  const [isSubmittingCaixaAction, setIsSubmittingCaixaAction] = useState(false);

  const checkUserAndActiveCaixa = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user);
      const { data: caixaData, error: caixaError } = await supabase
        .from("caixas")
        .select(
          "id, usuario_id, valor_inicial, data_abertura, observacoes_abertura"
        )
        .eq("usuario_id", user.id)
        .eq("status", "aberto")
        .maybeSingle();

      if (caixaError) {
        console.error("Erro ao buscar caixa aberto:", caixaError.message);
        toast.error("Erro ao verificar status do caixa.");
        setActiveCaixa(null);
      } else {
        setActiveCaixa(
          caixaData
            ? {
                id: caixaData.id,
                usuario_id: caixaData.usuario_id,
                valor_inicial: Number(caixaData.valor_inicial || 0),
                data_abertura: caixaData.data_abertura,
                observacoes_abertura: caixaData.observacoes_abertura,
              }
            : null
        );
      }
    } else {
      toast.error("Usuário não autenticado. Por favor, faça login.");
      setActiveCaixa(null);
    }
    // setLoading(false); // Movido para o useEffect combinado
  }, []);

  const fetchMovimentacoes = useCallback(
    async (currentActiveCaixaId?: string | null) => {
      try {
        setLoading(true);
        let query = supabase
          .from("financeiro")
          .select("*, clientes:cliente_id(nome), produtos:produto_id(nome)") // Exemplo de join para exibir nome do cliente/produto
          .order("created_at", { ascending: false });

        if (currentActiveCaixaId) {
          query = query.eq("caixa_id", currentActiveCaixaId);
        } else {
          setMovimentacoes([]); // Limpa movimentações se não há caixa ativo
          setLoading(false);
          return;
        }

        const { data, error } = await query;

        if (error) {
          toast.error("Erro ao buscar movimentações financeiras.");
          console.error("Supabase error fetchMovimentacoes:", error);
          return;
        }
        if (data) {
          setMovimentacoes(
            data.map((item) => ({
              ...item,
              cliente_nome: (item.clientes as any)?.nome, // Ajuste se o nome da relação/coluna for diferente
              produto_nome: (item.produtos as any)?.nome,
            })) as FinanceiroItem[]
          );
        }
      } catch (err) {
        console.error("Erro ao buscar movimentações:", err);
        toast.error("Erro inesperado ao buscar movimentações.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchDadosParaSelects = useCallback(async () => {
    setIsLoadingSelectData(true);
    try {
      const [alunosRes, produtosRes] = await Promise.all([
        supabase
          .from("alunos")
          .select("id, nome")
          .order("nome", { ascending: true }),
        supabase
          .from("produtos")
          .select("id, nome, valor")
          .order("nome", { ascending: true }),
      ]);

      if (alunosRes.error)
        toast.error("Erro ao buscar alunos: " + alunosRes.error.message);
      setAlunosList((alunosRes.data || []) as AlunoParaSelect[]);

      if (produtosRes.error) {
        toast.error("Erro ao buscar produtos: " + produtosRes.error.message);
      } else {
        const produtosData = (produtosRes.data || []).map((p) => ({
          id: p.id,
          nome: p.nome,
          valor: p.valor,
        })) as ProdutoParaSelect[];
        setProdutosList(produtosData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados para selects:", error);
      toast.error("Falha ao carregar dados auxiliares.");
    } finally {
      setIsLoadingSelectData(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      await checkUserAndActiveCaixa();
      await fetchDadosParaSelects();
      setLoading(false);
    };
    initialLoad();
  }, [checkUserAndActiveCaixa, fetchDadosParaSelects]);

  useEffect(() => {
    if (activeCaixa) {
      console.log(activeCaixa);
      fetchMovimentacoes(activeCaixa.id);
    } else {
      setMovimentacoes([]); // Limpa se não houver caixa ativo
    }
  }, [activeCaixa, fetchMovimentacoes]);

  const adjustString = (text: string) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const totalRows = movimentacoes.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRows);

  const currentData = movimentacoes
    .filter((item) => {
      const searchTerm = adjustString(inputSearch);
      const itemTipo = item.tipo ? adjustString(item.tipo) : "";
      const itemDescricao = item.descricao ? adjustString(item.descricao) : "";
      return (
        itemTipo.includes(searchTerm) || itemDescricao.includes(searchTerm)
      );
    })
    .slice(startIndex, endIndex);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  const handleNovaMovimentacaoClick = () => {
    if (!currentUser) {
      toast.warn("Usuário não autenticado.");
      return;
    }
    if (activeCaixa && activeCaixa.usuario_id === currentUser.id) {
      setIsCaixaModalOpen(true);
    } else {
      setShowAbrirCaixaModal(true);
    }
  };

  const handleCloseCaixaModal = () => setIsCaixaModalOpen(false);
  const handleCloseAbrirCaixaModal = () => setShowAbrirCaixaModal(false);
  const handleCloseFecharCaixaModal = () => setShowFecharCaixaModal(false);

  const handleAbrirModalFechamento = () => {
    if (!activeCaixa) {
      toast.info("Nenhum caixa ativo para fechar.");
      return;
    }
    setShowFecharCaixaModal(true);
  };

  const handleAbrirCaixa = async (formData: AbrirCaixaFormData) => {
    if (!currentUser) return;
    setIsSubmittingCaixaAction(true);
    try {
      const { data: novoCaixa, error } = await supabase
        .from("caixas")
        .insert([
          {
            usuario_id: currentUser.id,
            valor_inicial: formData.valorInicial,
            status: "aberto",
            observacoes_abertura: formData.observacoesAbertura,
          },
        ])
        .select(
          "id, usuario_id, valor_inicial, data_abertura, observacoes_abertura"
        )
        .single();

      if (error) throw error;

      if (novoCaixa) {
        setActiveCaixa({
          id: novoCaixa.id,
          usuario_id: novoCaixa.usuario_id,
          valor_inicial: Number(novoCaixa.valor_inicial || 0),
          data_abertura: novoCaixa.data_abertura,
          observacoes_abertura: novoCaixa.observacoes_abertura,
        });
        setShowAbrirCaixaModal(false);
        setIsCaixaModalOpen(true);
        toast.success("Caixa aberto com sucesso!");
      }
    } catch (error: any) {
      console.error("Erro ao abrir caixa:", error);
      toast.error("Erro ao abrir caixa: " + error.message);
    } finally {
      setIsSubmittingCaixaAction(false);
    }
  };

  const handleSaveMovimentacao = async (data: Partial<CaixaModalFormData>) => {
    if (
      !activeCaixa ||
      !currentUser ||
      activeCaixa.usuario_id !== currentUser.id
    ) {
      toast.error("Nenhum caixa ativo para este usuário. Operação cancelada.");
      return;
    }
    setIsSubmittingCaixaAction(true);
    const payloadParaSupabase: any = {
      tipo: data.tipoMovimentacao,
      valor: data.valor,
      forma_pagamento: data.forma_pagamento_id,
      descricao: data.descricao,
      cliente_id: data.cliente_id,
      produto_id: data.produto_id,
      caixa_id: activeCaixa.id,
      usuario_id_transacao: currentUser.id,
    };

    Object.keys(payloadParaSupabase).forEach(
      (key) =>
        (payloadParaSupabase[key] === undefined ||
          payloadParaSupabase[key] === "") &&
        delete payloadParaSupabase[key]
    );

    const { error } = await supabase
      .from("financeiro")
      .insert([payloadParaSupabase]);

    if (error) {
      toast.error("Erro ao registrar movimentação: " + error.message);
      console.error("Supabase insert error handleSaveMovimentacao:", error);
    } else {
      toast.success("Movimentação registrada com sucesso!");
      fetchMovimentacoes(activeCaixa.id);
      handleCloseCaixaModal();
    }
    setIsSubmittingCaixaAction(false);
  };

  // Dentro do componente Caixa.tsx

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

  const handleConfirmarFechamentoCaixa = async (
    formData: FecharCaixaFormData
  ) => {
    if (
      !activeCaixa ||
      !currentUser ||
      activeCaixa.usuario_id !== currentUser.id
    ) {
      toast.error("Nenhum caixa ativo para este usuário.");
      return;
    }
    setIsSubmittingCaixaAction(true);
    try {
      const { data: transacoes, error: transacoesError } = await supabase
        .from("financeiro")
        .select("tipo, valor, descricao, forma_pagamento, created_at")
        .eq("caixa_id", activeCaixa.id);

      if (transacoesError) throw transacoesError;

      let totalEntradas = 0;
      let totalSaidas = 0;
      (transacoes || []).forEach((t) => {
        if (t.tipo === "pagamento" || t.tipo === "venda") {
          totalEntradas += Number(t.valor);
        } else if (t.tipo === "saida") {
          totalSaidas += Number(t.valor);
        }
      });
      const saldoFinalCaixa =
        (activeCaixa.valor_inicial || 0) + totalEntradas - totalSaidas;

      const payloadUpdateCaixa = {
        status: "fechado",
        data_fechamento: new Date().toISOString(),
        observacoes_fechamento: formData.observacoes_fechamento || null,
        valor_total_entradas: totalEntradas,
        valor_total_saidas: totalSaidas,
        saldo_final_calculado: saldoFinalCaixa,
      };

      const { error: updateError } = await supabase
        .from("caixas")
        .update(payloadUpdateCaixa)
        .eq("id", activeCaixa.id);

      if (updateError) throw updateError;

      generatePDFFechamentoCaixa(
        activeCaixa,
        transacoes || [],
        {
          entradas: totalEntradas,
          saidas: totalSaidas,
          saldo: saldoFinalCaixa,
        },
        formData.observacoes_fechamento
      );

      toast.success("Caixa fechado com sucesso!");
      setActiveCaixa(null);
      setShowFecharCaixaModal(false);
      fetchMovimentacoes();
    } catch (error: any) {
      console.error("Erro ao fechar caixa:", error);
      toast.error("Erro ao fechar caixa: " + error.message);
    } finally {
      setIsSubmittingCaixaAction(false);
    }
  };

  return (
    <Styles.Container>
      <Styles.Header>
        <div>
          <Styles.Title>Caixa</Styles.Title>
          <Styles.Subtitle>
            {activeCaixa
              ? `Caixa Aberto (ID: ${activeCaixa.id.substring(
                  0,
                  6
                )}... VI: ${Number(
                  activeCaixa.valor_inicial || 0
                ).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })})`
              : "Nenhum caixa aberto para o seu usuário."}
          </Styles.Subtitle>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {activeCaixa &&
            currentUser &&
            activeCaixa.usuario_id === currentUser.id && (
              <Styles.FecharCaixaButton
                onClick={handleAbrirModalFechamento}
                disabled={isSubmittingCaixaAction}
              >
                Fechar Caixa
              </Styles.FecharCaixaButton>
            )}
          <Styles.CadastrarButton
            onClick={handleNovaMovimentacaoClick}
            disabled={
              isLoadingSelectData || !currentUser || isSubmittingCaixaAction
            }
          >
            <FiPlus /> Nova Movimentação
          </Styles.CadastrarButton>
        </div>
      </Styles.Header>

      {onLoading &&
      !isCaixaModalOpen &&
      !showAbrirCaixaModal &&
      !showFecharCaixaModal ? (
        <Styles.LoaderDiv>
          <Loader color="#000" />
        </Styles.LoaderDiv>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div style={{ width: "100%", maxWidth: 500 }}>
              <Styles.Input
                value={inputSearch}
                onChange={(e) => setInputSearch(e.target.value)}
                placeholder="Pesquisar por Tipo ou Descrição..."
              />
            </div>
          </div>
          <DefaultTable
            data={currentData}
            columns={columns}
            rowsPerPage={rowsPerPage}
            currentPage={currentPage}
            totalRows={totalRows}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </>
      )}

      {showAbrirCaixaModal && currentUser && (
        <AbrirCaixaModal
          open={showAbrirCaixaModal}
          onClose={handleCloseAbrirCaixaModal}
          onAbrirCaixa={handleAbrirCaixa}
          userName={currentUser.email || "Usuário"}
        />
      )}

      {isCaixaModalOpen && activeCaixa && currentUser && (
        <CaixaModal
          open={isCaixaModalOpen}
          onClose={handleCloseCaixaModal}
          onSave={handleSaveMovimentacao}
          alunosList={alunosList}
          produtosList={produtosList}
          formasPagamentoList={formasPagamentoList}
        />
      )}

      {showFecharCaixaModal && activeCaixa && currentUser && (
        <FecharCaixaModal
          open={showFecharCaixaModal}
          onClose={handleCloseFecharCaixaModal}
          onConfirmFechar={handleConfirmarFechamentoCaixa}
          caixaId={activeCaixa.id}
        />
      )}
      <ToastContainer autoClose={3000} hideProgressBar />
    </Styles.Container>
  );
};

export default Caixa;
