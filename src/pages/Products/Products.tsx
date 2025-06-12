import React, { useEffect, useState } from "react";
import DefaultTable, { TableColumn, TableRowActions } from "../../components/Table/DefaultTable"; // Added TableRowActions
import { supabase } from "../../lib/supabase.ts";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Loader from "../../components/Loader/Loader.tsx";
import * as Styles from "./Products.styles.ts"; // Assuming Styles.Button exists or will be created
import { Product } from "../../types/ProductType.ts";
import ProductModal from "./components/ProductModal/ProductModal.tsx";
import ActionsMenu from "../../components/ActionMenu/ActionMenu.tsx"; // Import ActionMenu
import { FaEdit, FaPlus } from "react-icons/fa"; // Import icons for buttons

// Define columns for the table
const getColumns = (
  onEdit: (product: Product) => void,
  // Add onDelete later if needed
  // onDelete: (product: Product) => void,
  activeRowMenu: string | null,
  setActiveRowMenu: (id: string | null) => void
): TableColumn<Product>[] => [
    { field: "nome", header: "Nome" },
    { field: "valor", header: "Valor", formatter: "money" },
    { field: "ativo", header: "Status", formatter: "status" },
    {
      field: "actions",
      header: "Ações",
      render: (product) => (
        <ActionsMenu<Product>
          rowValue={product}
          isOpen={activeRowMenu === product.id}
          onToggle={() => setActiveRowMenu(activeRowMenu === product.id ? null : product.id)}
          onClose={() => setActiveRowMenu(null)}
          onEdit={() => {
            onEdit(product);
            setActiveRowMenu(null); // Close menu after action
          }}
          // Add onDelete prop later
          noDelete={true} // For now, no delete functionality from this menu
        />
      ),
    },
  ];

const Produtos: React.FC = () => {
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [onLoading, setLoading] = useState<boolean>(false);
  const [inputSearch, setInputSearch] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // State for managing which row's ActionMenu is open
  const [activeRowMenu, setActiveRowMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .order("nome", { ascending: true });
      if (error) {
        toast.error("Erro ao buscar produtos.");
        throw error;
      }
      if (data) {
        setProdutos(data as Product[]);
      }
    } catch (err) {
      console.error("Erro ao buscar produtos:", err);
    } finally {
      setLoading(false);
    }
  };

  // Modal handling functions
  const handleOpenCreateModal = () => {
    setEditingProduct(null); // Ensure no product is being edited
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null); // Clear editing product on close
  };

  const handleSaveProduct = async (productData: Product) => {
    setLoading(true);
    try {
      let response;
      if (editingProduct && editingProduct.id) {
        // Editing existing product
        response = await supabase
          .from("produtos")
          .update({
            nome: productData.nome,
            valor: productData.valor,
            ativo: productData.ativo,
          })
          .eq("id", editingProduct.id)
          .select(); // select() to get the updated row back
      } else {
        // Creating new product - Supabase generates ID if not provided and column is configured for it
        // Or, if your DB requires explicit ID, generate one here (e.g., using uuid library)
        response = await supabase
          .from("produtos")
          .insert([
            {
              nome: productData.nome,
              valor: productData.valor,
              ativo: productData.ativo,
            },
          ])
          .select(); // select() to get the inserted row back
      }

      const { data, error } = response;

      if (error) {
        toast.error(`Erro ao salvar produto: ${error.message}`);
        throw error;
      }

      if (data) {
        toast.success(`Produto ${editingProduct ? 'atualizado' : 'criado'} com sucesso!`);
        fetchProdutos(); // Refresh the list
        handleCloseModal();
      } else {
        // This case might indicate an issue if no data is returned without an error
        toast.warn("Operação concluída, mas nenhum dado foi retornado.");
      }
    } catch (err) {
      console.error("Erro ao salvar produto:", err);
      // Toast error is handled within the if(error) block or a general one can be added here
      // toast.error("Falha ao salvar o produto.");
    } finally {
      setLoading(false);
    }
  };

  const adjustString = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const currentData = produtos;
  const filteredData = currentData.filter((item) =>
    adjustString(item.nome)?.includes(adjustString(inputSearch))
  );

  const totalRows = filteredData.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  // Get columns with current state for ActionMenu
  const tableColumns = getColumns(handleOpenEditModal, activeRowMenu, setActiveRowMenu);

  return (
    <Styles.Container>
      <Styles.Header>
        <div>
          <Styles.Title>Gerenciamento de Produtos</Styles.Title>
          <Styles.Subtitle>Cadastre e gerencie os Produtos</Styles.Subtitle>
        </div>
      </Styles.Header>

      {onLoading && !isModalOpen ? (
        <Styles.LoaderDiv>
          <Loader color="#000" />
        </Styles.LoaderDiv>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ maxWidth: "100%", flexGrow: 1, marginRight: "1rem" }}>
              <Styles.Input
                value={inputSearch}
                onChange={(e) => setInputSearch(e.target.value)}
                placeholder="Pesquisar Produto"
              />
            </div>
            <Styles.Button onClick={handleOpenCreateModal}> {/* Changed from Styles.CreateButton */}
              <FaPlus style={{ marginRight: '8px' }} />
              Novo Produto
            </Styles.Button>
          </div>
          <DefaultTable
            data={paginatedData}
            columns={tableColumns} // Use dynamic columns
            rowsPerPage={rowsPerPage}
            currentPage={currentPage}
            totalRows={totalRows}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </>
      )}
      <ToastContainer autoClose={3000} hideProgressBar />

      <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProduct}
        product={editingProduct}
      />
    </Styles.Container>
  );
};

export default Produtos;
