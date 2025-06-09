import React, { useEffect, useState, useCallback } from "react";
import DefaultTable, { TableColumn } from "../../components/Table/DefaultTable";
import { supabase } from "../../lib/supabase.ts";
import { Turma } from "../../types/TurmaTypes.ts";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "../../components/Loader/Loader.tsx";
import * as Styles from "./Turmas.styles";
import TurmaModal from "./components/TurmaModal/TurmaModal.tsx";
import { ModalMode } from "./components/TurmaModal/TurmaModal.definitions.ts";
import { FiPlus } from "react-icons/fi";

const columns: TableColumn<Turma>[] = [
  { field: "nome", header: "Nome" },
  {
    field: "modalidades", // Use the join alias if different, or the foreign key field name
    header: "Modalidade",
    customRender: (turma) => turma.modalidades?.nome || "N/A"
  },
  { field: "ativo", header: "Status", formatter: "status" },
];

const Turmas: React.FC = () => {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.CREATE);
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);

  const fetchTurmas = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("turmas")
      .select("*, modalidades(nome)") // Updated to fetch modality name
      .order("nome", { ascending: true });
    if (error) {
      toast.error("Erro ao buscar turmas.");
      console.error("Supabase error:", error);
      setTurmas([]);
    } else if (data) {
      setTurmas(data as Turma[]);
    } else {
      setTurmas([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTurmas();
  }, [fetchTurmas]);

  const normalizeText = (text: string | undefined | null): string => {
    if (!text) return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const filteredTurmas = turmas.filter((turma) =>
    normalizeText(turma.nome).includes(normalizeText(searchTerm))
  );

  const totalRows = filteredTurmas.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
  const currentData = filteredTurmas.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setSelectedTurma(null);
    setModalMode(ModalMode.CREATE);
    setModalOpen(true);
  };

  const openEditModal = (turma: Turma) => {
    setSelectedTurma(turma);
    setModalMode(ModalMode.EDIT);
    setModalOpen(true);
  };

  const openViewModal = (turma: Turma) => {
    setSelectedTurma(turma);
    setModalMode(ModalMode.VIEW);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTurma(null);
  };

  const handleSaveComplete = useCallback(
    (error: any | null, _savedData?: Turma, operationMode?: ModalMode) => {
      if (error) {
        toast.error(
          `Erro ao ${
            operationMode === ModalMode.CREATE ? "cadastrar" : "atualizar"
          } turma: ${error.message || "Erro desconhecido"}`
        );
      } else {
        toast.success(
          `Turma ${
            operationMode === ModalMode.CREATE ? "cadastrada" : "atualizada"
          } com sucesso!`
        );
        fetchTurmas();
        handleCloseModal();
      }
    },
    [fetchTurmas]
  );

  const getInitialModalData = (): Partial<Turma> | undefined => {
    if ((modalMode === ModalMode.EDIT || modalMode === ModalMode.VIEW) && selectedTurma) {
      return selectedTurma;
    }
    return undefined;
  };

  return (
    <Styles.Container>
      <Styles.Header>
        <div>
          <Styles.Title>Turmas</Styles.Title>
          <Styles.Subtitle>
            Cadastre e gerencie as Turmas de Alunos
          </Styles.Subtitle>
        </div>
        <Styles.CadastrarButton onClick={openCreateModal}>
          <FiPlus />
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
              placeholder="Pesquisar Turma por Nome"
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
        <TurmaModal
          open={modalOpen}
          mode={modalMode}
          initialData={getInitialModalData()}
          turmaIdToEdit={ (modalMode === ModalMode.EDIT || modalMode === ModalMode.VIEW) && selectedTurma ? selectedTurma.id : undefined}
          onClose={handleCloseModal}
          onSaveComplete={handleSaveComplete}
        />
      )}
      <ToastContainer autoClose={3000} hideProgressBar />
    </Styles.Container>
  );
};

export default Turmas;
