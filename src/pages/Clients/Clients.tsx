import React, { useEffect, useState, useCallback } from "react";
import DefaultTable, { TableColumn } from "../../components/Table/DefaultTable";
import * as Styles from "./Clients.styles";
import { FiPlus } from "react-icons/fi";
import ClientModal from "./components/ClientModal/ClientModal";
import { supabase } from "../../lib/supabase";
import { toast, ToastContainer } from "react-toastify";
import Loader from "../../components/Loader/Loader";
import { ModalMode, DadosCadastraisFormData } from "./components/ClientModal/ClientModal.definitions";

interface Client {
  id: string;
  nome: string;
  cpf?: string;
  rg?: string;
  data_nascimento?: string;
  telefone?: string;
  email?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  ativo?: boolean;
  possuiResponsavel?: boolean;
  responsavelNome?: string;
  responsavelCpf?: string;
  responsavelTelefone?: string;
  responsavelParentesco?: string;
}

const columns: TableColumn<Client>[] = [
  { field: "nome", header: "Nome" },
  { field: "telefone", header: "Telefone", formatter: "phone" },
  { field: "data_nascimento", header: "Nascimento", formatter: "date" },
  { field: "ativo", header: "Status", formatter: "status" },
];

const Clients: React.FC = () => {
  const [contatos, setContatos] = useState<Client[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.CREATE);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [onLoading, setLoading] = useState(false);
  const [inputSearch, setInputSearch] = useState<string>("");

  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("alunos")
        .select("*")
        .order("nome", { ascending: true });
      if (error) {
        toast.error("Erro ao buscar alunos.");
        console.error("Supabase error:", error)
        return;
      }
      if (data) {
        setContatos(data as Client[]);
      }
    } catch (err) {
      console.error("Erro ao buscar alunos:", err);
      toast.error("Erro inesperado ao buscar alunos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const adjustString = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const totalRows = contatos.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
  const currentData = contatos.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setSelectedClient(null);
    setModalMode(ModalMode.CREATE);
    setModalOpen(true);
  };

  const openViewModal = (client: Client) => {
    setSelectedClient(client);
    setModalMode(ModalMode.VIEW);
    setModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setModalMode(ModalMode.EDIT);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedClient(null);
  };

  const handleSaveComplete = useCallback((
    error: any | null,
    //@ts-expect-error
    savedData?: Partial<DadosCadastraisFormData>,
    operationMode?: ModalMode
  ) => {
    if (error) {
      toast.error(`Erro ao ${operationMode === ModalMode.CREATE ? 'cadastrar' : 'atualizar'} aluno: ${error.message || 'Erro desconhecido'}`);
    } else {
      toast.success(`Aluno ${operationMode === ModalMode.CREATE ? 'cadastrado' : 'atualizado'} com sucesso!`);
      fetchClientes();
      handleCloseModal();
    }
  }, [fetchClientes]);

  const getInitialModalData = (): Partial<DadosCadastraisFormData> | undefined => {
    if ((modalMode === ModalMode.EDIT || modalMode === ModalMode.VIEW) && selectedClient) {
      return {
        nome: selectedClient.nome,
        cpf: selectedClient.cpf,
        rg: selectedClient.rg,
        data_nascimento: selectedClient.data_nascimento,
        telefone: selectedClient.telefone,
        email: selectedClient.email,
        cep: selectedClient.cep,
        rua: selectedClient.rua,
        numero: selectedClient.numero,
        complemento: selectedClient.complemento,
        bairro: selectedClient.bairro,
        cidade: selectedClient.cidade,
        estado: selectedClient.estado,
        possuiResponsavel: selectedClient.possuiResponsavel,
        responsavelNome: selectedClient.responsavelNome,
        responsavelCpf: selectedClient.responsavelCpf,
        responsavelTelefone: selectedClient.responsavelTelefone,
        responsavelParentesco: selectedClient.responsavelParentesco,
      };
    }
    return undefined;
  };

  return (
    <Styles.Container>
      <Styles.Header>
        <div>
          <Styles.Title>Alunos</Styles.Title>
          <Styles.Subtitle>Cadastre e gerencie seus alunos</Styles.Subtitle>
        </div>
        <Styles.CadastrarButton onClick={openCreateModal}>
          <FiPlus />
        </Styles.CadastrarButton>
      </Styles.Header>

      {onLoading && !modalOpen ? (
        <Styles.LoaderDiv>
          <Loader color="#000" />
        </Styles.LoaderDiv>
      ) : (
        <>
          <div style={{ maxWidth: 400, marginBottom: '20px' }}>
            <Styles.Input
              value={inputSearch}
              onChange={(e) => setInputSearch(e.target.value)}
              placeholder="Pesquisar Aluno por Nome"
            />
          </div>
          <DefaultTable
            data={currentData.filter((item) =>
              item.nome && adjustString(item.nome).includes(adjustString(inputSearch))
            )}
            columns={columns}
            rowsPerPage={rowsPerPage}
            currentPage={currentPage}
            totalRows={totalRows}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            showActions
            noDelete
            onView={openViewModal}
            onEdit={openEditModal}
          />
        </>
      )}

      {modalOpen && (
        <ClientModal
          open={modalOpen}
          mode={modalMode}
          initialData={getInitialModalData()}
          alunoIdToEdit={modalMode === ModalMode.EDIT && selectedClient ? selectedClient.id : undefined}
          onClose={handleCloseModal}
          onSaveComplete={handleSaveComplete}
        />
      )}

      <ToastContainer autoClose={3000} hideProgressBar />
    </Styles.Container>
  );
};

export default Clients;