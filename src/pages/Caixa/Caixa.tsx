import React, { useEffect, useState, useCallback } from "react";
import DefaultTable, { TableColumn } from "../../components/Table/DefaultTable";
import { supabase } from "../../lib/supabase";
import { toast, ToastContainer } from "react-toastify";
import Loader from "../../components/Loader/Loader";
import * as Styles from "./Caixa.styles";
import { FiPlus } from "react-icons/fi";

import CaixaModal from "./components/CaixaModal/CaixaModal";
import { 
    CaixaModalFormData,
    AlunoParaSelect,
    ProdutoParaSelect,
    FormaPagamentoParaSelect 
} from "./components/CaixaModal/CaixaModal.definitions";

interface FinanceiroItem {
  id: string;
  created_at: string;
  tipo: string;
  forma_pagamento: string;
  valor: number;
  descricao?: string;
  cliente_id?: string;
  produto_id?: string;
  nome?: string; 
}

const columns: TableColumn<FinanceiroItem>[] = [
  { field: "tipo", header: "Tipo" },
  { field: "forma_pagamento", header: "Pagamento" },
  { field: "valor", header: "Valor", formatter: "money" },
  { field: "descricao", header: "Descrição"},
];

// Definindo as formas de pagamento fixas
const HARDCODED_FORMAS_PAGAMENTO: FormaPagamentoParaSelect[] = [
    { id: 'dinheiro', nome: 'Dinheiro' },
    { id: 'pix', nome: 'PIX' },
    { id: 'debito', nome: 'Cartão de Débito' },
];

const Caixa: React.FC = () => {
  const [movimentacoes, setMovimentacoes] = useState<FinanceiroItem[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [onLoading, setLoading] = useState<boolean>(false);
  const [inputSearch, setInputSearch] = useState<string>("");

  const [isCaixaModalOpen, setIsCaixaModalOpen] = useState(false);
  const [alunosList, setAlunosList] = useState<AlunoParaSelect[]>([]);
  const [produtosList, setProdutosList] = useState<ProdutoParaSelect[]>([]);
  // Formas de pagamento agora usa o array fixo
  const [formasPagamentoList, setFormasPagamentoList] = useState<FormaPagamentoParaSelect[]>(HARDCODED_FORMAS_PAGAMENTO);
  const [isLoadingSelectData, setIsLoadingSelectData] = useState(false);

  const fetchMovimentacoes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("financeiro")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        toast.error("Erro ao buscar movimentações financeiras.");
        console.error("Supabase error fetchMovimentacoes:", error);
        return;
      }
      if (data) {
        setMovimentacoes(data as FinanceiroItem[]);
      }
    } catch (err) {
      console.error("Erro ao buscar movimentações:", err);
      toast.error("Erro inesperado ao buscar movimentações.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDadosParaSelects = useCallback(async () => {
    setIsLoadingSelectData(true);
    try {
      // Removida a busca por formas_pagamento, agora é fixo
      const [alunosRes, produtosRes] = await Promise.all([
        supabase.from("alunos").select("id, nome"),
        supabase.from("produtos").select("id, nome, valor"), // Alterado de preco_venda para valor
      ]);

      if (alunosRes.error) toast.error("Erro ao buscar alunos para select: " + alunosRes.error.message);
      if (produtosRes.error) {
        toast.error("Erro ao buscar produtos para select: " + produtosRes.error.message);
      } else {
        // Ajuste para o tipo ProdutoParaSelect esperar 'valor'
        const produtosData = (produtosRes.data || []).map(p => ({
            id: p.id,
            nome: p.nome,
            valor: p.valor, // Mapeando para 'valor' se ProdutoParaSelect esperar 'valor'
        })) as ProdutoParaSelect[]; // O tipo ProdutoParaSelect em definitions deve ter 'valor'
        setProdutosList(produtosData);
      }
      
      setAlunosList((alunosRes.data || []) as AlunoParaSelect[]);
      // setFormasPagamentoList é definido com HARDCODED_FORMAS_PAGAMENTO
    } catch (error) {
        console.error("Erro ao carregar dados para os selects do modal:", error);
        toast.error("Falha ao carregar dados auxiliares para o modal.");
    } finally {
        setIsLoadingSelectData(false);
    }
  }, []);


  useEffect(() => {
    fetchMovimentacoes();
    fetchDadosParaSelects();
  }, [fetchMovimentacoes, fetchDadosParaSelects]);

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
        return itemTipo.includes(searchTerm) || itemDescricao.includes(searchTerm);
    })
    .slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  const openCaixaModal = () => {
    setIsCaixaModalOpen(true);
  };

  const handleCloseCaixaModal = () => {
    setIsCaixaModalOpen(false);
  };

  const handleSaveMovimentacao = async (data: Partial<CaixaModalFormData>) => {
    const payloadParaSupabase: any = {
      tipo: data.tipoMovimentacao,
      valor: data.valor,
      forma_pagamento: data.forma_pagamento_id, 
      descricao: data.descricao,
      cliente_id: data.cliente_id,
      produto_id: data.produto_id,
    };

    Object.keys(payloadParaSupabase).forEach(key => 
      (payloadParaSupabase[key] === undefined || payloadParaSupabase[key] === '') && delete payloadParaSupabase[key]
    );

    const { error } = await supabase.from('financeiro').insert([payloadParaSupabase]);

    if (error) {
      toast.error("Erro ao registrar movimentação: " + error.message);
      console.error("Supabase insert error handleSaveMovimentacao:", error);
    } else {
      toast.success("Movimentação registrada com sucesso!");
      fetchMovimentacoes(); 
      handleCloseCaixaModal();
    }
  };

  return (
    <Styles.Container>
      <Styles.Header>
        <div>
          <Styles.Title>Caixa</Styles.Title>
          <Styles.Subtitle>
            Cadastre e gerencie as movimentações de caixa
          </Styles.Subtitle>
        </div>
        <Styles.CadastrarButton onClick={openCaixaModal} disabled={isLoadingSelectData}>
          <FiPlus /> Nova Movimentação
        </Styles.CadastrarButton>
      </Styles.Header>

      {(onLoading || isLoadingSelectData) && !isCaixaModalOpen ? (
        <Styles.LoaderDiv>
          <Loader color="#000" />
        </Styles.LoaderDiv>
      ) : (
        <>
          <div style={{ maxWidth: 400, marginBottom: '20px' }}>
            <Styles.Input
              value={inputSearch}
              onChange={(e) => setInputSearch(e.target.value)}
              placeholder="Pesquisar por Tipo ou Descrição..."
            />
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

      {isCaixaModalOpen && (
        <CaixaModal
          open={isCaixaModalOpen}
          onClose={handleCloseCaixaModal}
          onSave={handleSaveMovimentacao}
          alunosList={alunosList}
          produtosList={produtosList}
          formasPagamentoList={formasPagamentoList} 
        />
      )}
      <ToastContainer autoClose={3000} hideProgressBar />
    </Styles.Container>
  );
};

export default Caixa;