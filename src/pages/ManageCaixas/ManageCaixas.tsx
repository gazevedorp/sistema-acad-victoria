// import React, { useEffect, useCallback, useState, useMemo } from 'react';
// import * as Styles from './ManageCaixas.styles';
// import { CaixaWithUserEmail, SupabaseCaixaResponse } from './ManageCaixas.definitions';
// import DefaultTable, { TableColumn } from '../../components/Table/DefaultTable';
// import Loader from '../../components/Loader/Loader';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { supabase } from '../../lib/supabase';
// // Imports removidos - formatDateTime e formatCurrency não utilizados neste componente
// import { User } from '@supabase/supabase-js';
// import { FiList, FiEdit, FiTrash2 } from 'react-icons/fi'; // Import FiTrash2
// import TransactionHistoryModal from '../../pages/Home/components/TransactionHistoryModal/TransactionHistoryModal';
// import EditCaixaModal, { EditCaixaFormData } from './components/EditCaixaModal/EditCaixaModal';

// const ManageCaixas: React.FC = () => {
//   const [caixas, setCaixas] = useState<CaixaWithUserEmail[]>([]);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const [rowsPerPage, setRowsPerPage] = useState<number>(5);

//   // Filtering states
//   const [searchTerm, setSearchTerm] = useState<string>('');
//   const [statusFilter, setStatusFilter] = useState<string>('todos');
//   const [userFilter, setUserFilter] = useState<string>('');
//   const [dateRangeFilter, setDateRangeFilter] = useState<{ startDate: string | null; endDate: string | null }>({ startDate: null, endDate: null });

//   // Transaction History Modal states
//   const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
//   const [selectedCaixaIdForHistory, setSelectedCaixaIdForHistory] = useState<string | null>(null);
//   const [currentUser, setCurrentUser] = useState<User | null>(null);

//   // Edit Caixa Modal states
//   const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
//   const [editingCaixa, setEditingCaixa] = useState<CaixaWithUserEmail | null>(null);
//   const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);

//   // Delete Caixa states
//   const [isDeleting, setIsDeleting] = useState<boolean>(false);

//   const fetchCaixas = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       const { data, error } = await supabase
//         .from('caixas')
//         .select(`
//           id, usuario_id, valor_inicial, data_abertura, data_fechamento, status,
//           observacoes_abertura, observacoes_fechamento, valor_total_entradas, valor_total_saidas,
//           saldo_final_calculado
//         `)
//         .order('data_abertura', { ascending: false }) as { data: SupabaseCaixaResponse[] | null, error: any };

//       if (error) throw error;
//       if (data) {
//         const mappedData: CaixaWithUserEmail[] = data.map(c => ({ ...c, usuario_email: c.usuarios?.email || String(c.usuario_id) }));
//         setCaixas(mappedData);
//       } else {
//         setCaixas([]);
//       }
//     } catch (err: any) {
//       toast.error('Erro ao buscar caixas: ' + err.message);
//       setCaixas([]);
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchCaixas();
//     const fetchUser = async () => {
//       const { data: { user } } = await supabase.auth.getUser();
//       setCurrentUser(user);
//     };
//     fetchUser();
//   }, [fetchCaixas]);

//   // Filter logic
//   const filteredCaixas = useMemo(() => {
//     return caixas.filter(caixa => {
//       const searchTermLower = searchTerm.toLowerCase();
//       const userFilterLower = userFilter.toLowerCase();
//       const matchesSearchTerm = !searchTerm ||
//         caixa.id.toLowerCase().includes(searchTermLower) ||
//         (caixa.observacoes_abertura && caixa.observacoes_abertura.toLowerCase().includes(searchTermLower)) ||
//         (caixa.obs_fechamento && caixa.obs_fechamento.toLowerCase().includes(searchTermLower));
//       const matchesUserFilter = !userFilterLower || (caixa.usuario_email && caixa.usuario_email.toLowerCase().includes(userFilterLower));
//       const matchesStatusFilter = statusFilter === 'todos' || caixa.status === statusFilter;
//       let matchesDateRange = true;
//       if (dateRangeFilter.startDate || dateRangeFilter.endDate) {
//         const aberturaDate = new Date(caixa.data_abertura);
//         aberturaDate.setHours(0,0,0,0);
//         if (dateRangeFilter.startDate) {
//             const startDate = new Date(dateRangeFilter.startDate + "T00:00:00");
//             if(aberturaDate < startDate) matchesDateRange = false;
//         }
//         if (matchesDateRange && dateRangeFilter.endDate) {
//             const endDate = new Date(dateRangeFilter.endDate + "T23:59:59");
//             if(aberturaDate > endDate) matchesDateRange = false;
//         }
//       }
//       return matchesSearchTerm && matchesUserFilter && matchesStatusFilter && matchesDateRange;
//     });
//   }, [caixas, searchTerm, statusFilter, userFilter, dateRangeFilter]);

