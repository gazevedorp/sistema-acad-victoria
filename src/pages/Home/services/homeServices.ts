import { supabase } from "../../../lib/supabase";

export interface MovimentacaoCaixaAtivoSummary {
  tipo: string;
  valor: number;
}

export interface ClienteAtivoSummary {
  id: string;
  ativo: boolean;
}

export interface AlunoOld {
  alunoID: number;
  alunoMatricula: number;
  alunoNome: string;
  alunoEndereco: string | null;
  alunoBairro: string | null;
  alunoCidade: string | null;
  alunoCEP: string | null;
  alunoTelefone: string | null;
  alunoCelular: string | null;
  alunoSexo: number;
  alunoCPF: string | null;
  alunoIdentidade: string | null;
  alunoEmail: string | null;
  alunoDataNascimento: string;
  alunoProfissao: string | null;
  alunoEstadoCivil: string | null;
  alunoObjetivo: string | null;
  alunoPai: string | null;
  alunoMae: string | null;
  alunoPaiCPF: string | null;
  alunoMaeCPF: string | null;
  alunoTelefonePai: string | null;
  alunoTelefoneMae: string | null;
  alunoResponsavel: string | null;
  alunoResponsavelCPF: string | null;
  alunoTelefoneResponsavel: string | null;
  alunoSoubeAcademia: string | null;
  funcID: number;
  alunoDigitosCelular: number;
  alunoExcluido: boolean;
  alunoObs: string | null;
  alunoDtCadastro: string;
  alunoEstado: string | null;
}

export interface HomeSummaryData {
  clientsActiveSummary: ClienteAtivoSummary[];
  totalEntradasCaixaAberto: number;
  totalSaidasCaixaAberto: number;
}

