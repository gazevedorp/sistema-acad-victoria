import React, { useEffect, useState, useCallback } from "react";
import DefaultTable, { TableColumn } from "../../components/Table/DefaultTable";
import { supabase } from "../../lib/supabase.ts";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "../../components/Loader/Loader.tsx";
import * as Styles from "./Planos.styles";
import { Plano } from "../../types/PlanoTypes.ts";
import PlanoModal from "./components/PlanoModal/PlanoModal.tsx";
import { ModalMode } from "./components/PlanoModal/PlanoModal.definitions.ts";
import { FiPlus } from "react-icons/fi";

const columns: TableColumn<Plano>[] = [
  { field: "nome", header: "Nome" },
  { field: "valor", header: "Valor", formatter: "money" }, // Changed to 'valor'
  { field: "ativo", header: "Status", formatter: "status" },
];

const Planos: React.FC = () => {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.CREATE);
  const [selectedPlano, setSelectedPlano] = useState<Plano | null>(null);

  const fetchPlanos = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("planos")
      .select("*")
      .order("nome", { ascending: true });
    if (error) {
      toast.error("Erro ao buscar planos.");
      console.error("Supabase error:", error);
      setPlanos([]);
    } else if (data) {
      setPlanos(data as Plano[]);
    } else {
      setPlanos([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPlanos();
  }, [fetchPlanos]);

  const normalizeText = (text: string | undefined | null): string => {
    if (!text) return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const filteredPlanos = planos.filter((plano) =>
    normalizeText(plano.nome).includes(normalizeText(searchTerm))
  );

  const totalRows = filteredPlanos.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRows);
  const currentData = filteredPlanos.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setSelectedPlano(null);
    setModalMode(ModalMode.CREATE);
    setModalOpen(true);
  };

  const openEditModal = (plano: Plano) => {
    setSelectedPlano(plano);
    setModalMode(ModalMode.EDIT);
    setModalOpen(true);
  };

  const openViewModal = (plano: Plano) => {
    setSelectedPlano(plano);
    setModalMode(ModalMode.VIEW);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPlano(null);
  };

  const handleSaveComplete = useCallback(
    (error: any | null, _savedData?: Plano, operationMode?: ModalMode) => {
      if (error) {
        toast.error(
          `Erro ao ${
            operationMode === ModalMode.CREATE ? "cadastrar" : "atualizar"
          } plano: ${error.message || "Erro desconhecido"}`
        );
      } else {
        toast.success(
          `Plano ${
            operationMode === ModalMode.CREATE ? "cadastrado" : "atualizado"
          } com sucesso!`
        );
        fetchPlanos();
        handleCloseModal();
      }
    },
    [fetchPlanos]
  );

  const getInitialModalData = (): Partial<Plano> | undefined => {
    if ((modalMode === ModalMode.EDIT || modalMode === ModalMode.VIEW) && selectedPlano) {
      return selectedPlano;
    }
    return undefined;
  };

  return (
    <Styles.Container>
      <Styles.Header>
        <div>
          <Styles.Title>Planos</Styles.Title>
          <Styles.Subtitle>Cadastre e gerencie os Planos</Styles.Subtitle>
        </div>
        <Styles.CadastrarButton onClick={openCreateModal}>
          <FiPlus /> Novo Plano
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
              placeholder="Pesquisar Plano por Nome"
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
        <PlanoModal
          open={modalOpen}
          mode={modalMode}
          initialData={getInitialModalData()}
          planoIdToEdit={ (modalMode === ModalMode.EDIT || modalMode === ModalMode.VIEW) && selectedPlano ? selectedPlano.id : undefined}
          onClose={handleCloseModal}
          onSaveComplete={handleSaveComplete}
        />
      )}
      <ToastContainer autoClose={3000} hideProgressBar />
    </Styles.Container>
  );
};

export default Planos;
