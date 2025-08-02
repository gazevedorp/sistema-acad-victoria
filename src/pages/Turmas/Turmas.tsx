import React, { useEffect, useState, useCallback } from "react";
import DefaultTable, { TableColumn } from "../../components/Table/DefaultTable";
import { supabase } from "../../lib/supabase";
import { Turma, ModalidadeBasicInfo, TurmaFormData } from "../../types/TurmaTypes";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "../../components/Loader/Loader";
import * as Styles from "./Turmas.styles";
import TurmaModal from "./components/TurmaModal/TurmaModal";
import { ModalMode } from "./components/TurmaModal/TurmaModal.definitions";
import { FiPlus } from "react-icons/fi";

const Turmas: React.FC = () => {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [modalidades, setModalidades] = useState<ModalidadeBasicInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTurmaModalOpen, setIsTurmaModalOpen] = useState<boolean>(false);
  const [turmaModalMode, setTurmaModalMode] = useState<ModalMode>(ModalMode.CREATE);
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [inputSearch, setInputSearch] = useState<string>("");
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

  const fetchTurmas = useCallback(async (searchQuery: string = "", page: number = 1, pageSize: number = 10) => {
    setIsLoading(true);
    setGeneralError(null);
    try {
      let query = supabase
        .from("turmas")
        .select("*, modalidade:modalidade_id(nome)", { count: 'exact' })
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
        console.error("Erro ao buscar turmas:", error.message);
        toast.error("Falha ao carregar turmas.");
        setGeneralError("Não foi possível carregar as turmas.");
        setTurmas([]);
        setTotalRows(0);
      } else if (data) {
        const adjustedData = data.map(t => ({
          ...t,
          modalidade_nome: (t.modalidade as any)?.nome || 'N/A',
        }));
        setTurmas(adjustedData as any[]);
        setTotalRows(count || 0);
      }
    } catch (err: any) {
      console.error("Erro inesperado ao buscar turmas:", err.message);
      toast.error("Erro crítico ao buscar turmas.");
      setGeneralError("Ocorreu um erro inesperado.");
      setTurmas([]);
      setTotalRows(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchModalidades = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("modalidades")
        .select("id, nome")
        .order("nome", { ascending: true });

      if (error) {
        console.error("Erro ao buscar modalidades:", error.message);
        toast.error("Falha ao carregar modalidades para o formulário.");
        setModalidades([]);
      } else if (data) {
        setModalidades(data as ModalidadeBasicInfo[]);
      }
    } catch (err: any) {
      console.error("Erro inesperado ao buscar modalidades:", err.message);
      toast.error("Erro crítico ao buscar modalidades.");
      setModalidades([]);
    }
  }, []);

  useEffect(() => {
    fetchTurmas();
    fetchModalidades();
  }, [fetchTurmas, fetchModalidades]);

  // Efeito para buscar quando o termo de busca mudar (com debounce)
  useEffect(() => {
    fetchTurmas(debouncedSearchTerm, currentPage, rowsPerPage);
  }, [debouncedSearchTerm, currentPage, rowsPerPage, fetchTurmas]);

  const handleCloseTurmaModal = () => {
    setIsTurmaModalOpen(false);
    setSelectedTurma(null);
  };

  const handleTurmaSaveComplete = (
    error: any | null,
    _savedData?: TurmaFormData,
    mode?: ModalMode
  ) => {
    if (error) {
      toast.error(`Erro ao ${mode === ModalMode.CREATE ? 'cadastrar' : 'atualizar'} turma: ${error.message || 'Erro desconhecido'}`);
    } else {
      toast.success(`Turma ${mode === ModalMode.CREATE ? 'cadastrada' : 'atualizada'} com sucesso!`);
      fetchTurmas(debouncedSearchTerm, currentPage, rowsPerPage);
    }
    // Modal is closed by TurmaModal itself on successful save.
    // If error, it remains open for user to see/correct.
  };

  const openCreateTurmaModal = () => {
    setSelectedTurma(null);
    setTurmaModalMode(ModalMode.CREATE);
    setIsTurmaModalOpen(true);
  };

  const openEditTurmaModal = (turma: Turma) => {
    setSelectedTurma(turma);
    setTurmaModalMode(ModalMode.EDIT);
    setIsTurmaModalOpen(true);
  };

  const columns: TableColumn<Turma>[] = [
    { field: "nome", header: "Nome", width: 200 },
    { field: "capacidade", header: "Capacidade", width: 120 },
    { field: "horarios_descricao", header: "Horários", width: 250 },
    { field: "modalidade_nome", header: "Modalidade", width: 150 },
    { field: "ativo", header: "Status", formatter: "status", width: 100, textAlign: 'center' },
  ];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  // Prepare initialData for TurmaModal carefully
  const getTurmaModalInitialData = (): Partial<TurmaFormData> | undefined => {
    if (!selectedTurma) return undefined;
    // Ensure all fields expected by TurmaFormData are present
    return {
      nome: selectedTurma.nome,
      capacidade: selectedTurma.capacidade,
      horarios_descricao: selectedTurma.horarios_descricao,
      descricao: selectedTurma.descricao || '', // Ensure null/undefined becomes empty string if schema expects string
      modalidade_id: selectedTurma.modalidade_id,
      ativo: selectedTurma.ativo,
    };
  };

  return (
    <Styles.PageContainer>
      <Styles.HeaderContainer>
        <div>
          <Styles.Title>Gerenciamento de Turmas</Styles.Title>
          <Styles.Subtitle>
            Cadastre, edite e visualize as turmas.
          </Styles.Subtitle>
        </div>
      </Styles.HeaderContainer>

      {isLoading && !turmas.length ? (
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
                value={inputSearch}
                onChange={(e) => {
                  setInputSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Pesquisar por nome ou modalidade..."
              />
            </div>
            <Styles.AddButton onClick={openCreateTurmaModal}>
              <FiPlus size={18} style={{ marginRight: '8px' }} /> Cadastrar Turma
            </Styles.AddButton>
          </div>
          <DefaultTable
            data={turmas}
            columns={columns}
            rowsPerPage={rowsPerPage}
            currentPage={currentPage}
            totalRows={totalRows}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            onRowClick={openEditTurmaModal}
          />
        </>
      )}

      {isTurmaModalOpen && (
        <TurmaModal
          open={isTurmaModalOpen}
          mode={turmaModalMode}
          onClose={handleCloseTurmaModal}
          initialData={getTurmaModalInitialData()}
          turmaIdToEdit={selectedTurma?.id}
          modalidades={modalidades}
          onSaveComplete={handleTurmaSaveComplete}
        />
      )}
      <ToastContainer autoClose={3000} hideProgressBar />
    </Styles.PageContainer>
  );
};

export default Turmas;
