// src/pages/FormasPagamento/FormasPagamento.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { FiPlus } from "react-icons/fi";
import * as Styles from "./FormasPagamento.styles";
import { supabase } from "../../lib/supabase";
import { FormaPagamento, FormaPagamentoFormData } from "../../types/FormaPagamentoTypes";
import DefaultTable, { TableColumn } from "../../components/Table/DefaultTable";
import Loader from "../../components/Loader/Loader";
import FormaPagamentoModal from "./components/FormaPagamentoModal/FormaPagamentoModal";
import { ModalMode } from "./components/FormaPagamentoModal/FormaPagamentoModal.definitions";

const FormasPagamento: React.FC = () => {
  // State management
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.CREATE);
  const [selectedFormaPagamento, setSelectedFormaPagamento] = useState<FormaPagamento | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch formas de pagamento from database
  const fetchFormasPagamento = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("formas_pagamento")
        .select("*")
        .order("nome", { ascending: true });

      if (error) {
        console.error("Error fetching formas de pagamento:", error);
        toast.error("Erro ao carregar formas de pagamento.");
        return;
      }

      setFormasPagamento(data || []);
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Erro inesperado ao carregar formas de pagamento.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFormasPagamento();
  }, [fetchFormasPagamento]);

  // Filter data based on search input
  const filteredData = useMemo(() => {
    if (!searchInput.trim()) return formasPagamento;
    
    const searchTerm = searchInput.toLowerCase();
    return formasPagamento.filter(
      (forma) =>
        forma.nome.toLowerCase().includes(searchTerm) ||
        forma.descricao?.toLowerCase().includes(searchTerm)
    );
  }, [formasPagamento, searchInput]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  // Table columns configuration
  const tableColumns: TableColumn<FormaPagamento>[] = [
    { field: "nome", header: "Nome" },
    { field: "descricao", header: "Descrição" },
    {
      field: "ativo_venda",
      header: "Vendas",
      render: (forma) => (
        <Styles.StatusBadge ativo={forma.ativo_venda}>
          {forma.ativo_venda ? "Ativa" : "Inativa"}
        </Styles.StatusBadge>
      ),
      textAlign: "center",
    },
    {
      field: "ativo_mensalidade",
      header: "Mensalidades",
      render: (forma) => (
        <Styles.StatusBadge ativo={forma.ativo_mensalidade}>
          {forma.ativo_mensalidade ? "Ativa" : "Inativa"}
        </Styles.StatusBadge>
      ),
      textAlign: "center",
    },
  ];

  // Modal handlers
  const openCreateModal = () => {
    setSelectedFormaPagamento(null);
    setModalMode(ModalMode.CREATE);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFormaPagamento(null);
    setIsSubmitting(false);
  };

  // Handle row click to edit
  const handleRowClick = (forma: FormaPagamento) => {
    setSelectedFormaPagamento(forma);
    setModalMode(ModalMode.EDIT);
    setIsModalOpen(true);
  };
  const handleSave = async (data: FormaPagamentoFormData) => {
    setIsSubmitting(true);
    try {
      if (modalMode === ModalMode.CREATE) {
        const { error } = await supabase
          .from("formas_pagamento")
          .insert([{
            nome: data.nome,
            descricao: data.descricao || null,
            ativo_venda: data.ativo_venda,
            ativo_mensalidade: data.ativo_mensalidade,
          }]);

        if (error) throw error;
        toast.success("Forma de pagamento criada com sucesso!");
      } else if (modalMode === ModalMode.EDIT && selectedFormaPagamento) {
        const { error } = await supabase
          .from("formas_pagamento")
          .update({
            nome: data.nome,
            descricao: data.descricao || null,
            ativo_venda: data.ativo_venda,
            ativo_mensalidade: data.ativo_mensalidade,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedFormaPagamento.id);

        if (error) throw error;
        toast.success("Forma de pagamento atualizada com sucesso!");
      }

      await fetchFormasPagamento();
      closeModal();
    } catch (error: any) {
      console.error("Error saving forma de pagamento:", error);
      toast.error(`Erro ao salvar: ${error.message || "Erro desconhecido"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save forma de pagamento (create or update)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F4" && !isModalOpen) {
        event.preventDefault();
        openCreateModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  return (
    <Styles.Container>
      <Styles.Header>
        <Styles.Title>Formas de Pagamento</Styles.Title>
      </Styles.Header>

      {isLoading ? (
        <Styles.LoaderContainer>
          <Loader color="#0898e6" />
        </Styles.LoaderContainer>
      ) : (
        <>
          <Styles.ActionsSection>
            <Styles.SearchContainer>
              <Styles.SearchInput
                type="text"
                placeholder="Pesquisar por nome ou descrição..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </Styles.SearchContainer>
            <Styles.CadastrarButton onClick={openCreateModal}>
              <FiPlus /> Nova Forma de Pagamento [F4]
            </Styles.CadastrarButton>
          </Styles.ActionsSection>

          {filteredData.length === 0 ? (
            <Styles.EmptyState>
              {searchInput ? "Nenhuma forma de pagamento encontrada." : "Nenhuma forma de pagamento cadastrada."}
            </Styles.EmptyState>
          ) : (
            <DefaultTable
              data={paginatedData}
              columns={tableColumns}
              rowsPerPage={rowsPerPage}
              currentPage={currentPage}
              totalRows={filteredData.length}
              onPageChange={setCurrentPage}
              onRowsPerPageChange={(newRowsPerPage) => {
                setRowsPerPage(newRowsPerPage);
                setCurrentPage(1);
              }}
              onRowClick={handleRowClick}
            />
          )}
        </>
      )}

      {isModalOpen && (
        <FormaPagamentoModal
          open={isModalOpen}
          mode={modalMode}
          onClose={closeModal}
          onSave={handleSave}
          isSubmitting={isSubmitting}
          initialData={selectedFormaPagamento ? {
            nome: selectedFormaPagamento.nome,
            descricao: selectedFormaPagamento.descricao,
            ativo_venda: selectedFormaPagamento.ativo_venda,
            ativo_mensalidade: selectedFormaPagamento.ativo_mensalidade,
          } : undefined}
        />
      )}
    </Styles.Container>
  );
};

export default FormasPagamento;
