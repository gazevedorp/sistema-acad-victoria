import React, { useEffect, useState, useCallback } from "react";
import DefaultTable, { TableColumn } from "../../components/Table/DefaultTable";
import { supabase } from "../../lib/supabase.ts";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "../../components/Loader/Loader.tsx";
import * as Styles from "./Products.styles.ts";
import { Product } from "../../types/ProductType.ts";
import ProdutoModal from "./components/ProdutoModal/ProdutoModal.tsx";
import { ModalMode } from "./components/ProdutoModal/ProdutoModal.definitions.ts";
import { FiPlus } from "react-icons/fi";

const columns: TableColumn<Product>[] = [
  { field: "nome", header: "Nome" },
  { field: "valor", header: "Valor", formatter: "money" },
  { field: "ativo", header: "Status", formatter: "status" },
];

const Produtos: React.FC = () => {
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.CREATE);
  const [selectedProduto, setSelectedProduto] = useState<Product | null>(null);

  const fetchProdutos = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .order("nome", { ascending: true });
    if (error) {
      toast.error("Erro ao buscar produtos.");
      console.error("Supabase error:", error);
      setProdutos([]);
    } else if (data) {
      setProdutos(data as Product[]);
    } else {
      setProdutos([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  const normalizeText = (text: string | undefined | null): string => {
    if (!text) return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const filteredProdutos = produtos.filter((produto) =>
    normalizeText(produto.nome).includes(normalizeText(searchTerm))
  );

  const totalRows = filteredProdutos.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
  const currentData = filteredProdutos.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setSelectedProduto(null);
    setModalMode(ModalMode.CREATE);
    setModalOpen(true);
  };

  const openEditModal = (produto: Product) => {
    setSelectedProduto(produto);
    setModalMode(ModalMode.EDIT);
    setModalOpen(true);
  };

  const openViewModal = (produto: Product) => {
    setSelectedProduto(produto);
    setModalMode(ModalMode.VIEW);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProduto(null);
  };

  const handleSaveComplete = useCallback(
    (error: any | null, _savedData?: Product, operationMode?: ModalMode) => {
      if (error) {
        toast.error(
          `Erro ao ${
            operationMode === ModalMode.CREATE ? "cadastrar" : "atualizar"
          } produto: ${error.message || "Erro desconhecido"}`
        );
      } else {
        toast.success(
          `Produto ${
            operationMode === ModalMode.CREATE ? "cadastrado" : "atualizado"
          } com sucesso!`
        );
        fetchProdutos();
        handleCloseModal();
      }
    },
    [fetchProdutos]
  );

  const getInitialModalData = (): Partial<Product> | undefined => {
    if ((modalMode === ModalMode.EDIT || modalMode === ModalMode.VIEW) && selectedProduto) {
      return selectedProduto;
    }
    return undefined;
  };

  return (
    <Styles.Container>
      <Styles.Header>
        <div>
          <Styles.Title>Produtos</Styles.Title>
          <Styles.Subtitle>Cadastre e gerencie os Produtos</Styles.Subtitle>
        </div>
        <Styles.CadastrarButton onClick={openCreateModal}>
          <FiPlus /> Novo Produto
        </Styles.CadastrarButton>
      </Styles.Header>

      {isLoading && !modalOpen ? (
        <Styles.LoaderDiv>
          <Loader color="#000" />
        </Styles.LoaderDiv>
      ) : (
        <>
          <div style={{ maxWidth: 400, marginBottom: '20px' }}>
            <Styles.Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar Produto por Nome"
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
            showActions={true}
            onEdit={openEditModal}
            onView={openViewModal}
            noDelete={true}
          />
        </>
      )}

      {modalOpen && (
        <ProdutoModal
          open={modalOpen}
          mode={modalMode}
          initialData={getInitialModalData()}
          produtoIdToEdit={ (modalMode === ModalMode.EDIT || modalMode === ModalMode.VIEW) && selectedProduto ? selectedProduto.id : undefined}
          onClose={handleCloseModal}
          onSaveComplete={handleSaveComplete}
        />
      )}
      <ToastContainer autoClose={3000} hideProgressBar />
    </Styles.Container>
  );
};

export default Produtos;