export interface ActiveCaixa {
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

export interface FinanceiroItem {
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

export interface AlunoParaSelect {
  id: number;
  nome: string;
}

export interface ProdutoParaSelect {
  id: string;
  nome: string;
  valor: number;
}

export interface StudentsData {
  students: AlunoOld[];
  totalStudents: number;
}

// === SERVICES ===

export const fetchHomePageSummaryData = async (
  caixaId?: string | null
): Promise<HomeSummaryData> => {
  try {
    // Buscar alunos ativos (não excluídos)
    const fetchActiveStudentsPromise = supabase
      .from("alunos_old")
      .select("alunoID")
      .eq("alunoExcluido", false);

    // Buscar dados financeiros apenas se o caixaId estiver presente
    let fetchFinanceiroPromise;
    if (caixaId) {
      fetchFinanceiroPromise = supabase
        .from("financeiro")
        .select("tipo, valor")
        .eq("caixa_id", caixaId);
    } else {
      fetchFinanceiroPromise = Promise.resolve({ data: [], error: null });
    }

    const [activeStudentsRes, financeiroRes] = await Promise.all([
      fetchActiveStudentsPromise,
      fetchFinanceiroPromise,
    ]);

    if (activeStudentsRes.error) {
      console.error("Erro ao buscar resumo de alunos ativos:", activeStudentsRes.error.message);
      throw new Error("Erro ao buscar resumo de alunos ativos");
    }

    if (financeiroRes.error && caixaId) {
      console.error("Erro ao buscar resumo financeiro do caixa:", financeiroRes.error.message);
      throw new Error("Erro ao buscar resumo financeiro do caixa");
    }

    const clientsActiveSummary = (activeStudentsRes.data || []).map(item => ({
      id: String(item.alunoID),
      ativo: true
    })) as ClienteAtivoSummary[];
    
    let totalEntradasCaixaAberto = 0;
    let totalSaidasCaixaAberto = 0;

    if (financeiroRes.data && caixaId) {
      const movs = financeiroRes.data as MovimentacaoCaixaAtivoSummary[];
      movs.forEach((m) => {
        if (m.tipo === "pagamento" || m.tipo === "venda") {
          totalEntradasCaixaAberto += m.valor;
        } else if (m.tipo === "saida") {
          totalSaidasCaixaAberto += m.valor;
        }
      });
    }

    return {
      clientsActiveSummary,
      totalEntradasCaixaAberto,
      totalSaidasCaixaAberto,
    };
  } catch (error) {
    console.error("Erro inesperado ao buscar dados para o sumário da home:", error);
    throw error;
  }
};

export const fetchStudents = async (
  searchQuery: string = "",
  page: number = 1,
  pageSize: number = 10,
  matriculaSituacao?: string
): Promise<StudentsData> => {
  try {
    let query;
    
    if (matriculaSituacao === 'antigos') {
      const { data: alunosComMatricula } = await supabase
        .from("matricula_old")
        .select("alunoID");
      
      const idsComMatricula = alunosComMatricula?.map(m => m.alunoID) || [];
      query = supabase
        .from("alunos_old")
        .select("*", { count: 'exact' })
        .eq("alunoExcluido", false);
      
      if (idsComMatricula.length > 0) {
        query = query.not('alunoID', 'in', `(${idsComMatricula.join(',')})`);
      }
    } else {
      // Para os demais filtros, usar inner join
      query = supabase
        .from("alunos_old")
        .select(`
          *,
          matricula_old!inner(*)
        `, { count: 'exact' })
        .eq("alunoExcluido", false);

      // Aplicar filtro de situação da matrícula se fornecido
      if (matriculaSituacao && matriculaSituacao !== 'todos') {
        const situacaoMap = {
          'ativos': 'ATIVA',
          'bloqueados': 'BLOQUEADA',
          'encerrados': 'ENCERRADA'
        };
        query = query.eq('matricula_old.matriculaSituacao', situacaoMap[matriculaSituacao as keyof typeof situacaoMap]);
      }
    }

    // Aplicar filtro de busca se fornecido
    if (searchQuery.trim()) {
      query = query.ilike('alunoNome', `%${searchQuery}%`);
    }

    // Ordenar e aplicar paginação
    query = query.order("alunoNome", { ascending: true });
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Erro ao buscar alunos:", error);
      throw new Error("Erro ao buscar alunos");
    }

    return {
      students: (data || []) as AlunoOld[],
      totalStudents: count || 0
    };
  } catch (error) {
    console.error("Erro inesperado ao buscar alunos:", error);
    throw error;
  }
};

export const checkActiveCaixa = async (userId: string): Promise<ActiveCaixa | null> => {
  try {
    const { data, error } = await supabase
      .from("caixas")
      .select("id, usuario_id, valor_inicial, data_abertura, observacoes_abertura")
      .eq("usuario_id", userId)
      .eq("status", "aberto")
      .maybeSingle();

    if (error) {
      console.error("Erro ao verificar status do caixa:", error);
      throw new Error("Erro ao verificar status do caixa");
    }

    return data ? { ...data, valor_inicial: Number(data.valor_inicial || 0) } : null;
  } catch (error) {
    console.error("Erro inesperado ao verificar caixa:", error);
    throw error;
  }
};

export const fetchCaixaSelectsData = async (): Promise<{
  alunos: AlunoParaSelect[];
  produtos: ProdutoParaSelect[];
}> => {
  try {
    const [studentsRes, produtosRes] = await Promise.all([
      supabase
        .from("alunos_old")
        .select("alunoID, alunoNome")
        .eq("alunoExcluido", false)
        .order("alunoNome", { ascending: true }),
      supabase
        .from("produtos")
        .select("id, nome, valor")
        .order("nome", { ascending: true })
    ]);

    if (studentsRes.error) {
      console.error("Erro ao buscar alunos para select:", studentsRes.error);
      throw new Error("Erro ao buscar alunos para select");
    }

    if (produtosRes.error) {
      console.error("Erro ao buscar produtos para select:", produtosRes.error);
      throw new Error("Erro ao buscar produtos para select");
    }

    return {
      alunos: (studentsRes.data || []).map(s => ({ id: s.alunoID, nome: s.alunoNome })),
      produtos: (produtosRes.data || []).map(p => ({ id: p.id, nome: p.nome, valor: p.valor }))
    };
  } catch (error) {
    console.error("Erro inesperado ao buscar dados para selects:", error);
    throw error;
  }
};

/**
 * Abre um novo caixa
 */
export const abrirCaixa = async (
  userId: string,
  valorInicial: number,
  observacoes?: string
): Promise<ActiveCaixa> => {
  try {
    const { data, error } = await supabase
      .from("caixas")
      .insert([{
        usuario_id: userId,
        valor_inicial: valorInicial,
        observacoes_abertura: observacoes || null,
        status: "aberto",
        data_abertura: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error("Erro ao abrir caixa:", error);
      throw new Error("Erro ao abrir caixa");
    }

    return {
      ...data,
      valor_inicial: Number(data.valor_inicial || 0)
    } as ActiveCaixa;
  } catch (error) {
    console.error("Erro inesperado ao abrir caixa:", error);
    throw error;
  }
};

/**
 * Salva uma movimentação no caixa
 */
export const saveMovimentacao = async (
  caixaId: string,
  movimentacao: {
    tipo: string;
    forma_pagamento: string;
    valor: number;
    descricao?: string;
    cliente_id?: string | number;
    produto_id?: string;
  }
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("financeiro")
      .insert([{
        ...movimentacao,
        caixa_id: caixaId
      }]);

    if (error) {
      console.error("Erro ao salvar movimentação:", error);
      throw new Error("Erro ao salvar movimentação");
    }
  } catch (error) {
    console.error("Erro inesperado ao salvar movimentação:", error);
    throw error;
  }
};

/**
 * Fecha o caixa e retorna os dados para o PDF
 */
export const fecharCaixa = async (
  caixaId: string,
  observacoesFechamento?: string
): Promise<{
  caixa: ActiveCaixa;
  transacoes: FinanceiroItem[];
  totais: { entradas: number; saidas: number; saldo: number };
}> => {
  try {
    // Buscar transações do caixa
    const { data: transacoes, error: transError } = await supabase
      .from("financeiro")
      .select("*")
      .eq("caixa_id", caixaId);

    if (transError) {
      throw new Error("Erro ao buscar transações do caixa");
    }

    // Calcular totais
    let totalEntradas = 0;
    let totalSaidas = 0;

    (transacoes || []).forEach(t => {
      if (t.tipo === "pagamento" || t.tipo === "venda") {
        totalEntradas += Number(t.valor);
      } else if (t.tipo === "saida") {
        totalSaidas += Number(t.valor);
      }
    });

    // Buscar dados do caixa para calcular saldo final
    const { data: caixaData, error: caixaError } = await supabase
      .from("caixas")
      .select("*")
      .eq("id", caixaId)
      .single();

    if (caixaError) {
      throw new Error("Erro ao buscar dados do caixa");
    }

    const saldoFinal = Number(caixaData.valor_inicial || 0) + totalEntradas - totalSaidas;
    const dataFechamentoISO = new Date().toISOString();

    // Atualizar o caixa como fechado
    const { error: updateError } = await supabase
      .from("caixas")
      .update({
        status: "fechado",
        data_fechamento: dataFechamentoISO,
        observacoes_fechamento: observacoesFechamento || null,
        valor_total_entradas: totalEntradas,
        valor_total_saidas: totalSaidas,
        saldo_final_calculado: saldoFinal
      })
      .eq("id", caixaId);

    if (updateError) {
      throw new Error("Erro ao fechar caixa");
    }

    return {
      caixa: {
        ...caixaData,
        data_fechamento: dataFechamentoISO,
        valor_total_entradas: totalEntradas,
        valor_total_saidas: totalSaidas,
        saldo_final_calculado: saldoFinal
      } as ActiveCaixa,
      transacoes: (transacoes || []) as FinanceiroItem[],
      totais: { entradas: totalEntradas, saidas: totalSaidas, saldo: saldoFinal }
    };
  } catch (error) {
    console.error("Erro inesperado ao fechar caixa:", error);
    throw error;
  }
};

/**
 * Busca histórico de transações de um caixa
 */
export const fetchTransactionHistory = async (caixaId: string): Promise<FinanceiroItem[]> => {
  try {
    const { data, error } = await supabase
      .from("financeiro")
      .select("*, clientes:cliente_id(nome), produtos:produto_id(nome)")
      .eq("caixa_id", caixaId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar histórico de transações:", error);
      throw new Error("Erro ao buscar histórico de transações");
    }

    return (data || []).map(item => ({
      ...item,
      cliente_nome: (item.clientes as any)?.nome,
      produto_nome: (item.produtos as any)?.nome
    })) as FinanceiroItem[];
  } catch (error) {
    console.error("Erro inesperado ao buscar histórico:", error);
    throw error;
  }
};