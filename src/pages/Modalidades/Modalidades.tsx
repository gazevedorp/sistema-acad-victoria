import React, { useEffect, useState, useCallback } from "react";
import DefaultTable, { TableColumn } from "../../components/Table/DefaultTable";
import { supabase } from "../../lib/supabase";
import { Modalidade, ModalidadeFormData } from "../../types/ModalidadeTypes";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "../../components/Loader/Loader";
import * as Styles from "./Modalidades.styles";
import ModalidadeModal from "./components/ModalidadeModal/ModalidadeModal";
import { ModalMode } from "./components/ModalidadeModal/ModalidadeModal.definitions";
import { FiPlus } from "react-icons/fi";

interface TableFilters {
  search: string;
  currentPage: number;
  rowsPerPage: number;
}

const Modalidades: React.FC = () => {
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalidadeModalOpen, setIsModalidadeModalOpen] = useState<boolean>(false);
  const [modalidadeModalMode, setModalidadeModalMode] = useState<ModalMode>(ModalMode.CREATE);
  const [selectedModalidade, setSelectedModalidade] = useState<Modalidade | null>(null);
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

  const fetchModalidades = useCallback(async (searchQuery: string = "", page: number = 1, pageSize: number = 10) => {
    setIsLoading(true);
    setGeneralError(null);
    try {
      let query = supabase
        .from("modalidades")
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
        console.error("Erro ao buscar modalidades:", error.message);
        toast.error("Falha ao carregar modalidades.");
        setGeneralError("Não foi possível carregar as modalidades.");
        setModalidades([]);
        setTotalRows(0);
      } else if (data) {
        setModalidades(data as Modalidade[]);
        setTotalRows(count || 0);
      }
    } catch (err: any) {
      console.error("Erro inesperado ao buscar modalidades:", err.message);
      toast.error("Erro crítico ao buscar modalidades.");
      setGeneralError("Ocorreu um erro inesperado.");
      setModalidades([]);
      setTotalRows(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModalidades();
  }, [fetchModalidades]);

  // Efeito para buscar quando o termo de busca mudar (com debounce)
  useEffect(() => {
    fetchModalidades(debouncedSearchTerm, filters.currentPage, filters.rowsPerPage);
  }, [debouncedSearchTerm, filters.currentPage, filters.rowsPerPage, fetchModalidades]);

  const handleCloseModalidadeModal = () => {
    setIsModalidadeModalOpen(false);
    setSelectedModalidade(null);
  };

  const handleModalidadeSaveComplete = (
    error: any | null,
    _savedData?: ModalidadeFormData,
    mode?: ModalMode
  ) => {
    if (error) {
      toast.error(`Erro ao ${mode === ModalMode.CREATE ? 'cadastrar' : 'atualizar'} modalidade: ${error.message || 'Erro desconhecido'}`);
    } else {
      toast.success(`Modalidade ${mode === ModalMode.CREATE ? 'cadastrada' : 'atualizada'} com sucesso!`);
      fetchModalidades(debouncedSearchTerm, filters.currentPage, filters.rowsPerPage);
    }
  };

  const openCreateModalidadeModal = () => {
    setSelectedModalidade(null);
    setModalidadeModalMode(ModalMode.CREATE);
    setIsModalidadeModalOpen(true);
  };

  const openEditModalidadeModal = (modalidade: Modalidade) => {
    setSelectedModalidade(modalidade);
    setModalidadeModalMode(ModalMode.EDIT);
    setIsModalidadeModalOpen(true);
  };

  const columns: TableColumn<Modalidade>[] = [
    { field: "nome", header: "Nome", width: 400 },
  ];

  const getModalidadeModalInitialData = (): Partial<ModalidadeFormData> | undefined => {
    if (!selectedModalidade) return undefined;
    return {
      nome: selectedModalidade.nome,
    };
  };

  return (
    <Styles.PageContainer>
      <Styles.HeaderContainer>
        <div>
          <Styles.Title>Gerenciamento de Modalidades</Styles.Title>
          <Styles.Subtitle>
            Cadastre, edite e visualize as modalidades.
          </Styles.Subtitle>
        </div>
        <Styles.AddButton onClick={openCreateModalidadeModal}>
          <FiPlus size={18} style={{ marginRight: '8px' }} /> Cadastrar Modalidade
        </Styles.AddButton>
      </Styles.HeaderContainer>

      {isLoading && !modalidades.length && !generalError ? (
        <Styles.LoaderContainer>
          <Loader color={Styles.COLORS.primary} />
        </Styles.LoaderContainer>
      ) : generalError ? (
        <Styles.ErrorContainer>{generalError}</Styles.ErrorContainer>
      ) : (
        <>
          <Styles.SearchInputContainer>
            <Styles.SearchInput
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setFilters(prev => ({ ...prev, currentPage: 1 }));
              }}
              placeholder="Pesquisar por nome..."
            />
          </Styles.SearchInputContainer>

          <DefaultTable
            data={modalidades}
            columns={columns as any}
            rowsPerPage={filters.rowsPerPage}
            currentPage={filters.currentPage}
            totalRows={totalRows}
            onPageChange={(page) => setFilters((prev: TableFilters) => ({ ...prev, currentPage: page }))}
            onRowsPerPageChange={(r) => setFilters((prev: TableFilters) => ({ ...prev, rowsPerPage: r, currentPage: 1 }))}
            onRowClick={openEditModalidadeModal}
          />
        </>
      )}

      {isModalidadeModalOpen && (
        <ModalidadeModal
          open={isModalidadeModalOpen}
          mode={modalidadeModalMode}
          onClose={handleCloseModalidadeModal}
          initialData={getModalidadeModalInitialData()}
          modalidadeIdToEdit={selectedModalidade?.id}
          onSaveComplete={handleModalidadeSaveComplete}
        />
      )}
      <ToastContainer autoClose={3000} hideProgressBar />
    </Styles.PageContainer>
  );
};

export default Modalidades;
