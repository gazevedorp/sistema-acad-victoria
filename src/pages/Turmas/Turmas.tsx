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
import { FiPlus, FiEdit2, FiEye } from "react-icons/fi";

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

  const fetchTurmas = useCallback(async () => {
    setIsLoading(true);
    setGeneralError(null);
    try {
      const { data, error } = await supabase
        .from("turmas")
        .select("*, modalidade:modalidade_id(nome)") // Join to get modality name
        .order("nome", { ascending: true });

      if (error) {
        console.error("Erro ao buscar turmas:", error.message);
        toast.error("Falha ao carregar turmas.");
        setGeneralError("Não foi possível carregar as turmas.");
        setTurmas([]);
      } else if (data) {
        const adjustedData = data.map(t => ({
          ...t,
          modalidade_nome: (t.modalidade as any)?.nome || 'N/A',
        }));
        setTurmas(adjustedData as any[]); // Using any[] temporarily if Turma type doesn't have modalidade_nome
      }
    } catch (err: any) {
      console.error("Erro inesperado ao buscar turmas:", err.message);
      toast.error("Erro crítico ao buscar turmas.");
      setGeneralError("Ocorreu um erro inesperado.");
      setTurmas([]);
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
      fetchTurmas();
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

  const openViewTurmaModal = (turma: Turma) => {
    setSelectedTurma(turma);
    setTurmaModalMode(ModalMode.VIEW);
    setIsTurmaModalOpen(true);
  };

  const columns: TableColumn<Turma>[] = [
    { field: "nome", header: "Nome" },
    { field: "capacidade", header: "Capacidade" },
    { field: "horarios_descricao", header: "Horários", width: 250 },
    { field: "modalidade_nome", header: "Modalidade" },
    { field: "ativo", header: "Status", formatter: "status" },
    {
      field: "actions",
      header: "Ações",
      width: 120,
      formatter: (_, rowData) => (
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <Styles.ActionButton title="Editar Turma" onClick={() => openEditTurmaModal(rowData)}><FiEdit2 size={18} /></Styles.ActionButton>
          <Styles.ActionButton title="Visualizar Turma" variant="secondary" onClick={() => openViewTurmaModal(rowData)}><FiEye size={18} /></Styles.ActionButton>
        </div>
      ),
    },
  ];

  const adjustString = (text: string | null | undefined): string => {
    if (!text) return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const filteredTurmas = turmas.filter(turma =>
    adjustString(turma.nome).includes(adjustString(inputSearch)) ||
    adjustString((turma as any).modalidade_nome)?.includes(adjustString(inputSearch))
  );

  const currentTableData = filteredTurmas.slice(
    (currentPage - 1) * rowsPerPage,
    ((currentPage - 1) * rowsPerPage) + rowsPerPage
  );
  const totalRows = filteredTurmas.length;

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
        <Styles.AddButton onClick={openCreateTurmaModal}>
          <FiPlus size={18} style={{ marginRight: '8px' }} /> Cadastrar Turma
        </Styles.AddButton>
      </Styles.HeaderContainer>

      {isLoading && !turmas.length ? (
        <Styles.LoaderContainer>
          <Loader color={Styles.COLORS.primary} />
        </Styles.LoaderContainer>
      ) : generalError ? (
        <Styles.ErrorContainer>{generalError}</Styles.ErrorContainer>
      ) : (
        <>
          <Styles.SearchInputContainer>
            <Styles.SearchInput
              value={inputSearch}
              onChange={(e) => setInputSearch(e.target.value)}
              placeholder="Pesquisar por nome ou modalidade..."
            />
          </Styles.SearchInputContainer>
          <DefaultTable
            data={currentTableData}
            columns={columns}
            rowsPerPage={rowsPerPage}
            currentPage={currentPage}
            totalRows={totalRows}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={(r) => {setRowsPerPage(r); setCurrentPage(1);}}
            isLoading={isLoading && turmas.length > 0}
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
