import React, { useEffect, useState, useCallback } from "react";
import DefaultTable, { TableColumn } from "../../components/Table/DefaultTable";
import { supabase } from "../../lib/supabase";
import { Plano, PlanoFormData } from "../../types/PlanoTypes";
import { ModalidadeBasicInfo } from "../../types/TurmaTypes"; // Assuming this path
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "../../components/Loader/Loader";
import * as Styles from "./Planos.styles";
import PlanoModal from "./components/PlanoModal/PlanoModal";
import { ModalMode } from "./components/PlanoModal/PlanoModal.definitions";
import { FiPlus } from "react-icons/fi";
import { useModuleAccess } from "../../components/PermissionGate/PermissionGate";

interface TableFilters {
  search: string;
  currentPage: number;
  rowsPerPage: number;
}

const Planos: React.FC = () => {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [modalidades, setModalidades] = useState<ModalidadeBasicInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlanoModalOpen, setIsPlanoModalOpen] = useState<boolean>(false);
  const [planoModalMode, setPlanoModalMode] = useState<ModalMode>(ModalMode.CREATE);
  const [selectedPlano, setSelectedPlano] = useState<Plano | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [filters, setFilters] = useState<TableFilters>({ search: "", currentPage: 1, rowsPerPage: 10 });
  const [totalRows, setTotalRows] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Verificação de permissões
  const { canCreate, canEdit, loading: permissionsLoading } = useModuleAccess('planos');

  // Não renderizar até que as permissões sejam carregadas
  if (permissionsLoading) {
    return (
      <Styles.LoaderContainer>
        <Loader color={Styles.COLORS.primary} />
      </Styles.LoaderContainer>
    );
  }

  // Debounce hook
  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchPlanos = useCallback(async (searchQuery: string = "", page: number = 1, pageSize: number = 10) => {
    setIsLoading(true);
    setGeneralError(null);
    try {
      let query = supabase
        .from("planos")
        .select("*, modalidade:modalidade_id(nome)", { count: 'exact' })
        .order("nome", { ascending: true });

      // Aplicar filtro de busca se fornecido
      if (searchQuery.trim()) {
        query = query.ilike('nome', `%${searchQuery}%`);
      }

      // Aplicar paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error("Erro ao buscar planos:", error.message);
        toast.error("Falha ao carregar planos.");
        setGeneralError("Não foi possível carregar os planos.");
        setPlanos([]);
        setTotalRows(0);
      } else if (data) {
        const adjustedData = data.map(p => ({
          ...p,
          modalidade_nome: (p.modalidade as any)?.nome || 'N/A',
        }));
        setPlanos(adjustedData as Plano[]);
        setTotalRows(count || 0);
      }
    } catch (err: any) {
      console.error("Erro inesperado ao buscar planos:", err.message);
      toast.error("Erro crítico ao buscar planos.");
      setGeneralError("Ocorreu um erro inesperado.");
      setPlanos([]);
      setTotalRows(0);
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

  // Efeito para buscar quando o termo de busca mudar (com debounce)
  useEffect(() => {
    fetchPlanos(debouncedSearchTerm, filters.currentPage, filters.rowsPerPage);
  }, [debouncedSearchTerm, filters.currentPage, filters.rowsPerPage, fetchPlanos]);

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
      fetchPlanos(debouncedSearchTerm, filters.currentPage, filters.rowsPerPage);
    }
  };

  const openCreatePlanoModal = () => {
    if (!canCreate) {
      toast.error("Você não tem permissão para criar planos.");
      return;
    }
    setSelectedPlano(null);
    setPlanoModalMode(ModalMode.CREATE);
    setIsPlanoModalOpen(true);
  };

  const openEditPlanoModal = (plano: Plano) => {
    if (!canEdit) {
      toast.error("Você não tem permissão para editar planos.");
      return;
    }
    setSelectedPlano(plano);
    setPlanoModalMode(ModalMode.EDIT);
    setIsPlanoModalOpen(true);
  };

  const columns: TableColumn<Plano>[] = [
    { field: "nome", header: "Nome", width: 300 },
    { field: "modalidade_nome", header: "Modalidade", width: 200 },
    { field: "valor_mensal", header: "Valor Mensal", formatter: "money", width: 150 },
    { field: "ativo", header: "Status", formatter: "status", width: 100, textAlign: 'center' },
  ];

  const getPlanoModalInitialData = (): Partial<PlanoFormData> | undefined => {
    if (!selectedPlano) return undefined;
    return {
      nome: selectedPlano.nome,
      modalidade_id: selectedPlano.modalidade_id,
      valor_mensal: selectedPlano.valor_mensal,
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
      </Styles.HeaderContainer>

      {isLoading && !planos.length && !generalError ? (
        <Styles.LoaderContainer>
          <Loader color={Styles.COLORS.primary} />
        </Styles.LoaderContainer>
      ) : generalError ? (
        <Styles.ErrorContainer>{generalError}</Styles.ErrorContainer>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ maxWidth: "100%", flexGrow: 1, marginRight: "1rem" }}>
              <Styles.SearchInput
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setFilters(prev => ({ ...prev, currentPage: 1 }));
                }}
                placeholder="Pesquisar por nome ou modalidade..."
              />
            </div>
            {canCreate && (
              <Styles.AddButton onClick={openCreatePlanoModal}>
                <FiPlus size={18} style={{ marginRight: '8px' }} /> Cadastrar Plano
              </Styles.AddButton>
            )}
          </div>

          <DefaultTable
            data={planos}
            columns={columns as any}
            rowsPerPage={filters.rowsPerPage}
            currentPage={filters.currentPage}
            totalRows={totalRows}
            onPageChange={(page) => setFilters((prev: TableFilters) => ({ ...prev, currentPage: page }))}
            onRowsPerPageChange={(r) => setFilters((prev: TableFilters) => ({ ...prev, rowsPerPage: r, currentPage: 1 }))}
            onRowClick={openEditPlanoModal}
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
