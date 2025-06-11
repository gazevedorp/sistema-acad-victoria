import React, { useEffect, useState, useCallback } from "react";
import DefaultTable, { TableColumn, TableFilters } from "../../components/Table/DefaultTable";
import { supabase } from "../../lib/supabase";
import { Plano, PlanoFormData } from "../../types/PlanoTypes";
import { ModalidadeBasicInfo } from "../../types/TurmaTypes"; // Assuming this path
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "../../components/Loader/Loader";
import * as Styles from "./Planos.styles";
import PlanoModal from "./components/PlanoModal/PlanoModal";
import { ModalMode } from "./components/PlanoModal/PlanoModal.definitions";
import { FiPlus, FiEdit2, FiEye } from "react-icons/fi";

const Planos: React.FC = () => {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [modalidades, setModalidades] = useState<ModalidadeBasicInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlanoModalOpen, setIsPlanoModalOpen] = useState<boolean>(false);
  const [planoModalMode, setPlanoModalMode] = useState<ModalMode>(ModalMode.CREATE);
  const [selectedPlano, setSelectedPlano] = useState<Plano | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [filters, setFilters] = useState<TableFilters>({ search: "", currentPage: 1, rowsPerPage: 10 });

  const fetchPlanos = useCallback(async () => {
    setIsLoading(true);
    setGeneralError(null);
    try {
      const { data, error } = await supabase
        .from("planos")
        .select("*, modalidade:modalidade_id(nome)") // Join to get modality name
        .order("nome", { ascending: true });

      if (error) {
        console.error("Erro ao buscar planos:", error.message);
        toast.error("Falha ao carregar planos.");
        setGeneralError("Não foi possível carregar os planos.");
        setPlanos([]);
      } else if (data) {
        const adjustedData = data.map(p => ({
          ...p,
          modalidade_nome: (p.modalidade as any)?.nome || 'N/A',
        }));
        setPlanos(adjustedData as Plano[]);
      }
    } catch (err: any) {
      console.error("Erro inesperado ao buscar planos:", err.message);
      toast.error("Erro crítico ao buscar planos.");
      setGeneralError("Ocorreu um erro inesperado.");
      setPlanos([]);
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
    fetchPlanos();
    fetchModalidades();
  }, [fetchPlanos, fetchModalidades]);

  const handleClosePlanoModal = () => {
    setIsPlanoModalOpen(false);
    setSelectedPlano(null);
  };

  const handlePlanoSaveComplete = (
    error: any | null,
    _savedData?: PlanoFormData,
    mode?: ModalMode
  ) => {
    if (error) {
      toast.error(`Erro ao ${mode === ModalMode.CREATE ? 'cadastrar' : 'atualizar'} plano: ${error.message || 'Erro desconhecido'}`);
    } else {
      toast.success(`Plano ${mode === ModalMode.CREATE ? 'cadastrado' : 'atualizado'} com sucesso!`);
      fetchPlanos();
    }
  };

  const openCreatePlanoModal = () => {
    setSelectedPlano(null);
    setPlanoModalMode(ModalMode.CREATE);
    setIsPlanoModalOpen(true);
  };

  const openEditPlanoModal = (plano: Plano) => {
    setSelectedPlano(plano);
    setPlanoModalMode(ModalMode.EDIT);
    setIsPlanoModalOpen(true);
  };

  const openViewPlanoModal = (plano: Plano) => {
    setSelectedPlano(plano);
    setPlanoModalMode(ModalMode.VIEW);
    setIsPlanoModalOpen(true);
  };

  const columns: TableColumn<Plano>[] = [
    { field: "nome", header: "Nome", width: 250 },
    { field: "modalidade_nome", header: "Modalidade", width: 200 },
    { field: "valor_mensal", header: "Valor Mensal", formatter: "money", width: 150 },
    { field: "desconto_em_combinacao", header: "Desconto Combo (%)", width: 180, textAlign: 'center' },
    { field: "ativo", header: "Status", formatter: "status", width: 100, textAlign: 'center' },
    {
      field: "actions",
      header: "Ações",
      width: 120,
      textAlign: 'center',
      formatter: (_, rowData) => (
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <Styles.ActionButton title="Editar Plano" onClick={() => openEditPlanoModal(rowData)}><FiEdit2 size={18} /></Styles.ActionButton>
          <Styles.ActionButton title="Visualizar Plano" variant="secondary" onClick={() => openViewPlanoModal(rowData)}><FiEye size={18} /></Styles.ActionButton>
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

  const filteredPlanos = planos.filter(plano =>
    adjustString(plano.nome).includes(adjustString(filters.search)) ||
    adjustString(plano.modalidade_nome)?.includes(adjustString(filters.search))
  );

  const getPlanoModalInitialData = (): Partial<PlanoFormData> | undefined => {
    if (!selectedPlano) return undefined;
    return {
      nome: selectedPlano.nome,
      modalidade_id: selectedPlano.modalidade_id,
      valor_mensal: selectedPlano.valor_mensal,
      desconto_em_combinacao: selectedPlano.desconto_em_combinacao,
      ativo: selectedPlano.ativo,
    };
  };

  return (
    <Styles.PageContainer>
      <Styles.HeaderContainer>
        <div>
          <Styles.Title>Gerenciamento de Planos</Styles.Title>
          <Styles.Subtitle>
            Cadastre, edite e visualize os planos de modalidades.
          </Styles.Subtitle>
        </div>
        <Styles.AddButton onClick={openCreatePlanoModal}>
          <FiPlus size={18} style={{ marginRight: '8px' }} /> Cadastrar Plano
        </Styles.AddButton>
      </Styles.HeaderContainer>

      {isLoading && !planos.length && !generalError ? (
        <Styles.LoaderContainer>
          <Loader color={Styles.COLORS.primary} />
        </Styles.LoaderContainer>
      ) : generalError ? (
        <Styles.ErrorContainer>{generalError}</Styles.ErrorContainer>
      ) : (
        <>
          <Styles.SearchInputContainer>
            <Styles.SearchInput
              value={filters.search}
              onChange={(e) => setFilters(prev => ({...prev, search: e.target.value, currentPage: 1}))}
              placeholder="Pesquisar por nome ou modalidade..."
            />
          </Styles.SearchInputContainer>
          <DefaultTable
            data={filteredPlanos}
            columns={columns}
            rowsPerPage={filters.rowsPerPage}
            currentPage={filters.currentPage}
            onPageChange={(page) => setFilters(prev => ({...prev, currentPage: page}))}
            onRowsPerPageChange={(r) => setFilters(prev => ({...prev, rowsPerPage: r, currentPage: 1}))}
            isLoading={isLoading && planos.length > 0}
            noDataMessage="Nenhum plano encontrado."
          />
        </>
      )}

      {isPlanoModalOpen && (
        <PlanoModal
          open={isPlanoModalOpen}
          mode={planoModalMode}
          onClose={handleClosePlanoModal}
          initialData={getPlanoModalInitialData()}
          planoIdToEdit={selectedPlano?.id}
          modalidades={modalidades}
          onSaveComplete={handlePlanoSaveComplete}
        />
      )}
      <ToastContainer autoClose={3000} hideProgressBar />
    </Styles.PageContainer>
  );
};

export default Planos;
