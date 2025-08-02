import React, { useEffect, useState } from "react";
import DefaultTable, { TableColumn } from "../../components/Table/DefaultTable";
import { supabase } from "../../lib/supabase.ts";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Loader from "../../components/Loader/Loader.tsx";
import * as Styles from "./Products.styles.ts";
import { Product } from "../../types/ProductType.ts";
import ProductModal from "./components/ProductModal/ProductModal.tsx";
import { FaPlus } from "react-icons/fa";

const Produtos: React.FC = () => {
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [onLoading, setLoading] = useState<boolean>(false);
  const [inputSearch, setInputSearch] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [totalRows, setTotalRows] = useState<number>(0);

  // Debounce hook
  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedSearchTerm = useDebounce(inputSearch, 500);

  const columns: TableColumn<Product>[] = [
    { field: "nome", header: "Nome", width: 300 },
    { field: "valor", header: "Valor", formatter: "money", width: 150 },
    { field: "ativo", header: "Status", formatter: "status", width: 100, textAlign: 'center' },
  ];

  useEffect(() => {
    fetchProdutos();
  }, []);

  // Efeito para buscar quando o termo de busca mudar (com debounce)
  useEffect(() => {
    fetchProdutos(debouncedSearchTerm, currentPage, rowsPerPage);
  }, [debouncedSearchTerm, currentPage, rowsPerPage]);

  const fetchProdutos = async (searchQuery: string = "", page: number = 1, pageSize: number = 10) => {
    try {
      setLoading(true);
      let query = supabase
        .from("produtos")
        .select("*", { count: 'exact' })
        .order("nome", { ascending: true });

      // Aplicar filtro de busca se fornecido
      if (searchQuery.trim()) {
        query = query.ilike('nome', `%${searchQuery}%`);
      }

      // Aplicar paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        toast.error("Erro ao buscar produtos.");
        throw error;
      }
      if (data) {
        setProdutos(data as Product[]);
        setTotalRows(count || 0);
      }
    } catch (err) {
      console.error("Erro ao buscar produtos:", err);
      setProdutos([]);
      setTotalRows(0);
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
        fetchProdutos(debouncedSearchTerm, currentPage, rowsPerPage); // Refresh the list
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

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
                onChange={(e) => {
                  setInputSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Pesquisar Produto"
              />
            </div>
            <Styles.Button onClick={handleOpenCreateModal}> {/* Changed from Styles.CreateButton */}
              <FaPlus style={{ marginRight: '8px' }} />
              Novo Produto
            </Styles.Button>
          </div>
          <DefaultTable
            data={produtos}
            columns={columns}
            rowsPerPage={rowsPerPage}
            currentPage={currentPage}
            totalRows={totalRows}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            onRowClick={handleOpenEditModal}
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
