import React, { useEffect, useState, useCallback } from "react";
import DefaultTable, { TableColumn } from "../../components/Table/DefaultTable";
import * as Styles from "./Modalidades.styles";
import { FiPlus } from "react-icons/fi";
import ModalidadeModal from "./components/ModalidadeModal/ModalidadeModal";
import { supabase } from "../../lib/supabase"; // Assuming supabase is configured
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import toastify CSS
import Loader from "../../components/Loader/Loader";
import { ModalMode } from "./components/ModalidadeModal/ModalidadeModal.definitions";
import { Modalidade } from "../../types/ModalidadeTypes";

const columns: TableColumn<Modalidade>[] = [
  { field: "nome", header: "Nome" },
  { field: "ativo", header: "Status", formatter: "status" }, // Assuming you have a 'status' formatter
];

const Modalidades: React.FC = () => {
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.CREATE);
  const [selectedModalidade, setSelectedModalidade] = useState<Modalidade | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchModalidades = useCallback(async () => {
    setIsLoading(true);
    // In a real app, you would fetch from Supabase:
    const { data, error } = await supabase
      .from('modalidades') // Ensure this is your actual table name
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      toast.error("Erro ao buscar modalidades.");
      console.error("Supabase error:", error);
      setModalidades([]); // Set to empty array on error
    } else if (data) {
      setModalidades(data as Modalidade[]);
    } else {
      setModalidades([]); // Set to empty array if no data
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchModalidades();
  }, [fetchModalidades]);

  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const filteredModalidades = modalidades.filter((modalidade) =>
    normalizeText(modalidade.nome).includes(normalizeText(searchTerm))
  );

  const totalRows = filteredModalidades.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
  const currentData = filteredModalidades.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1); // Reset to first page when rows per page changes
  };

  const openCreateModal = () => {
    setSelectedModalidade(null);
    setModalMode(ModalMode.CREATE);
    setModalOpen(true);
  };

  const openViewModal = (modalidade: Modalidade) => {
    setSelectedModalidade(modalidade);
    setModalMode(ModalMode.VIEW);
    setModalOpen(true);
  };

  const openEditModal = (modalidade: Modalidade) => {
    setSelectedModalidade(modalidade);
    setModalMode(ModalMode.EDIT);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedModalidade(null);
  };

  const handleSaveComplete = useCallback(
    (error: any | null, _savedData?: Modalidade, operationMode?: ModalMode) => {
      if (error) {
        toast.error(
          `Erro ao ${
            operationMode === ModalMode.CREATE ? "cadastrar" : "atualizar"
          } modalidade: ${error.message || "Erro desconhecido"}`
        );
      } else {
        toast.success(
          `Modalidade ${
            operationMode === ModalMode.CREATE ? "cadastrada" : "atualizada"
          } com sucesso!`
        );
        fetchModalidades(); // Refresh data
        handleCloseModal();
      }
    },
    [fetchModalidades] // Add fetchModalidades to dependencies
  );

  const getInitialModalData = (): Partial<Modalidade> | undefined => {
    if ((modalMode === ModalMode.EDIT || modalMode === ModalMode.VIEW) && selectedModalidade) {
      return selectedModalidade; // Pass the whole selectedModalidade object
    }
    return undefined; // Or { nome: '', ativo: true } for create mode if not handled in modal
  };


  return (
    <Styles.Container>
      <Styles.Header>
        <div>
          <Styles.Title>Modalidades</Styles.Title>
          <Styles.Subtitle>Cadastre e gerencie suas modalidades</Styles.Subtitle>
        </div>
        <Styles.CadastrarButton onClick={openCreateModal}>
          <FiPlus /> Nova Modalidade
        </Styles.CadastrarButton>
      </Styles.Header>

      {isLoading && !modalOpen ? (
        <Styles.LoaderDiv>
          <Loader color="#000" /> {/* Adjust loader color if needed */}
        </Styles.LoaderDiv>
      ) : (
        <>
          <div style={{ maxWidth: 400, marginBottom: '20px' }}>
            <Styles.Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar Modalidade por Nome"
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
            showActions
            noDelete // Assuming no delete functionality for now
            onView={openViewModal}
            onEdit={openEditModal}
            // onDelete will be implemented later if needed
          />
        </>
      )}

      {modalOpen && (
        <ModalidadeModal
          open={modalOpen}
          mode={modalMode}
          initialData={getInitialModalData()}
          modalidadeIdToEdit={modalMode === ModalMode.EDIT && selectedModalidade ? selectedModalidade.id : undefined}
          onClose={handleCloseModal}
          onSaveComplete={handleSaveComplete}
        />
      )}

      <ToastContainer autoClose={3000} hideProgressBar />
    </Styles.Container>
  );
};

export default Modalidades;