//   useEffect(() => {
//     if (filteredCaixas.length > 0 && (currentPage - 1) * rowsPerPage >= filteredCaixas.length) {
//       setCurrentPage(1);
//     } else if (filteredCaixas.length === 0 && currentPage !== 1) {
//       setCurrentPage(1);
//     }
//   }, [filteredCaixas, currentPage, rowsPerPage]);

//   const paginatedFilteredCaixas = useMemo(() => {
//     return filteredCaixas.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
//   }, [filteredCaixas, currentPage, rowsPerPage]);

//   // Modal handlers
//   const handleViewHistory = (caixaId: string) => {
//     setSelectedCaixaIdForHistory(caixaId);
//     setIsHistoryModalOpen(true);
//   };

//   const handleOpenEditModal = (caixa: CaixaWithUserEmail) => {
//     setEditingCaixa(caixa);
//     setIsEditModalOpen(true);
//   };

//   const handleCloseEditModal = () => {
//     setIsEditModalOpen(false);
//     setEditingCaixa(null);
//   };

//   const handleSaveCaixa = async (updatedData: EditCaixaFormData) => {
//     if (!editingCaixa) return;
//     setIsSubmittingEdit(true);
//     try {
//       const dataToUpdate: Partial<EditCaixaFormData> = {};
//       if (updatedData.observacoes_abertura !== editingCaixa.observacoes_abertura) {
//         dataToUpdate.observacoes_abertura = updatedData.observacoes_abertura;
//       }
//       if (editingCaixa.status !== 'aberto' && updatedData.obs_fechamento !== editingCaixa.obs_fechamento) {
//          dataToUpdate.obs_fechamento = updatedData.obs_fechamento;
//       }
//       if (editingCaixa.status !== 'aberto' && updatedData.status && updatedData.status !== editingCaixa.status) {
//         if ((editingCaixa.status === 'fechado' && updatedData.status === 'conferido') ||
//             (editingCaixa.status === 'conferido' && updatedData.status === 'fechado')) {
//            dataToUpdate.status = updatedData.status;
//         } else if (updatedData.status === 'conferido' && editingCaixa.status !== 'aberto') {
//             dataToUpdate.status = updatedData.status;
//         } else if (updatedData.status === editingCaixa.status) {
//             // No change
//         } else {
//             toast.warn(`Mudança de status de '${editingCaixa.status}' para '${updatedData.status}' não permitida.`);
//         }
//       }

//       if (Object.keys(dataToUpdate).length === 0) {
//         toast.info("Nenhuma alteração detectada.");
//         handleCloseEditModal();
//         return;
//       }

//       const { error } = await supabase.from('caixas').update(dataToUpdate).eq('id', editingCaixa.id);
//       if (error) throw error;
//       toast.success('Caixa atualizado com sucesso!');
//       fetchCaixas();
//       handleCloseEditModal();
//     } catch (err: any) {
//       toast.error('Erro ao atualizar caixa: ' + err.message);
//     } finally {
//       setIsSubmittingEdit(false);
//     }
//   };

//   // Delete handlers
//   const proceedWithDelete = async (idToDelete: string) => {
//     setIsDeleting(true);
//     try {
//       const { error } = await supabase.from('caixas').delete().eq('id', idToDelete);
//       if (error) {
//         if (error.message.includes('violates foreign key constraint') && (error.message.includes('financeiro_caixa_id_fkey') || error.message.includes('financeiro_entries_caixa_id_fkey'))) { // Check common fkey names
//            toast.error("Este caixa não pode ser excluído pois possui transações financeiras associadas.");
//         } else {
//           throw error;
//         }
//       } else {
//         toast.success("Caixa excluído com sucesso!");
//         fetchCaixas();
//       }
//     } catch (err: any) {
//       toast.error("Erro ao excluir o caixa: " + err.message);
//       console.error("Error deleting caixa:", err);
//     } finally {
//       setIsDeleting(false);
//     }
//   };

