import React, { useEffect, useState, useCallback } from 'react';
import * as Styles from './TransactionHistoryModal.styles';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../../../lib/supabase'; // Adjusted path
import Loader from '../../../../components/Loader/Loader'; // Adjusted path
import DefaultTable, { TableColumn } from '../../../../components/Table/DefaultTable'; // Adjusted path
// import { FiSearch } from 'react-icons/fi'; // Icon can be added later if desired next to input

// --- TYPE DEFINITIONS ---
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

const financeTableColumns: TableColumn<FinanceiroItem>[] = [
  { field: "created_at", header: "Data", formatter: "date" }, // Using datetime for more precision
  { field: "forma_pagamento", header: "Pagamento" },
  { field: "valor", header: "Valor", formatter: "money" },
  { field: "descricao", header: "Descrição" },
  { field: "cliente_nome", header: "Cliente" },
  { field: "produto_nome", header: "Produto" },
];

// --- UTILITY FUNCTIONS ---
const adjustCaixaSearchString = (text: string | null | undefined): string => {
  if (!text) return "";
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  activeCaixaId: string | null;
}

const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  isOpen,
  onClose,
  currentUser, // currentUser is available, but not directly used in this snippet for table display logic
  activeCaixaId,
}) => {
  const [transactions, setTransactions] = useState<FinanceiroItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("todos");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  const fetchTransactions = useCallback(async (caixaId: string | null) => {
    if (!caixaId) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("financeiro")
        .select("*, clientes:cliente_id(nome), produtos:produto_id(nome)")
        .eq("caixa_id", caixaId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching transactions:", error);
        // Consider setting an error state and displaying a toast or message
        setTransactions([]);
      } else if (data) {
        setTransactions(data.map(i => ({ ...i, cliente_nome: (i.clientes as any)?.nome, produto_nome: (i.produtos as any)?.nome })) as FinanceiroItem[]);
      }
    } catch (err) {
      console.error("Unexpected error fetching transactions:", err);
      // Consider setting an error state
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && activeCaixaId) {
      fetchTransactions(activeCaixaId);
    } else if (!isOpen) {
      // Reset state when modal is closed
      setTransactions([]);
      setSearchTerm("");
      setFilterType("todos");
      setCurrentPage(1);
      setIsLoading(true); // Reset loading state for next open
    }
  }, [isOpen, activeCaixaId, fetchTransactions]);

  const filteredTransactions = transactions.filter(item => {
    const searchTermLower = adjustCaixaSearchString(searchTerm);
    const matchesSearchTerm =
      adjustCaixaSearchString(item.tipo).includes(searchTermLower) ||
      adjustCaixaSearchString(item.forma_pagamento).includes(searchTermLower) ||
      adjustCaixaSearchString(item.descricao).includes(searchTermLower) ||
      adjustCaixaSearchString(item.cliente_nome).includes(searchTermLower) ||
      adjustCaixaSearchString(item.produto_nome).includes(searchTermLower) ||
      adjustCaixaSearchString(String(item.valor)).includes(searchTermLower);

    const matchesFilterType = filterType === "todos" || item.tipo === filterType;

    return matchesSearchTerm && matchesFilterType;
  });

  const currentTableData = filteredTransactions.slice(
    (currentPage - 1) * rowsPerPage,
    ((currentPage - 1) * rowsPerPage) + rowsPerPage
  );

  if (!isOpen) {
    return null;
  }

  return (
    <Styles.ModalBackdrop onClick={onClose}>
      <Styles.ModalContent onClick={(e) => e.stopPropagation()}>
        <Styles.ModalHeader>
          <h2>Histórico de Transações do Caixa</h2>
          <Styles.CloseButton onClick={onClose}>&times;</Styles.CloseButton>
        </Styles.ModalHeader>
        <Styles.ModalBody>
          <Styles.ControlsContainer>
            <Styles.Input
              type="text"
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
            />
            <Styles.Select value={filterType} onChange={(e) => {setFilterType(e.target.value); setCurrentPage(1);}}>
              <option value="todos">Todos os Tipos</option>
              <option value="pagamento">Pagamento</option>
              <option value="venda">Venda</option>
              <option value="saida">Saída</option>
              {/* TODO: Consider dynamically populating types if they can vary more */}
            </Styles.Select>
          </Styles.ControlsContainer>

          {isLoading ? (
            <Styles.LoaderDiv>
              <Loader />
            </Styles.LoaderDiv>
          ) : (
            <DefaultTable
              columns={financeTableColumns}
              data={currentTableData}
              rowsPerPage={rowsPerPage}
              currentPage={currentPage}
              totalRows={filteredTransactions.length}
              onPageChange={setCurrentPage}
              onRowsPerPageChange={(r) => { setRowsPerPage(r); setCurrentPage(1); }}
            />
          )}
        </Styles.ModalBody>
      </Styles.ModalContent>
    </Styles.ModalBackdrop>
  );
};

export default TransactionHistoryModal;
