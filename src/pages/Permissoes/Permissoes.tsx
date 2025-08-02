import React, { useEffect, useState, useCallback } from "react";
import DefaultTable, { TableColumn } from "../../components/Table/DefaultTable";
import { supabase } from "../../lib/supabase";
import { CategoriaPermissao } from "../../types/PermissaoTypes";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "../../components/Loader/Loader";
import * as Styles from "./Permissoes.styles";
import PermissaoModal from "./components/PermissaoModal";
import { FiPlus } from "react-icons/fi";

interface TableFilters {
  search: string;
  currentPage: number;
  rowsPerPage: number;
}

const Permissoes: React.FC = () => {
  const [permissoes, setPermissoes] = useState<CategoriaPermissao[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedPermissao, setSelectedPermissao] = useState<CategoriaPermissao | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [filters, setFilters] = useState<TableFilters>({ search: "", currentPage: 1, rowsPerPage: 10 });
  const [totalRows, setTotalRows] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");

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

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchPermissoes = useCallback(async (searchQuery: string = "", page: number = 1, pageSize: number = 10) => {
    setIsLoading(true);
    setGeneralError(null);
    try {
      let query = supabase
        .from("categoria_permissoes")
        .select("*", { count: 'exact' })
        .eq('ativo', true)
        .order("categoria_usuario", { ascending: true })
        .order("modulo", { ascending: true })
        .order("permissao", { ascending: true });

      // Aplicar filtro de busca se fornecido
      if (searchQuery.trim()) {
        query = query.or(`categoria_usuario.ilike.%${searchQuery}%,modulo.ilike.%${searchQuery}%,permissao.ilike.%${searchQuery}%`);
      }

      // Aplicar paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error("Erro ao buscar permissões:", error.message);
        toast.error("Falha ao carregar permissões.");
        setGeneralError("Não foi possível carregar as permissões.");
        setPermissoes([]);
        setTotalRows(0);
      } else if (data) {
        setPermissoes(data as CategoriaPermissao[]);
        setTotalRows(count || 0);
      }
    } catch (err: any) {
      console.error("Erro inesperado ao buscar permissões:", err.message);
      toast.error("Erro crítico ao buscar permissões.");
      setGeneralError("Ocorreu um erro inesperado.");
      setPermissoes([]);
      setTotalRows(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissoes();
  }, [fetchPermissoes]);

  // Efeito para buscar quando o termo de busca mudar (com debounce)
  useEffect(() => {
    fetchPermissoes(debouncedSearchTerm, filters.currentPage, filters.rowsPerPage);
  }, [debouncedSearchTerm, filters.currentPage, filters.rowsPerPage, fetchPermissoes]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPermissao(null);
  };

  const handleSaveSuccess = () => {
    fetchPermissoes(debouncedSearchTerm, filters.currentPage, filters.rowsPerPage);
    handleModalClose();
  };

  const openCreateModal = () => {
    setSelectedPermissao(null);
    setIsModalOpen(true);
  };

  const openEditModal = (permissao: CategoriaPermissao) => {
    setSelectedPermissao(permissao);
    setIsModalOpen(true);
  };

  const columns: TableColumn<CategoriaPermissao>[] = [
    { field: "categoria_usuario", header: "Categoria", width: 150 },
    { field: "modulo", header: "Módulo", width: 200 },
    { field: "permissao", header: "Permissão", width: 150 },
  ];

  return (
    <Styles.PageContainer>
      <Styles.HeaderContainer>
        <div>
          <Styles.Title>Gestão de Permissões</Styles.Title>
          <Styles.Subtitle>
            Configure as permissões por categoria de usuário.
          </Styles.Subtitle>
        </div>
      </Styles.HeaderContainer>

      {isLoading && !permissoes.length && !generalError ? (
        <Styles.LoaderContainer>
          <Loader color={Styles.COLORS.primary} />
        </Styles.LoaderContainer>
      ) : generalError ? (
        <Styles.ErrorContainer>{generalError}</Styles.ErrorContainer>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ maxWidth: "100%", flexGrow: 1, marginRight: "1rem" }}>
              <Styles.SearchInput
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setFilters(prev => ({ ...prev, currentPage: 1 }));
                }}
                placeholder="Pesquisar por nome, email ou permissão..."
              />
            </div>
            <Styles.AddButton onClick={openCreateModal}>
              <FiPlus size={18} style={{ marginRight: '8px' }} /> Cadastrar Permissão
            </Styles.AddButton>
          </div>

          <DefaultTable
            data={permissoes}
            columns={columns as any}
            rowsPerPage={filters.rowsPerPage}
            currentPage={filters.currentPage}
            totalRows={totalRows}
            onPageChange={(page) => setFilters((prev: TableFilters) => ({ ...prev, currentPage: page }))}
            onRowsPerPageChange={(r) => setFilters((prev: TableFilters) => ({ ...prev, rowsPerPage: r, currentPage: 1 }))}
            onRowClick={openEditModal}
          />
        </>
      )}

      {isModalOpen && (
        <PermissaoModal
          permissao={selectedPermissao}
          onClose={handleModalClose}
          onSaveSuccess={handleSaveSuccess}
        />
      )}
      <ToastContainer autoClose={3000} hideProgressBar />
    </Styles.PageContainer>
  );
};

export default Permissoes;
