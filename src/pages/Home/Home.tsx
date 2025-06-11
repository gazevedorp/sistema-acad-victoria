import React, { useEffect, useState, useCallback } from "react";
import * as Styles from "./Home.styles";
import { supabase } from "../../lib/supabase";
import { Client } from "../../types/ClientTypes";
import Loader from "../../components/Loader/Loader";
import { User } from "@supabase/supabase-js";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ModalMode as StudentModalMode, DadosCadastraisFormData as StudentFormData } from "../Clients/components/ClientModal/ClientModal.definitions";
import DefaultTable, { TableColumn } from "../../components/Table/DefaultTable";
import ClientModal from "../Clients/components/ClientModal/ClientModal";
import { FiPlus } from "react-icons/fi";

// Imports for Cashier (Caixa) Functionality
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import CaixaModal from "../Caixa/components/CaixaModal/CaixaModal";
import {
  CaixaModalFormData,
  AlunoParaSelect,
  ProdutoParaSelect,
  FormaPagamentoParaSelect,
} from "../Caixa/components/CaixaModal/CaixaModal.definitions";
import AbrirCaixaModal from "../Caixa/components/AbrirCaixaModal/AbrirCaixaModal";
import { AbrirCaixaFormData } from "../Caixa/components/AbrirCaixaModal/AbrirCaixaModal.definitions";
import FecharCaixaModal from "../Caixa/components/FecharCaixaModal/FecharCaixaModal";
import { FecharCaixaFormData } from "../Caixa/components/FecharCaixaModal/FecharCaixaModal.definitions";

// --- TYPE DEFINITIONS ---

interface MovimentacaoCaixaAtivoSummary {
  tipo: string;
  valor: number;
}

interface ActiveCaixa {
  id: string;
  usuario_id: string;
  valor_inicial: number;
  data_abertura: string;
  observacoes_abertura?: string | null;
  data_fechamento?: string;
  valor_total_entradas?: number;
  valor_total_saidas?: number;
  saldo_final_calculado?: number;
}

interface FinanceiroItem {
  id: string;
  created_at: string;
  tipo: string;
  forma_pagamento: string;
  valor: number;
  descricao?: string;
  cliente_id?: string;
  produto_id?: string;
  caixa_id?: string;
  cliente_nome?: string;
  produto_nome?: string;
}

// --- CONSTANTS ---

const studentTableColumns: TableColumn<Client>[] = [
  { field: "nome", header: "Nome" },
  { field: "telefone", header: "Telefone", formatter: "phone" },
  { field: "data_nascimento", header: "Nascimento", formatter: "date" },
  { field: "ativo", header: "Status", formatter: "status" },
];

const financeTableColumns: TableColumn<FinanceiroItem>[] = [
  { field: "created_at", header: "Data", formatter: "date" },
  { field: "tipo", header: "Tipo" },
  { field: "forma_pagamento", header: "Pagamento" },
  { field: "valor", header: "Valor", formatter: "money" },
  { field: "descricao", header: "Descrição" },
  { field: "cliente_nome", header: "Cliente" },
  { field: "produto_nome", header: "Produto" },
];

const HARDCODED_FORMAS_PAGAMENTO: FormaPagamentoParaSelect[] = [
  { id: "dinheiro", nome: "Dinheiro" }, { id: "pix", nome: "PIX" },
  { id: "debito", nome: "Cartão de Débito" }, { id: "credito", nome: "Cartão de Crédito" },
];

