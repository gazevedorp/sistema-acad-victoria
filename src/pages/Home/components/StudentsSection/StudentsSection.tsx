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
import StudentPaymentModal from "../../../Clients/components/StudentPaymentModal/StudentPaymentModal";
import {
  StudentPaymentModalFormData,
  FormaPagamentoParaSelect,
} from "../../../Clients/components/StudentPaymentModal/StudentPaymentModal.definitions";
// import { FiPlus } from "react-icons/fi"; // FiPlus is not used in this file after changes
import { FiEdit, FiDollarSign } from "react-icons/fi"; // Added icons

// --- CONSTANTS ---
const HARDCODED_FORMAS_PAGAMENTO: FormaPagamentoParaSelect[] = [
  { id: "dinheiro", nome: "Dinheiro" }, { id: "pix", nome: "PIX" },
  { id: "debito", nome: "Cartão de Débito" }, { id: "credito", nome: "Cartão de Crédito" },
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
  // --- STUDENT MODAL HANDLERS ---
  const openEditStudentModal = useCallback((client: Client) => {
    setSelectedClientState(client);
    setClientModalMode(StudentModalMode.EDIT);
    setIsClientModalOpen(true);
  }, []); // Empty dependency array if it doesn't depend on other component states/props that change

  // const openViewStudentModal = (client: Client) => { // REMOVED - Not used
  //   setSelectedClientState(client);
  //   setClientModalMode(StudentModalMode.VIEW);
  //   setIsClientModalOpen(true);
  // };

  // Student Payment Modal State and Handlers
  const [isStudentPaymentModalOpen, setIsStudentPaymentModalOpen] = useState<boolean>(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<Client | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);

  const openStudentPaymentModal = useCallback((client: Client) => {
    setSelectedStudentForPayment(client);
    setIsStudentPaymentModalOpen(true);
  }, []);

  const closeStudentPaymentModal = useCallback(() => {
    setIsStudentPaymentModalOpen(false);
    setSelectedStudentForPayment(null);
  }, []);

  const handleStudentPaymentSave = useCallback(async (formData: StudentPaymentModalFormData, studentId: string) => {
    setIsSubmittingPayment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado.");
        setIsSubmittingPayment(false);
        return;
      }

      const paymentData = {
        tipo: "pagamento", // As per requirement
        valor: formData.valor,
        forma_pagamento: formData.forma_pagamento,
        descricao: formData.descricao || null,
        cliente_id: studentId,
        usuario_id_transacao: user.id,
        // TODO: Consider linking to an active caixa_id if available and appropriate.
      };

      const { error } = await supabase.from("financeiro").insert([paymentData]);

      if (error) {
        throw error;
      }

      toast.success("Pagamento registrado com sucesso!");
      closeStudentPaymentModal();
    } catch (error: any) {
      console.error("Error saving student payment:", error);
      toast.error(`Erro ao registrar pagamento: ${error.message || "Erro desconhecido"}`);
    } finally {
      setIsSubmittingPayment(false);
    }
  }, [closeStudentPaymentModal]);


  // --- TABLE COLUMN DEFINITION MOVED INSIDE COMPONENT ---
  const studentTableColumns: TableColumn<Client>[] = [
    { field: "nome", header: "Nome" },
    { field: "telefone", header: "Telefone", formatter: "phone" },
    { field: "data_nascimento", header: "Nascimento", formatter: "date" },
    { field: "ativo", header: "Status", formatter: "status" },
    {
      header: "Ações",
      field: "__actions_custom", // Unique key for this column
      render: (client: Client) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button
            onClick={() => openEditStudentModal(client)}
            title="Editar Aluno"
            style={{ padding: '6px 10px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <FiEdit /> Editar
          </button>
          <button
          onClick={() => openStudentPaymentModal(client)}
            title="Registrar Pagamento"
            style={{ padding: '6px 10px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', background: '#28a745', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <FiDollarSign /> Pagamento
          </button>
        </div>
      ),
      textAlign: 'center',
      width: 200
    },
  ];

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

  // const openViewStudentModal = (client: Client) => { // REMOVED - Not used
  //   setSelectedClientState(client);
  //   setClientModalMode(StudentModalMode.VIEW);
  //   setIsClientModalOpen(true);
  // };

  // const openEditStudentModal = (client: Client) => { // REMOVED - Duplicate
  //   setSelectedClientState(client);
  //   setClientModalMode(StudentModalMode.EDIT);
  //   setIsClientModalOpen(true);
  // };

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

    // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // F4: Cadastrar Novo Aluno
      if (event.key === "F4") {
        event.preventDefault();
        openCreateStudentModal();
      }
      // Escape: Fechar Modal de Aluno
      else if (event.key === "Escape") {
        if (isClientModalOpen) {
          event.preventDefault();
          handleCloseStudentModal();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openCreateStudentModal, isClientModalOpen, handleCloseStudentModal]);

  return (
    <Styles.SectionContainer border> {/* Using a generic SectionContainer, or could be Styles.Section from Home.styles if kept there */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ maxWidth: "100%", flexGrow: 1, marginRight: "1rem" }}>
          <Styles.Input // Assuming Input style will be in StudentsSection.styles.ts
            value={studentSearchInput}
            onChange={(e) => setStudentSearchInput(e.target.value)}
            placeholder="Pesquisar Aluno"
          />
        </div>
        <Styles.CadastrarButton onClick={openCreateStudentModal}> {/* Assuming CadastrarButton style will be in StudentsSection.styles.ts */}
          Cadastrar Aluno [F4]
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
          // showActions -- REMOVE THIS
          noDelete // Assuming noDelete is a permanent prop here
          // onView={openViewStudentModal} -- REMOVE OR COMMENT OUT
          // onEdit={openEditStudentModal} -- REMOVE OR COMMENT OUT
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
      {isStudentPaymentModalOpen && (
        <StudentPaymentModal
          open={isStudentPaymentModalOpen}
          onClose={closeStudentPaymentModal}
          onSave={handleStudentPaymentSave}
          student={selectedStudentForPayment}
          formasPagamentoList={HARDCODED_FORMAS_PAGAMENTO}
          isSubmittingExt={isSubmittingPayment}
        />
      )}
    </Styles.SectionContainer>
  );
};

export default StudentsSection;
