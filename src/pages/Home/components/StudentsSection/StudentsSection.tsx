import React, { useEffect, useState, useCallback } from "react";
import * as Styles from "./StudentsSection.styles"; // Styles for this section
import { supabase } from "../../../../lib/supabase";
import { Client } from "../../../../types/ClientTypes";
import Loader from "../../../../components/Loader/Loader";
import { toast } from "react-toastify"; // Assuming ToastContainer is global or in parent
import "react-toastify/dist/ReactToastify.css";
import { ModalMode as StudentModalMode, DadosCadastraisFormData as StudentFormData } from "../../../Clients/components/ClientModal/ClientModal.definitions";
import DefaultTable, { TableColumn } from "../../../../components/Table/DefaultTable";
import ClientModal from "../../../Clients/components/ClientModal/ClientModal";
import { FiPlus } from "react-icons/fi";

// --- CONSTANTS ---
const studentTableColumns: TableColumn<Client>[] = [
  { field: "nome", header: "Nome" },
  { field: "telefone", header: "Telefone", formatter: "phone" },
  { field: "data_nascimento", header: "Nascimento", formatter: "date" },
  { field: "ativo", header: "Status", formatter: "status" },
];

// --- UTILITY FUNCTIONS ---
const adjustString = (text: string | null | undefined): string => {
  if (!text) return "";
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

// --- PROPS DEFINITION ---
// For now, StudentsSection is self-contained for data fetching.
// Props might be added later if Home needs to influence it or receive data from it.
interface StudentsSectionProps {
  // Example: onStudentsLoaded?: (students: Client[]) => void;
}

const StudentsSection: React.FC<StudentsSectionProps> = (/* props */) => {
  // Student Management States
  const [students, setStudents] = useState<Client[]>([]);
  const [studentRowsPerPage, setStudentRowsPerPage] = useState<number>(5);
  const [studentCurrentPage, setStudentCurrentPage] = useState<number>(1);
  const [isClientModalOpen, setIsClientModalOpen] = useState<boolean>(false);
  const [clientModalMode, setClientModalMode] = useState<StudentModalMode>(StudentModalMode.CREATE);
  const [selectedClientState, setSelectedClientState] = useState<Client | null>(null);
  const [isStudentsLoading, setIsStudentsLoading] = useState<boolean>(false);
  const [studentSearchInput, setStudentSearchInput] = useState<string>("");

  const fetchStudents = useCallback(async () => {
    setIsStudentsLoading(true);
    try {
      const { data, error } = await supabase.from("alunos").select("*").order("nome", { ascending: true });
      if (error) {
        toast.error("Erro ao buscar alunos.");
        console.error("Error fetching students:", error);
        return;
      }
      if (data) {
        setStudents(data as Client[]);
        // If a prop callback exists to notify parent about loaded students:
        // props.onStudentsLoaded?.(data as Client[]);
      }
    } catch (err) {
      toast.error("Erro inesperado ao buscar alunos.");
      console.error("Unexpected error fetching students:", err);
    } finally {
      setIsStudentsLoading(false);
    }
  }, []); // Add dependencies like props.onStudentsLoaded if it's used

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const openCreateStudentModal = () => {
    setSelectedClientState(null);
    setClientModalMode(StudentModalMode.CREATE);
    setIsClientModalOpen(true);
  };

  const openViewStudentModal = (client: Client) => {
    setSelectedClientState(client);
    setClientModalMode(StudentModalMode.VIEW);
    setIsClientModalOpen(true);
  };

  const openEditStudentModal = (client: Client) => {
    setSelectedClientState(client);
    setClientModalMode(StudentModalMode.EDIT);
    setIsClientModalOpen(true);
  };

  const handleCloseStudentModal = () => {
    setIsClientModalOpen(false);
    setSelectedClientState(null);
  };

  const handleStudentSaveComplete = useCallback(
    (error: any | null, _s?: Partial<StudentFormData>, mode?: StudentModalMode) => {
      if (error) {
        toast.error(`Erro: ${(error as Error).message || "Erro desconhecido ao salvar aluno."}`);
      } else {
        toast.success(`Aluno ${mode === StudentModalMode.CREATE ? "cadastrado" : "atualizado"} com sucesso!`);
        fetchStudents(); // Refresh student list
        handleCloseStudentModal();
      }
    },
    [fetchStudents] // fetchStudents is a dependency
  );

  const getInitialStudentModalData = (): Partial<StudentFormData> | undefined => {
    if ((clientModalMode === StudentModalMode.EDIT || clientModalMode === StudentModalMode.VIEW) && selectedClientState) {
      return selectedClientState;
    }
    return undefined;
  };

  const filteredStudents = students.filter((i) =>
    adjustString(i.nome).includes(adjustString(studentSearchInput))
  );

  const currentStudentTableData = filteredStudents.slice(
    (studentCurrentPage - 1) * studentRowsPerPage,
    (studentCurrentPage - 1) * studentRowsPerPage + studentRowsPerPage
  );

  return (
    <Styles.SectionContainer border> {/* Using a generic SectionContainer, or could be Styles.Section from Home.styles if kept there */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ maxWidth: 400, flexGrow: 1, marginRight: "1rem" }}>
          <Styles.Input // Assuming Input style will be in StudentsSection.styles.ts
            value={studentSearchInput}
            onChange={(e) => setStudentSearchInput(e.target.value)}
            placeholder="Pesquisar Aluno"
          />
        </div>
        <Styles.CadastrarButton onClick={openCreateStudentModal}> {/* Assuming CadastrarButton style will be in StudentsSection.styles.ts */}
          <FiPlus /> Cadastrar Aluno
        </Styles.CadastrarButton>
      </div>
      {isStudentsLoading ? (
        <Styles.LoaderDiv> {/* Assuming LoaderDiv style will be in StudentsSection.styles.ts or a shared one */}
          <Loader color="#000" />
        </Styles.LoaderDiv>
      ) : (
        <DefaultTable
          data={currentStudentTableData}
          columns={studentTableColumns}
          rowsPerPage={studentRowsPerPage}
          currentPage={studentCurrentPage}
          totalRows={filteredStudents.length}
          onPageChange={setStudentCurrentPage}
          onRowsPerPageChange={(r) => {
            setStudentRowsPerPage(r);
            setStudentCurrentPage(1);
          }}
          showActions
          noDelete // Assuming noDelete is a permanent prop here
          onView={openViewStudentModal}
          onEdit={openEditStudentModal}
        />
      )}
      {isClientModalOpen && (
        <ClientModal
          open={isClientModalOpen}
          mode={clientModalMode}
          initialData={getInitialStudentModalData()}
          alunoIdToEdit={clientModalMode === StudentModalMode.EDIT && selectedClientState ? selectedClientState.id : undefined}
          onClose={handleCloseStudentModal}
          onSaveComplete={handleStudentSaveComplete}
        />
      )}
    </Styles.SectionContainer>
  );
};

export default StudentsSection;
