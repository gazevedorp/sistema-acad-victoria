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
import { FinanceiroMatricula } from "../../../../types/financeiro.types"; // Import the new type
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

const getNormalizedDate = (dateStr?: string): Date => {
  const date = dateStr ? new Date(dateStr + 'T00:00:00Z') : new Date(); // Ensure date is parsed as UTC midnight
  date.setUTCHours(0, 0, 0, 0); // Normalize to UTC midnight
  return date;
};


// --- PAYMENT STATUS LOGIC ---
const determinePaymentStatus = (
  studentId: string,
  studentIsActive: boolean,
  allFinanceiroData: FinanceiroMatricula[]
): string => {
  if (!studentIsActive) {
    return "Inativo";
  }

  const studentEntries = allFinanceiroData.filter(entry => entry.id_aluno === studentId);

  if (studentEntries.length === 0) {
    return "Sem Lançamentos";
  }

  const today = getNormalizedDate(); // Today at UTC midnight

  const unpaidEntries = studentEntries.filter(entry => !entry.pago);

  const overdueEntries = unpaidEntries.filter(entry => {
    const vencimentoDate = getNormalizedDate(entry.vencimento);
    return vencimentoDate < today;
  });

  if (overdueEntries.length > 0) {
    // Optional: could sort overdueEntries by vencimento to get the 'most' overdue.
    return "Atrasado";
  }

  const currentMonth = today.getUTCFullYear() * 100 + today.getUTCMonth();

  const openEntriesThisMonth = unpaidEntries.filter(entry => {
    const vencimentoDate = getNormalizedDate(entry.vencimento);
    const vencimentoMonth = vencimentoDate.getUTCFullYear() * 100 + vencimentoDate.getUTCMonth();
    // Check if vencimento is in the current month or a future month but is the earliest unpaid
    return vencimentoDate >= today && vencimentoMonth === currentMonth;
  });

  if (openEntriesThisMonth.length > 0) {
    return "Em Aberto";
  }

  // If no overdue and no open entries for the current month that are due today or later this month
  // Check if there are any unpaid entries for future months (considered "Em Aberto" if it's the *next* bill)
  const futureUnpaidEntries = unpaidEntries.filter(entry => {
    const vencimentoDate = getNormalizedDate(entry.vencimento);
    return vencimentoDate > today;
  }).sort((a,b) => getNormalizedDate(a.vencimento).getTime() - getNormalizedDate(b.vencimento).getTime());

  if (futureUnpaidEntries.length > 0) {
    // Check if the earliest future unpaid is for current month (already handled) or next month.
    // This logic means "Em Aberto" can also apply to the immediate next bill even if it's for a future month start.
    // For simplicity, if there's any future unpaid, and no current month or overdue, we can call it "Em Aberto" (for the next one)
    // or "Pago" (meaning current obligations met). Let's refine this.
    // If all obligations up to today are met, and there are future bills, it's effectively "Pago" for *now*.
    // The "Em Aberto" should ideally refer to something due now or very soon.
  }


  // If no overdue and no "Em Aberto" entries for the current month,
  // the student is considered "Pago" if they have any entries at all (which we've established they do).
  // Or, more accurately, if all entries with vencimento <= today are paid.
  // This is covered by lack of overdueEntries.

  // If there are no unpaid entries at all for past, present.
  if (unpaidEntries.length === 0) {
    return "Pago"; // All bills ever generated are paid.
  }

  // If there are unpaid entries, but they are all for future dates (beyond current month logic already handled)
  // This implies current dues are settled.
  const allUnpaidAreFuture = unpaidEntries.every(entry => {
    const vencimentoDate = getNormalizedDate(entry.vencimento);
    // Check if it's truly in a future month, not just later this month
    const vencimentoMonth = vencimentoDate.getUTCFullYear() * 100 + vencimentoDate.getUTCMonth();
    return vencimentoMonth > currentMonth || (vencimentoMonth === currentMonth && vencimentoDate > today);
  });

  if (allUnpaidAreFuture) {
     // To distinguish from "Pago" (all bills paid), this could be "Pago (Próx. Futura)"
     // For simplicity, if no current or past dues, status is "Pago".
    return "Pago";
  }

  // Default fallback, though logic should cover cases.
  // This might catch cases like unpaid bills for future months that are not "Em Aberto" for current month.
  // Consider these "Pago" for now as current obligations are met.
  return "Pago"; // Fallback: if not overdue and not clearly "Em Aberto" for current month.
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
  const [
    selectedMatriculaFinanceiraPendente,
    setSelectedMatriculaFinanceiraPendente,
  ] = useState<FinanceiroMatricula | null>(null); // New state for pending invoice
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);

  const openStudentPaymentModal = useCallback(async (client: Client) => {
    setSelectedStudentForPayment(client);
    // Fetch the oldest unpaid invoice
    try {
      const { data: financeiroData, error: financeiroError } = await supabase
        .from("financeiro_matricula")
        .select("*")
        .eq("id_aluno", client.id)
        .eq("pago", false)
        .order("vencimento", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (financeiroError) {
        toast.error("Erro ao buscar pendência financeira: " + financeiroError.message);
        setSelectedMatriculaFinanceiraPendente(null);
      } else {
        setSelectedMatriculaFinanceiraPendente(financeiroData as FinanceiroMatricula | null);
      }
    } catch (error: any) {
      toast.error("Erro ao buscar pendência financeira: " + error.message);
      setSelectedMatriculaFinanceiraPendente(null);
    }
    setIsStudentPaymentModalOpen(true);
  }, []);

  const closeStudentPaymentModal = useCallback(() => {
    setIsStudentPaymentModalOpen(false);
    setSelectedStudentForPayment(null);
    setSelectedMatriculaFinanceiraPendente(null); // Reset pending invoice on close
  }, []);

  const handleStudentPaymentSave = useCallback(async (formData: StudentPaymentModalFormData, studentId: string) => {
    setIsSubmittingPayment(true);
    // Note: activeCaixaId would be needed here if we were to use it for financeiro_matricula.
    // Assuming activeCaixaId is available in this component's scope if fetched from Home.tsx or context.
    // For now, let's simulate it or fetch it if available.
    // const activeCaixaId = getActiveCaixaId(); // Placeholder for getting active caixa ID. This should be sourced from props or context if available.
    const activeCaixaId = null; // For now, explicitly null if not available.

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado.");
        setIsSubmittingPayment(false);
        return;
      }

      // Initialize a flag to track overall success
      let overallSuccess = true;
      let financialRecordMessage = "Pagamento registrado com sucesso!";

      // Process matricula-related payment if applicable
      if (selectedMatriculaFinanceiraPendente && selectedMatriculaFinanceiraPendente.id_aluno === studentId && selectedMatriculaFinanceiraPendente.valor_total === formData.valor) {
        // 1. Update the paid financeiro_matricula record
        const { error: updateError } = await supabase
          .from("financeiro_matricula")
          .update({ pago: true, id_caixa: activeCaixaId /*, data_pagamento: new Date().toISOString() */ }) // data_pagamento could be another field
          .eq("id", selectedMatriculaFinanceiraPendente.id);

        if (updateError) {
          console.error("Erro ao atualizar pendência financeira:", updateError);
          toast.error("Falha ao atualizar pendência: " + updateError.message);
          overallSuccess = false; // Mark as not fully successful
        } else {
          toast.info("Pendência financeira marcada como paga.");

          // 2. Generate the next financeiro_matricula record
          const currentVencimento = new Date(selectedMatriculaFinanceiraPendente.vencimento + 'T00:00:00Z'); // Ensure UTC for correct date manipulation
          currentVencimento.setUTCMonth(currentVencimento.getUTCMonth() + 1);
          // Handle potential day overflow, e.g., Jan 31 + 1 month = Feb 28/29
          // A more robust library like date-fns might be better: addMonths(currentVencimento, 1)
          const nextVencimentoStr = currentVencimento.toISOString().split('T')[0];

          const nextFinanceiroMatricula = {
            id_matricula: selectedMatriculaFinanceiraPendente.id_matricula,
            id_aluno: selectedMatriculaFinanceiraPendente.id_aluno,
            id_caixa: null, // New one is not tied to current caixa session yet
            vencimento: nextVencimentoStr,
            valor_total: selectedMatriculaFinanceiraPendente.valor_total, // Assuming same value for next month
            pago: false,
          };

          const { error: insertNextError } = await supabase
            .from("financeiro_matricula")
            .insert([nextFinanceiroMatricula]);

          if (insertNextError) {
            console.error("Erro ao gerar próxima pendência financeira:", insertNextError);
            toast.error("Falha ao gerar próxima pendência: " + insertNextError.message);
            // This might not set overallSuccess to false, as the primary payment is still processed.
            // Depends on business logic. For now, we'll allow the main payment to proceed.
            financialRecordMessage += " (Próxima pendência não gerada automaticamente)";
          } else {
            toast.info("Próxima pendência financeira gerada.");
          }
        }
      }

      // Always record the main transaction in 'financeiro' table
      const paymentData = {
        tipo: "pagamento_mensalidade", // More specific type
        valor: formData.valor,
        forma_pagamento: formData.forma_pagamento,
        descricao: formData.descricao || `Pagamento referente ao aluno ${selectedStudentForPayment?.nome || studentId}`,
        cliente_id: studentId,
        usuario_id_transacao: user.id,
        id_caixa: activeCaixaId, // Use activeCaixaId if available
        // id_financeiro_matricula_referencia: selectedMatriculaFinanceiraPendente?.id // Optional: link to the fm item
      };

      const { error: mainFinanceiroError } = await supabase.from("financeiro").insert([paymentData]);

      if (mainFinanceiroError) {
        console.error("Erro ao registrar transação principal:", mainFinanceiroError);
        toast.error(`Erro ao registrar pagamento principal: ${mainFinanceiroError.message}`);
        overallSuccess = false; // Critical failure
      }

      if (overallSuccess) {
        toast.success(financialRecordMessage);
        closeStudentPaymentModal();
      } else {
        // If not overall success, don't close modal, user might need to retry or see issues.
        // Or, close and provide a more detailed error summary. For now, keep open.
        toast.warn("Algumas operações falharam. Verifique os logs ou tente novamente.");
      }

    } catch (error: any) {
      console.error("Error saving student payment:", error);
      toast.error(`Erro crítico no processo de pagamento: ${error.message || "Erro desconhecido"}`);
    } finally {
      setIsSubmittingPayment(false);
    }
  }, [closeStudentPaymentModal, selectedMatriculaFinanceiraPendente, selectedStudentForPayment]);


  // --- TABLE COLUMN DEFINITION MOVED INSIDE COMPONENT ---
  const studentTableColumns: TableColumn<Client>[] = [
    { field: "nome", header: "Nome", width: 250 },
    {
      field: "paymentStatus", // New field
      header: "Sit. Financeira",
      width: 150,
      render: (client: Client) => {
        const status = client.paymentStatus || "N/D";
        let color = "inherit";
        let fontWeight = "normal";

        switch (status) {
          case "Atrasado":
            color = "red";
            fontWeight = "bold";
            break;
          case "Em Aberto":
            color = "orange";
            break;
          case "Pago":
            color = "green";
            break;
          case "Inativo":
          case "Sem Lançamentos":
            color = "grey";
            break;
          default:
            color = "black";
        }
        return <span style={{ color, fontWeight }}>{status}</span>;
      },
      textAlign: 'center'
    },
    { field: "telefone", header: "Telefone", formatter: "phone", width: 150 },
    // { field: "data_nascimento", header: "Nascimento", formatter: "date", width: 120 }, // Less important for this view
    { field: "ativo", header: "Status Matrícula", formatter: "status", width: 130, textAlign: 'center' }, // Renamed for clarity
    {
      header: "Ações",
      field: "__actions_custom", // Unique key for this column
      width: 220, // Adjusted width
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
            disabled={!(client.paymentStatus === "Atrasado" || client.paymentStatus === "Em Aberto")}
            style={{
              padding: '6px 10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: (client.paymentStatus === "Atrasado" || client.paymentStatus === "Em Aberto") ? '#28a745' : '#cccccc',
              color: (client.paymentStatus === "Atrasado" || client.paymentStatus === "Em Aberto") ? 'white' : '#666666',
              cursor: (client.paymentStatus === "Atrasado" || client.paymentStatus === "Em Aberto") ? 'pointer' : 'not-allowed',
            }}
          >
            <FiDollarSign /> Pagamento
          </button>
        </div>
      ),
      textAlign: 'center'
      // width: 200 // width was already adjusted to 220 previously
    },
  ];

  // Student Management States
  const [students, setStudents] = useState<Client[]>([]); // This will hold raw student data
  const [allFinanceiroMatriculaData, setAllFinanceiroMatriculaData] = useState<FinanceiroMatricula[]>([]);
  const [studentsWithPaymentStatus, setStudentsWithPaymentStatus] = useState<Client[]>([]); // Enriched data for table
  const [studentRowsPerPage, setStudentRowsPerPage] = useState<number>(5);
  const [studentCurrentPage, setStudentCurrentPage] = useState<number>(1);
  const [isClientModalOpen, setIsClientModalOpen] = useState<boolean>(false);
  const [clientModalMode, setClientModalMode] = useState<StudentModalMode>(StudentModalMode.CREATE);
  const [selectedClientState, setSelectedClientState] = useState<Client | null>(null);
  const [isStudentsLoading, setIsStudentsLoading] = useState<boolean>(false);
  const [studentSearchInput, setStudentSearchInput] = useState<string>("");

  const fetchStudentsAndFinancialData = useCallback(async () => {
    setIsStudentsLoading(true);
    try {
      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from("alunos")
        .select("*")
        .order("nome", { ascending: true });

      if (studentsError) {
        toast.error("Erro ao buscar alunos.");
        console.error("Error fetching students:", studentsError);
        setStudents([]); // Clear students on error
        setAllFinanceiroMatriculaData([]); // Clear financial data on error
        return;
      }
      if (studentsData) {
        setStudents(studentsData as Client[]);
      } else {
        setStudents([]);
      }

      // Fetch all financeiro_matricula records
      // WARNING: Fetching all records can be inefficient for large tables.
      // Consider more targeted queries or pagination if performance becomes an issue.
      const { data: fmData, error: fmError } = await supabase
        .from("financeiro_matricula")
        .select("*"); // Select all for now, or filter by relevant student IDs if possible

      if (fmError) {
        toast.error("Erro ao buscar dados financeiros das matrículas.");
        console.error("Error fetching financeiro_matricula data:", fmError);
        setAllFinanceiroMatriculaData([]); // Clear financial data on error
      } else if (fmData) {
        setAllFinanceiroMatriculaData(fmData as FinanceiroMatricula[]);
      } else {
        setAllFinanceiroMatriculaData([]);
      }

    } catch (err) {
      toast.error("Erro inesperado ao buscar dados.");
      console.error("Unexpected error fetching data:", err);
      setStudents([]);
      setAllFinanceiroMatriculaData([]);
    } finally {
      setIsStudentsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentsAndFinancialData();
  }, [fetchStudentsAndFinancialData]);

  // Effect to combine student data with payment status
  useEffect(() => {
    if (students.length > 0 && allFinanceiroMatriculaData.length > 0) {
      const enrichedStudents = students.map(student => {
        const paymentStatus = determinePaymentStatus(
          student.id,
          student.ativo,
          allFinanceiroMatriculaData
        );
        return { ...student, paymentStatus };
      });
      setStudentsWithPaymentStatus(enrichedStudents);
    } else if (students.length > 0 && allFinanceiroMatriculaData.length === 0 && !isStudentsLoading) {
      // Handle case where students are loaded but financial data might be empty (e.g. new setup)
       const enrichedStudents = students.map(student => ({
        ...student,
        paymentStatus: determinePaymentStatus(student.id, student.ativo, []), // Pass empty array
      }));
      setStudentsWithPaymentStatus(enrichedStudents);
    } else {
      setStudentsWithPaymentStatus(students); // Or [], if students themselves are empty
    }
  }, [students, allFinanceiroMatriculaData, isStudentsLoading]); // Added isStudentsLoading

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
        fetchStudentsAndFinancialData(); // Refresh student list & financial data
        handleCloseStudentModal();
      }
    },
    [fetchStudentsAndFinancialData] // fetchStudentsAndFinancialData is a dependency
  );

  const getInitialStudentModalData = (): Partial<StudentFormData> | undefined => {
    if ((clientModalMode === StudentModalMode.EDIT || clientModalMode === StudentModalMode.VIEW) && selectedClientState) {
      return selectedClientState;
    }
    return undefined;
  };

  const filteredStudents = studentsWithPaymentStatus.filter((i) => // Use studentsWithPaymentStatus for filtering
    adjustString(i.nome).includes(adjustString(studentSearchInput))
  );

  const currentStudentTableData = filteredStudents.slice( // Use filteredStudents (derived from studentsWithPaymentStatus)
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
          matriculaFinanceiraPendente={selectedMatriculaFinanceiraPendente} // Pass the fetched data
        />
      )}
    </Styles.SectionContainer>
  );
};

export default StudentsSection;
