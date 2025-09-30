import React, { useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';

import * as Styles from './TransactionHistoryModal.styles';
import Loader from '../../../../components/Loader/Loader';
import DefaultTable, { TableColumn } from '../../../../components/Table/DefaultTable';
import { useTransactionHistory } from '../../hooks/useTransactionHistory';
import { FinanceiroItem } from '../../services/homeServices';


const financeTableColumns: TableColumn<FinanceiroItem>[] = [
  { field: "created_at", header: "Data", formatter: "dateTimeVarchar" },
  { field: "forma_pagamento", header: "Pagamento" },
  { field: "valor", header: "Valor", formatter: "money" },
  { field: "descricao", header: "Descrição" },
  { field: "cliente_nome", header: "Cliente" },
  { field: "produto_nome", header: "Produto" },
];


interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  activeCaixaId: string | null;
}

const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  isOpen,
  onClose,
  activeCaixaId,
}) => {
  const {
    isLoading,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    filteredTransactions,
    currentTableData,
  } = useTransactionHistory(isOpen, activeCaixaId);


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, [setCurrentPage]);

  const handleRowsPerPageChange = useCallback((rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  }, [setRowsPerPage, setCurrentPage]);

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
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
            <Styles.Select
              value={filterType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value)}
            >
              <option value="todos">Todos os tipos</option>
              <option value="pagamento">Pagamentos</option>
              <option value="venda">Vendas</option>
              <option value="saida">Saídas</option>
            </Styles.Select>
          </Styles.ControlsContainer>

          {isLoading ? (
            <Styles.LoaderDiv>
              <Loader color="#000" />
            </Styles.LoaderDiv>
          ) : (
            <DefaultTable
              data={currentTableData}
              columns={financeTableColumns}
              rowsPerPage={rowsPerPage}
              currentPage={currentPage}
              totalRows={filteredTransactions.length}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              noDelete
            />
          )}
        </Styles.ModalBody>
      </Styles.ModalContent>
    </Styles.ModalBackdrop>
  );
};

export default TransactionHistoryModal;