import React, { useEffect, useState } from "react";
import DefaultTable, { TableColumn } from "../../components/Table/DefaultTable";
import * as Styles from "./Clients.styles";
import { FiPlus } from "react-icons/fi";
import ClientModal from "./components/ClientModal/ClientModal.tsx";
import { supabase } from "../../lib/supabase.ts";
import { Client } from "../../types/ClientTypes.js";
import { toast, ToastContainer } from "react-toastify";
import Loader from "../../components/Loader/Loader.tsx";

enum ModalMode {
  CREATE = "create",
  VIEW = "view",
  EDIT = "edit",
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

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("alunos")
        .select("*")
        .order("nome", { ascending: true });
      if (error) {
        toast.error("Erro ao buscar alunos.");
        throw error;
      }
      if (data) {
        setContatos(data as Client[]);
      }
    } catch (err) {
      console.error("Erro ao buscar alunos:", err);
    } finally {
      setLoading(false);
    }
  };

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
  };

  type OmitId = Omit<Client, "id">;

  const handleSave = async (data: OmitId) => {
    try {
      if (modalMode === ModalMode.CREATE) {
        const { data: created, error } = await supabase
          .from("alunos")
          .insert([data])
          .select();
        if (error) {
          toast.error("Erro ao cadastrar aluno.");
          throw error;
        }
        if (created && created.length > 0) {
          setContatos((prev) => [...prev, created[0] as Client]);
          toast.success("Aluno cadastrado com sucesso!");
        }
      } else if (modalMode === ModalMode.EDIT && selectedClient) {
        const { data: updated, error } = await supabase
          .from("alunos")
          .update(data)
          .eq("id", selectedClient.id)
          .select();
        if (error) {
          toast.error("Erro ao atualizar aluno.");
          throw error;
        }
        if (updated && updated.length > 0) {
          const updatedClient = updated[0] as Client;
          setContatos((prev) =>
            prev.map((c) => (c.id === selectedClient.id ? updatedClient : c))
          );
          toast.success("Aluno atualizado com sucesso!");
        }
      }
      setModalOpen(false);
    } catch (err) {
      console.error("Erro ao salvar aluno:", err);
    }
  };

  const handleDelete = async (client: Client) => {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir o aluno: ${client.nome}?`
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from("clientes")
        .delete()
        .eq("id", client.id);

      if (error) {
        toast.error("Erro ao excluir cliente.");
        throw error;
      }

      setContatos((prev) => prev.filter((c) => c.id !== client.id));
      toast.success("Cliente excluído com sucesso!");
    } catch (err) {
      console.error("Erro ao excluir cliente:", err);
    }
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

      {onLoading ? (
        <Styles.LoaderDiv>
          <Loader color="#000" />
        </Styles.LoaderDiv>
      ) : (
        <>
          <div style={{ maxWidth: 400 }}>
            <Styles.Input
              value={inputSearch}
              onChange={(e) => setInputSearch(e.target.value)}
              placeholder="Pesquisar Aluno"
            />
          </div>
          <DefaultTable
            data={currentData.filter((item) =>
              adjustString(item.nome)?.includes(adjustString(inputSearch))
            )}
            columns={columns}
            rowsPerPage={rowsPerPage}
            currentPage={currentPage}
            totalRows={totalRows}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            showActions
            onView={openViewModal}
            onEdit={openEditModal}
            onDelete={handleDelete}
          />
        </>
      )}

      <ClientModal
        open={modalOpen}
        mode={modalMode}
        client={selectedClient}
        onClose={handleCloseModal}
        onSave={handleSave}
      />

      <ToastContainer />
    </Styles.Container>
  );
};

export default Clients;