const Home: React.FC = () => {
  // General Page State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [onSummaryLoading, setSummaryLoading] = useState<boolean>(true);

  // Summary Card States
  const [clientsActiveSummary, setClientsActiveSummary] = useState<Client[]>([]);
  const [totalEntradasCaixaAberto, setTotalEntradasCaixaAberto] = useState<number>(0);
  const [totalSaidasCaixaAberto, setTotalSaidasCaixaAberto] = useState<number>(0);

  // Student Management States
  const [students, setStudents] = useState<Client[]>([]);
  const [studentRowsPerPage, setStudentRowsPerPage] = useState<number>(5);
  const [studentCurrentPage, setStudentCurrentPage] = useState<number>(1);
  const [isClientModalOpen, setIsClientModalOpen] = useState<boolean>(false);
  const [clientModalMode, setClientModalMode] = useState<StudentModalMode>(StudentModalMode.CREATE);
  const [selectedClientState, setSelectedClientState] = useState<Client | null>(null);
  const [isStudentsLoading, setIsStudentsLoading] = useState<boolean>(false); // Separate loading for student table
  const [studentSearchInput, setStudentSearchInput] = useState<string>("");

  // Cashier (Caixa) States
  const [activeCaixaDetails, setActiveCaixaDetails] = useState<ActiveCaixa | null>(null);
  const [caixaMovimentacoes, setCaixaMovimentacoes] = useState<FinanceiroItem[]>([]);
  const [caixaRowsPerPage, setCaixaRowsPerPage] = useState<number>(10);
  const [caixaCurrentPage, setCaixaCurrentPage] = useState<number>(1);
  const [isCaixaLoading, setIsCaixaLoading] = useState<boolean>(true);
  const [caixaInputSearch, setCaixaInputSearch] = useState<string>("");
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [showAbrirCaixaModal, setShowAbrirCaixaModal] = useState(false);
  const [showFecharCaixaModal, setShowFecharCaixaModal] = useState(false);
  const [alunosListCaixa, setAlunosListCaixa] = useState<AlunoParaSelect[]>([]);
  const [produtosListCaixa, setProdutosListCaixa] = useState<ProdutoParaSelect[]>([]);
  const [isLoadingCaixaSelectData, setIsLoadingCaixaSelectData] = useState(false); // For products part of selects
  const [isSubmittingCaixaAction, setIsSubmittingCaixaAction] = useState(false);

  const adjustString = (text: string | null | undefined): string => {
    if (!text) return "";
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const fetchHomePageSummaryData = useCallback(async (userId?: string, caixaId?: string) => {
    setSummaryLoading(true);
    try {
      const fetchActiveStudentsPromise = supabase.from("alunos").select("id, ativo").eq("ativo", true);
      let fetchFinanceiroPromise;
      if (userId && caixaId) {
        fetchFinanceiroPromise = supabase.from("financeiro").select("tipo, valor").eq("caixa_id", caixaId);
      } else {
        fetchFinanceiroPromise = Promise.resolve({ data: [], error: null });
      }
      const [activeStudentsRes, financeiroRes] = await Promise.all([fetchActiveStudentsPromise, fetchFinanceiroPromise]);
      if (activeStudentsRes.error) console.error("Erro(sumário):", activeStudentsRes.error.message);
      else if (activeStudentsRes.data) setClientsActiveSummary(activeStudentsRes.data as Client[]);
      if (financeiroRes.error) { setTotalEntradasCaixaAberto(0); setTotalSaidasCaixaAberto(0); }
      else if (financeiroRes.data && caixaId) {
        const movs = financeiroRes.data as MovimentacaoCaixaAtivoSummary[];
        let ent = 0, sai = 0;
        movs.forEach(m => m.tipo === "pagamento" || m.tipo === "venda" ? ent += m.valor : m.tipo === "saida" ? sai += m.valor : null);
        setTotalEntradasCaixaAberto(ent); setTotalSaidasCaixaAberto(sai);
      } else { setTotalEntradasCaixaAberto(0); setTotalSaidasCaixaAberto(0); }
    } catch (err) { console.error("Erro sumário:", err); setTotalEntradasCaixaAberto(0); setTotalSaidasCaixaAberto(0); }
    finally { setSummaryLoading(false); }
  }, []);

  const fetchStudentsCallback = useCallback(async () => { // Renamed to avoid conflict in useEffect dependency array
    setIsStudentsLoading(true);
    try {
      const { data, error } = await supabase.from("alunos").select("*").order("nome", { ascending: true });
      if (error) { toast.error("Erro ao buscar alunos."); return; }
      if (data) setStudents(data as Client[]);
    } catch (err) { toast.error("Erro inesperado ao buscar alunos."); }
    finally { setIsStudentsLoading(false); }
  }, []);

  const checkUserAndActiveCaixaCallback = useCallback(async (user: User | null) => { // Renamed
    if (user) {
      const { data, error } = await supabase.from("caixas").select("id, usuario_id, valor_inicial, data_abertura, observacoes_abertura")
        .eq("usuario_id", user.id).eq("status", "aberto").maybeSingle();
      if (error) { toast.error("Erro status caixa."); setActiveCaixaDetails(null); }
      else setActiveCaixaDetails(data ? { ...data, valor_inicial: Number(data.valor_inicial || 0) } : null);
    } else setActiveCaixaDetails(null);
  }, []);

  const fetchCaixaMovimentacoesCallback = useCallback(async (caixaId?: string | null) => { // Renamed
    setIsCaixaLoading(true);
    try {
      if (!caixaId) { setCaixaMovimentacoes([]); return; }
      const { data, error } = await supabase.from("financeiro").select("*, clientes:cliente_id(nome), produtos:produto_id(nome)")
        .eq("caixa_id", caixaId).order("created_at", { ascending: false });
      if (error) { toast.error("Erro movimentações caixa."); return; }
      if (data) setCaixaMovimentacoes(data.map(i => ({ ...i, cliente_nome: (i.clientes as any)?.nome, produto_nome: (i.produtos as any)?.nome })) as FinanceiroItem[]);
    } catch (err) { toast.error("Erro inesperado movimentações."); }
    finally { setIsCaixaLoading(false); }
  }, []);

  const fetchDadosParaCaixaSelectsCallback = useCallback(async (currentStudents: Client[]) => { // Renamed & takes students
    setIsLoadingCaixaSelectData(true);
    try {
      // Use existing students for AlunoParaSelect
      const alunosParaCaixaSelect: AlunoParaSelect[] = currentStudents.map(s => ({ id: s.id, nome: s.nome }));
      setAlunosListCaixa(alunosParaCaixaSelect);

      // Fetch only products
      const { data: produtosData, error: produtosError } = await supabase.from("produtos").select("id, nome, valor").order("nome", { ascending: true });
      if (produtosError) toast.error("Erro produtos selects: " + produtosError.message);
      else setProdutosListCaixa((produtosData || []).map(p => ({ id: p.id, nome: p.nome, valor: p.valor })) as ProdutoParaSelect[]);
    } catch (error) { toast.error("Falha dados selects caixa."); }
    finally { setIsLoadingCaixaSelectData(false); }
  }, []); // Removed students from dependencies as it's passed directly

  useEffect(() => {
    const loadInitialUserAndCaixa = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      await checkUserAndActiveCaixaCallback(user); // Sets activeCaixaDetails
    };
    loadInitialUserAndCaixa();
    fetchStudentsCallback(); // Fetch students initially
  }, [checkUserAndActiveCaixaCallback, fetchStudentsCallback]);

  useEffect(() => {
    // Fetch summary once activeCaixaDetails is known (or user is null)
    fetchHomePageSummaryData(currentUser?.id, activeCaixaDetails?.id);
  }, [currentUser, activeCaixaDetails, fetchHomePageSummaryData]);

  useEffect(() => {
    // Fetch caixa movimentacoes when activeCaixaDetails changes
    fetchCaixaMovimentacoesCallback(activeCaixaDetails?.id);
  }, [activeCaixaDetails, fetchCaixaMovimentacoesCallback]);

  useEffect(() => {
    // Fetch data for caixa selects (products) once students are loaded
    if (students.length > 0) {
      fetchDadosParaCaixaSelectsCallback(students);
    }
  }, [students, fetchDadosParaCaixaSelectsCallback]);


  const openCreateStudentModal = () => { setSelectedClientState(null); setClientModalMode(StudentModalMode.CREATE); setIsClientModalOpen(true); };
  const openViewStudentModal = (client: Client) => { setSelectedClientState(client); setClientModalMode(StudentModalMode.VIEW); setIsClientModalOpen(true); };
  const openEditStudentModal = (client: Client) => { setSelectedClientState(client); setClientModalMode(StudentModalMode.EDIT); setIsClientModalOpen(true); };
  const handleCloseStudentModal = () => { setIsClientModalOpen(false); setSelectedClientState(null); };
  const handleStudentSaveComplete = useCallback((error: any | null, _s?: Partial<StudentFormData>, mode?: StudentModalMode) => {
    if (error) toast.error(`Erro: ${(error as Error).message || 'Erro'}`);
    else { toast.success(`Aluno ${mode === StudentModalMode.CREATE ? 'cadastrado' : 'atualizado'}!`); fetchStudentsCallback(); handleCloseStudentModal(); }
  }, [fetchStudentsCallback]);
  const getInitialStudentModalData = (): Partial<StudentFormData> | undefined => {
    if ((clientModalMode === StudentModalMode.EDIT || clientModalMode === StudentModalMode.VIEW) && selectedClientState) return selectedClientState;
    return undefined;
  };

  const handleNovaMovimentacaoClick = () => {
    if (!currentUser) { toast.warn("Usuário não autenticado."); return; }
    if (activeCaixaDetails?.usuario_id === currentUser.id) setIsFinanceModalOpen(true);
    else setShowAbrirCaixaModal(true);
  };
  const handleCloseFinanceModal = () => setIsFinanceModalOpen(false);
  const handleCloseAbrirCaixaModal = () => setShowAbrirCaixaModal(false);
  const handleCloseFecharCaixaModal = () => setShowFecharCaixaModal(false);
  const handleAbrirModalFechamento = () => { if (!activeCaixaDetails) { toast.info("Nenhum caixa ativo."); return; } setShowFecharCaixaModal(true); };

  const handleAbrirCaixa = async (formData: AbrirCaixaFormData) => {
    if (!currentUser) return;
    setIsSubmittingCaixaAction(true);
    try {
      const { data: nCaixa, error } = await supabase.from("caixas")
        .insert([{ ...formData, usuario_id: currentUser.id, status: "aberto" }])
        .select("id, usuario_id, valor_inicial, data_abertura, observacoes_abertura").single();
      if (error) throw error;
      if (nCaixa) { setActiveCaixaDetails({ ...nCaixa, valor_inicial: Number(nCaixa.valor_inicial||0) }); setShowAbrirCaixaModal(false); toast.success("Caixa aberto!"); }
    } catch (e:any) { toast.error("Erro abrir caixa: " + e.message); } finally { setIsSubmittingCaixaAction(false); }
  };

  const handleSaveMovimentacao = async (data: Partial<CaixaModalFormData>) => {
    if (!activeCaixaDetails || !currentUser || activeCaixaDetails.usuario_id !== currentUser.id) { toast.error("Caixa não ativo."); return; }
    setIsSubmittingCaixaAction(true);
    const p: any = { ...data, caixa_id: activeCaixaDetails.id, usuario_id_transacao: currentUser.id };
        console.log(p)

    Object.keys(p).forEach(k => (p[k] === undefined || p[k] === "") && delete p[k]);
    const { error } = await supabase.from("financeiro").insert([p]);
    if (error) toast.error("Erro registro: " + error.message);
    else { toast.success("Registrado!"); fetchCaixaMovimentacoesCallback(activeCaixaDetails.id); handleCloseFinanceModal(); fetchHomePageSummaryData(currentUser.id, activeCaixaDetails.id); }
    setIsSubmittingCaixaAction(false);
  };

  const generatePDFFechamentoCaixa = (caixa: ActiveCaixa, trans: FinanceiroItem[], tots: { e: number; s: number; sal: number }, obs?: string) => {
    const doc = new jsPDF({ o: "p", u: "mm", f: "a4" }); const pw = doc.internal.pageSize.getWidth(); const m = 15; let cy = 20;
    doc.setFontSize(16); doc.text("Fechamento de Caixa", pw / 2, cy, { align: "center" }); cy += 10; doc.setFontSize(10);
    doc.text(`ID Caixa: ${caixa.id.substring(0,6)}`, m, cy); cy += 7; doc.text(`Usuário: ${currentUser?.email || 'N/A'}`, m, cy); cy += 7;
    doc.text(`Abertura: ${new Date(caixa.data_abertura).toLocaleString('pt-BR')}`, m, cy); cy += 7;
    doc.text(`Fechamento: ${new Date(caixa.data_fechamento!).toLocaleString('pt-BR')}`, m, cy); cy += 7;
    doc.text(`V. Inicial: ${Number(caixa.valor_inicial).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`, m, cy); cy += 7;
    if(caixa.observacoes_abertura) {doc.text(`Obs Abertura: ${caixa.observacoes_abertura}`, m, cy); cy+=7;} if(obs){doc.text(`Obs Fechamento: ${obs}`, m, cy); cy+=7;}
    doc.text(`T. Entradas: ${tots.e.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`, m, cy); cy += 7;
    doc.text(`T. Saídas: ${tots.s.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`, m, cy); cy += 7;
    doc.text(`Saldo Final: ${tots.sal.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`, m, cy); cy += 10;
    autoTable(doc, { startY: cy, head: [['Data', 'Tipo', 'Pgto', 'Valor', 'Desc', 'Cliente', 'Prod']],
      body: trans.map(t => [ new Date(t.created_at).toLocaleTimeString('pt-BR'), t.tipo, t.forma_pagamento, Number(t.valor).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}), t.descricao||'-', t.cliente_nome||'-', t.produto_nome||'-']),
      theme: 'grid', headStyles: { fillColor: [41, 128, 185] }});
    doc.save(`fech_caixa_${caixa.id.substring(0,6)}.pdf`); toast.success("PDF gerado!");
  };

  const handleConfirmarFechamentoCaixa = async (formData: FecharCaixaFormData) => {
    if (!activeCaixaDetails || !currentUser || activeCaixaDetails.usuario_id !== currentUser.id) { toast.error("Caixa não ativo."); return; }
    setIsSubmittingCaixaAction(true);
    try {
      const { data: trans, error: transErr } = await supabase.from("financeiro").select("*, cliente_nome:clientes(nome), produto_nome:produtos(nome)").eq("caixa_id", activeCaixaDetails.id);
      if (transErr) throw transErr;
      let tE = 0, tS = 0; (trans||[]).forEach(t => t.tipo==="pagamento"||t.tipo==="venda" ? tE+=Number(t.valor) : t.tipo==="saida" ? tS+=Number(t.valor) : null);
      const sF = (activeCaixaDetails.valor_inicial||0)+tE-tS; const dfISO = new Date().toISOString();
      const pUCaixa = { status:"fechado",data_fechamento:dfISO, obs_fechamento:formData.observacoes_fechamento||null, valor_total_entradas:tE, valor_total_saidas:tS, saldo_final_calculado:sF };
      const {error:updErr} = await supabase.from("caixas").update(pUCaixa).eq("id",activeCaixaDetails.id); if(updErr) throw updErr;
      generatePDFFechamentoCaixa({...activeCaixaDetails, data_fechamento:dfISO, valor_total_entradas:tE, valor_total_saidas:tS, saldo_final_calculado:sF }, (trans||[]) as FinanceiroItem[], {e:tE,s:tS,sal:sF}, formData.observacoes_fechamento);
      toast.success("Caixa fechado!"); setActiveCaixaDetails(null); setShowFecharCaixaModal(false); await fetchCaixaMovimentacoesCallback(null); await fetchHomePageSummaryData(currentUser.id, null);
    } catch (e:any) { toast.error("Erro fechar caixa: " + e.message); } finally { setIsSubmittingCaixaAction(false); }
  };

  const filteredStudents = students.filter(i => adjustString(i.nome).includes(adjustString(studentSearchInput)));
  const currentStudentTableData = filteredStudents.slice((studentCurrentPage - 1) * studentRowsPerPage, ((studentCurrentPage - 1) * studentRowsPerPage) + studentRowsPerPage);
  const filteredCaixaMovimentacoes = caixaMovimentacoes.filter(i => (adjustString(i.tipo).includes(adjustString(caixaInputSearch)) || adjustString(i.descricao).includes(adjustString(caixaInputSearch)) || adjustString(i.cliente_nome).includes(adjustString(caixaInputSearch)) || adjustString(i.produto_nome).includes(adjustString(caixaInputSearch))));
  const currentCaixaTableData = filteredCaixaMovimentacoes.slice((caixaCurrentPage - 1) * caixaRowsPerPage, ((caixaCurrentPage - 1) * caixaRowsPerPage) + caixaRowsPerPage);

  return (
    <Styles.Container>
      {onSummaryLoading ? (
        <Styles.LoaderDiv><Loader color="#000" /></Styles.LoaderDiv>
      ) : (
        <Styles.CardContainer>
          <Styles.Card><Styles.CardNumber>{clientsActiveSummary.length}</Styles.CardNumber><Styles.CardLabel>Aluno(s) Ativo(s)</Styles.CardLabel></Styles.Card>
          <Styles.Card><Styles.CardNumber style={{color:Styles.COLORS.success}}>{totalEntradasCaixaAberto.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</Styles.CardNumber><Styles.CardLabel>Entradas (Caixa Aberto)</Styles.CardLabel></Styles.Card>
          <Styles.Card><Styles.CardNumber style={{color:Styles.COLORS.danger}}>{totalSaidasCaixaAberto.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</Styles.CardNumber><Styles.CardLabel>Saídas (Caixa Aberto)</Styles.CardLabel></Styles.Card>
        </Styles.CardContainer>
      )}
      <Styles.Section border>
        <><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}><div style={{maxWidth:400,flexGrow:1,marginRight:'1rem'}}><Styles.Input value={studentSearchInput} onChange={(e)=>setStudentSearchInput(e.target.value)} placeholder="Pesquisar Aluno"/></div><Styles.CadastrarButton onClick={openCreateStudentModal}><FiPlus/></Styles.CadastrarButton></div>
        {isStudentsLoading?(<Styles.LoaderDiv><Loader color="#000"/></Styles.LoaderDiv>):(<DefaultTable data={currentStudentTableData} columns={studentTableColumns} rowsPerPage={studentRowsPerPage} currentPage={studentCurrentPage} totalRows={filteredStudents.length} onPageChange={setStudentCurrentPage} onRowsPerPageChange={(r)=>{setStudentRowsPerPage(r);setStudentCurrentPage(1);}} showActions noDelete onView={openViewStudentModal} onEdit={openEditStudentModal}/>)}
        </>
      </Styles.Section>
      <Styles.Section>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
          <div style={{maxWidth:400,flexGrow:1,marginRight:'1rem'}}>
            <Styles.Input value={caixaInputSearch} onChange={(e)=>setCaixaInputSearch(e.target.value)} placeholder="Pesquisar Movimentação"/>
          </div>
          <div style={{display:"flex",gap:"10px"}}>
            {activeCaixaDetails&&currentUser&&activeCaixaDetails.usuario_id===currentUser.id&&(
              <Styles.FecharCaixaButton onClick={handleAbrirModalFechamento} disabled={isSubmittingCaixaAction||isLoadingCaixaSelectData}>Fechar Caixa</Styles.FecharCaixaButton>
            )}
            <Styles.CadastrarButton onClick={handleNovaMovimentacaoClick} disabled={isLoadingCaixaSelectData||!currentUser||isSubmittingCaixaAction}>
              <FiPlus/>
            </Styles.CadastrarButton>
          </div>
        </div>
        {isCaixaLoading?(<Styles.LoaderDiv><Loader color="#000"/></Styles.LoaderDiv>):(
          <DefaultTable data={currentCaixaTableData} columns={financeTableColumns} rowsPerPage={caixaRowsPerPage} currentPage={caixaCurrentPage} totalRows={filteredCaixaMovimentacoes.length} onPageChange={setCaixaCurrentPage} onRowsPerPageChange={(r)=>{setCaixaRowsPerPage(r);setCaixaCurrentPage(1);}}/>
        )}
      </Styles.Section>
      {isClientModalOpen&&(<ClientModal open={isClientModalOpen} mode={clientModalMode} initialData={getInitialStudentModalData()} alunoIdToEdit={clientModalMode===StudentModalMode.EDIT&&selectedClientState?selectedClientState.id:undefined} onClose={handleCloseStudentModal} onSaveComplete={handleStudentSaveComplete}/>)}
      {showAbrirCaixaModal&&currentUser&&(<AbrirCaixaModal open={showAbrirCaixaModal} onClose={handleCloseAbrirCaixaModal} onAbrirCaixa={handleAbrirCaixa} userName={currentUser.email||"Usuário"} isSubmitting={isSubmittingCaixaAction}/>)}
      {isFinanceModalOpen&&activeCaixaDetails&&currentUser&&(<CaixaModal open={isFinanceModalOpen} onClose={handleCloseFinanceModal} onSave={handleSaveMovimentacao} alunosList={alunosListCaixa} produtosList={produtosListCaixa} formasPagamentoList={HARDCODED_FORMAS_PAGAMENTO} isSubmitting={isSubmittingCaixaAction} isLoadingSelectData={isLoadingCaixaSelectData}/>)}
      {showFecharCaixaModal&&activeCaixaDetails&&currentUser&&(<FecharCaixaModal open={showFecharCaixaModal} onClose={handleCloseFecharCaixaModal} onConfirmFechar={handleConfirmarFechamentoCaixa} caixaId={activeCaixaDetails.id} isSubmitting={isSubmittingCaixaAction}/>)}
      <ToastContainer autoClose={3000} hideProgressBar/>
    </Styles.Container>
  );
};
export default Home;
