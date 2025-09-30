import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Styles from "./StudentsSection.styles";
import { AlunoOld } from "../../services/homeServices";
import Loader from "../../../../components/Loader/Loader";
import { ModalMode as StudentModalMode, DadosCadastraisFormData as StudentFormData } from "../../../Clients/components/ClientModal/ClientModal.definitions";
import DefaultTable, { TableColumn } from "../../../../components/Table/DefaultTable";
import ClientModal from "../../../Clients/components/ClientModal/ClientModal";
import { useStudents } from "../../hooks/useStudents";

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

interface StudentsSectionProps {}

const StudentsSection: React.FC<StudentsSectionProps> = () => {
  const {
    students,
    totalStudents,
    studentRowsPerPage,
    studentCurrentPage,
    isStudentsLoading,
    studentSearchInput,
    activeFilter,
    loadStudents,
    handleStudentPageChange,
    handleStudentRowsPerPageChange,
    handleSearchInputChange,
    handleFilterChange,
  } = useStudents();

  const [isClientModalOpen, setIsClientModalOpen] = useState<boolean>(false);
  const [clientModalMode, setClientModalMode] = useState<StudentModalMode>(StudentModalMode.CREATE);
  const [selectedClientState, setSelectedClientState] = useState<AlunoOld | null>(null);
  const debouncedSearchTerm = useDebounce(studentSearchInput, 500);


  const studentTableColumns: TableColumn<AlunoOld>[] = [
    { field: "alunoNome", header: "Nome" },
    { field: "alunoCelular", header: "Celular", formatter: "phone" },
    { field: "alunoDataNascimento", header: "Nascimento", formatter: "dateVarchar" },
    { 
      field: "alunoSexo", 
      header: "Sexo", 
      render: (aluno: AlunoOld) => aluno.alunoSexo === 1 ? "F" : "M" 
    },
  ];

  const openEditStudentModal = useCallback((aluno: AlunoOld) => {
    setSelectedClientState(aluno);
    setClientModalMode(StudentModalMode.EDIT);
    setIsClientModalOpen(true);
  }, []);

  const handleStudentRowClick = useCallback((aluno: AlunoOld) => {
    openEditStudentModal(aluno);
  }, [openEditStudentModal]);

  const openCreateStudentModal = useCallback(() => {
    setSelectedClientState(null);
    setClientModalMode(StudentModalMode.CREATE);
    setIsClientModalOpen(true);
  }, []);

  const handleCloseStudentModal = useCallback(() => {
    setIsClientModalOpen(false);
    setSelectedClientState(null);
  }, []);

  const handleStudentSaveComplete = useCallback(
    (error: any | null, _s?: Partial<StudentFormData>, mode?: StudentModalMode) => {
      if (error) {
        toast.error(`Erro: ${(error as Error).message || "Erro desconhecido ao salvar aluno."}`);
      } else {
        toast.success(`Aluno ${mode === StudentModalMode.CREATE ? "cadastrado" : "atualizado"} com sucesso!`);
        loadStudents(debouncedSearchTerm, studentCurrentPage, studentRowsPerPage, activeFilter);
        handleCloseStudentModal();
      }
    },
    [loadStudents, debouncedSearchTerm, studentCurrentPage, studentRowsPerPage, handleCloseStudentModal]
  );

  const getInitialStudentModalData = (): Partial<StudentFormData> | undefined => {
    if ((clientModalMode === StudentModalMode.EDIT || clientModalMode === StudentModalMode.VIEW) && selectedClientState) {

      return {
        nome: selectedClientState.alunoNome,
        cpf: selectedClientState.alunoCPF || "",
        rg: selectedClientState.alunoIdentidade || undefined,
        data_nascimento: selectedClientState.alunoDataNascimento,
        sexo: selectedClientState.alunoSexo === 1 ? "F" : "M",
        telefone: selectedClientState.alunoCelular || "",
        email: selectedClientState.alunoEmail || undefined,
        cep: selectedClientState.alunoCEP || "",
        rua: selectedClientState.alunoEndereco || "",
        bairro: selectedClientState.alunoBairro || "",
        cidade: selectedClientState.alunoCidade || "",
        estado: selectedClientState.alunoEstado || "",
        possuiResponsavel: !!selectedClientState.alunoResponsavel,
        responsavelNome: selectedClientState.alunoResponsavel || undefined,
        responsavelCpf: selectedClientState.alunoResponsavelCPF || undefined,
        responsavelTelefone: selectedClientState.alunoTelefoneResponsavel || undefined,
      };
    }
    return undefined;
  };

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    loadStudents(debouncedSearchTerm, studentCurrentPage, studentRowsPerPage, activeFilter);
  }, [debouncedSearchTerm, studentCurrentPage, studentRowsPerPage, activeFilter, loadStudents]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F4") {
        event.preventDefault();
        openCreateStudentModal();
      } else if (event.key === "Escape" && isClientModalOpen) {
        event.preventDefault();
        handleCloseStudentModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openCreateStudentModal, isClientModalOpen, handleCloseStudentModal]);

  return (
    <Styles.SectionContainer border>
      <Styles.FilterContainer>
        <Styles.FilterCard 
          active={activeFilter === 'todos'} 
          onClick={() => handleFilterChange('todos')}
        >
          Matriculados
        </Styles.FilterCard>
        <Styles.FilterCard 
          active={activeFilter === 'ativos'} 
          onClick={() => handleFilterChange('ativos')}
        >
          Ativos
        </Styles.FilterCard>
        <Styles.FilterCard 
          active={activeFilter === 'bloqueados'} 
          onClick={() => handleFilterChange('bloqueados')}
        >
          Bloqueados
        </Styles.FilterCard>
        <Styles.FilterCard 
          active={activeFilter === 'encerrados'} 
          onClick={() => handleFilterChange('encerrados')}
        >
          Encerrados
        </Styles.FilterCard>
        <Styles.FilterCard 
          active={activeFilter === 'antigos'} 
          onClick={() => handleFilterChange('antigos')}
        >
          Antigos
        </Styles.FilterCard>
      </Styles.FilterContainer>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ maxWidth: "100%", flexGrow: 1, marginRight: "1rem" }}>
          <Styles.SearchInput
            value={studentSearchInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              handleSearchInputChange(e.target.value);
            }}
            placeholder="Pesquisar Aluno"
          />
        </div>
        <Styles.CadastrarButton onClick={openCreateStudentModal}>
          Cadastrar Aluno [F4]
        </Styles.CadastrarButton>
      </div>
      
      {isStudentsLoading ? (
        <Styles.LoaderDiv>
          <Loader color="#000" />
        </Styles.LoaderDiv>
      ) : (
        <DefaultTable
          data={students}
          columns={studentTableColumns}
          rowsPerPage={studentRowsPerPage}
          currentPage={studentCurrentPage}
          totalRows={totalStudents}
          onPageChange={handleStudentPageChange}
          onRowsPerPageChange={handleStudentRowsPerPageChange}
          onRowClick={handleStudentRowClick}
          noDelete
        />
      )}
      
      {isClientModalOpen && (
        <ClientModal
          open={isClientModalOpen}
          mode={clientModalMode}
          initialData={getInitialStudentModalData()}
          alunoIdToEdit={clientModalMode === StudentModalMode.EDIT && selectedClientState ? String(selectedClientState.alunoID) : undefined}
          onClose={handleCloseStudentModal}
          onSaveComplete={handleStudentSaveComplete}
        />
      )}
    </Styles.SectionContainer>
  );
};

export default StudentsSection;