//   const columns: TableColumn<CaixaWithUserEmail>[] = useMemo(() => [
//     { field: 'usuario_email', header: 'Usuário' },
//     { field: 'data_abertura', header: 'Abertura', formatter: "dateVarchar" },
//     { field: 'data_fechamento', header: 'Fechamento', formatter: "dateVarchar" },
//     { field: 'valor_inicial', header: 'Vl. Inicial', formatter: "money" },
//     { field: 'saldo_final_calculado', header: 'Saldo Final', formatter: "money" },
//     { field: 'status', header: 'Status' },
//     {
//       field: 'actions',
//       header: 'Ações',
//       render: (caixa: CaixaWithUserEmail) => (
//         <Styles.ActionButtonsContainer>
//           <button onClick={() => handleViewHistory(caixa.id)} title="Ver Transações" disabled={isDeleting}>
//             <FiList /> Detalhes
//           </button>
//           {/* <button onClick={() => handleOpenEditModal(caixa)} title="Editar Caixa" disabled={isDeleting}>
//             <FiEdit />
//           </button> */}
//         </Styles.ActionButtonsContainer>
//       ),
//     }
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   ], [fetchCaixas, isDeleting]); // Added isDeleting to deps

//   if (isLoading && !caixas.length) {
//     return <Styles.Container><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 200px)' }}><Loader /></div><ToastContainer autoClose={3000} hideProgressBar /></Styles.Container>;
//   }

//   return (
//     <Styles.Container>
//       <h1>Gerenciamento de Caixas</h1>
//       <p>Visualize e gerencie os Caixas</p>
//       <Styles.ControlsContainer>
//         <input type="text" placeholder="Pesquisar Usuário..." value={userFilter} onChange={(e) => setUserFilter(e.target.value)} />
//         <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
//           <option value="todos">Todos Status</option>
//           <option value="aberto">Aberto</option>
//           <option value="fechado">Fechado</option>
//           <option value="conferido">Conferido</option>
//         </select>
//         <input type="date" value={dateRangeFilter.startDate || ''} onChange={(e) => setDateRangeFilter(prev => ({ ...prev, startDate: e.target.value || null }))} title="Data de Início"/>
//         <input type="date" value={dateRangeFilter.endDate || ''} onChange={(e) => {
//             const newEndDate = e.target.value || null;
//             if (dateRangeFilter.startDate && newEndDate && newEndDate < dateRangeFilter.startDate) {
//                 toast.warn('Data final não pode ser anterior à data inicial.');
//                 setDateRangeFilter(prev => ({ ...prev, endDate: prev.startDate }));
//             } else { setDateRangeFilter(prev => ({ ...prev, endDate: newEndDate })); }
//           }} title="Data de Fim" min={dateRangeFilter.startDate || undefined} />
//       </Styles.ControlsContainer>
//       <DefaultTable
//         columns={columns}
//         data={paginatedFilteredCaixas}
//         isLoading={isLoading && caixas.length > 0}
//         rowsPerPage={rowsPerPage}
//         currentPage={currentPage}
//         totalRows={filteredCaixas.length}
//         onPageChange={setCurrentPage}
//         onRowsPerPageChange={(num) => { setRowsPerPage(num); setCurrentPage(1); }}
//       />
//       {currentUser && selectedCaixaIdForHistory && (
//         <TransactionHistoryModal
//           isOpen={isHistoryModalOpen}
//           onClose={() => { setIsHistoryModalOpen(false); setSelectedCaixaIdForHistory(null); }}
//           currentUser={currentUser}
//           activeCaixaId={selectedCaixaIdForHistory}
//         />
//       )}
//       {editingCaixa && (
//         <EditCaixaModal
//           isOpen={isEditModalOpen}
//           onClose={handleCloseEditModal}
//           onSave={handleSaveCaixa}
//           caixaData={editingCaixa}
//           isSubmitting={isSubmittingEdit}
//         />
//       )}
//       <ToastContainer autoClose={3000} hideProgressBar />
//     </Styles.Container>
//   );
// };

// export default ManageCaixas;
