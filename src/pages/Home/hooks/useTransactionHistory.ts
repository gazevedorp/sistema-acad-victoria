import { useState, useCallback, useEffect } from "react";
import { fetchTransactionHistory, FinanceiroItem } from "../services/homeServices";

export const useTransactionHistory = (isOpen: boolean, activeCaixaId: string | null) => {
  const [transactions, setTransactions] = useState<FinanceiroItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("todos");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);

  const loadTransactions = useCallback(async (caixaId: string | null) => {
    if (!caixaId) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchTransactionHistory(caixaId);
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const adjustSearchString = useCallback((text: string | null | undefined): string => {
    if (!text) return "";
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }, []);

  const filteredTransactions = transactions.filter(item => {
    const searchTermLower = adjustSearchString(searchTerm);
    const matchesSearchTerm =
      adjustSearchString(item.tipo).includes(searchTermLower) ||
      adjustSearchString(item.forma_pagamento).includes(searchTermLower) ||
      adjustSearchString(item.descricao).includes(searchTermLower) ||
      adjustSearchString(item.cliente_nome).includes(searchTermLower) ||
      adjustSearchString(item.produto_nome).includes(searchTermLower) ||
      adjustSearchString(String(item.valor)).includes(searchTermLower);

    const matchesFilterType = filterType === "todos" || item.tipo === filterType;

    return matchesSearchTerm && matchesFilterType;
  });

  const currentTableData = filteredTransactions.slice(
    (currentPage - 1) * rowsPerPage,
    ((currentPage - 1) * rowsPerPage) + rowsPerPage
  );

  useEffect(() => {
    if (isOpen && activeCaixaId) {
      loadTransactions(activeCaixaId);
    } else if (!isOpen) {

      setTransactions([]);
      setSearchTerm("");
      setFilterType("todos");
      setCurrentPage(1);
      setIsLoading(true);
    }
  }, [isOpen, activeCaixaId, loadTransactions]);

  return {
    transactions,
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
  };
};