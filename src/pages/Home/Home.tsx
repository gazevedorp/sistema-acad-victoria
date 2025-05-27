import React, { useEffect, useState, useCallback } from "react";
import * as Styles from "./Home.styles";
import { supabase } from "../../lib/supabase";
import { Client } from "../../types/ClientTypes"; // Seu tipo para Aluno
import Loader from "../../components/Loader/Loader";
import { User } from "@supabase/supabase-js"; // Tipo User do Supabase

// Interface para as movimentações do caixa ativo
interface MovimentacaoCaixaAtivo {
  tipo: string;
  valor: number;
}

// Interface para o caixa ativo do usuário
interface ActiveCaixaInfo {
  id: string;
  usuario_id: string;
  // Adicione outros campos se precisar exibir, ex: data_abertura
}

const Home: React.FC = () => {
  const [clientsActive, setActiveClients] = useState<Client[]>([]);
  const [onLoading, setLoading] = useState(true); // Inicia como true

  const [totalEntradasCaixaAberto, setTotalEntradasCaixaAberto] = useState<number>(0);
  const [totalSaidasCaixaAberto, setTotalSaidasCaixaAberto] = useState<number>(0);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeCaixa, setActiveCaixa] = useState<ActiveCaixaInfo | null>(null);

  const fetchHomePageData = useCallback(async (userId: string | undefined, caixaId: string | undefined) => {
    setLoading(true);
    try {
      const fetchClientesPromise = supabase
        .from("alunos")
        .select("id, nome, ativo"); // Selecione apenas os campos necessários

      let fetchFinanceiroPromise;
      if (userId && caixaId) {
        fetchFinanceiroPromise = supabase
          .from("financeiro")
          .select("tipo, valor")
          .eq("caixa_id", caixaId); // Filtra pelo ID do caixa ativo
      } else {
        fetchFinanceiroPromise = Promise.resolve({ data: [], error: null }); // Se não há caixa ativo, não busca financeiro
      }

      const [clientesRes, financeiroRes] = await Promise.all([
        fetchClientesPromise,
        fetchFinanceiroPromise,
      ]);

      if (clientesRes.error) {
        console.error("Erro ao buscar clientes:", clientesRes.error.message);
      } else if (clientesRes.data) {
        setActiveClients(
          clientesRes.data.filter((item) => item.ativo) as Client[]
        );
      }

      if (financeiroRes.error) {
        console.error(
          "Erro ao buscar resumo financeiro do caixa:",
          financeiroRes.error.message
        );
        setTotalEntradasCaixaAberto(0);
        setTotalSaidasCaixaAberto(0);
      } else if (financeiroRes.data && caixaId) { // Processa apenas se houve busca por caixaId
        const movimentacoesCaixa = financeiroRes.data as MovimentacaoCaixaAtivo[];
        let entradas = 0;
        let saidas = 0;
        movimentacoesCaixa.forEach((mov) => {
          // Use os mesmos 'tipo' que você salva na tabela 'financeiro'
          if (mov.tipo === "pagamento" || mov.tipo === "venda") {
            entradas += mov.valor;
          } else if (mov.tipo === "saida") {
            saidas += mov.valor;
          }
        });
        setTotalEntradasCaixaAberto(entradas);
        setTotalSaidasCaixaAberto(saidas);
      } else {
        setTotalEntradasCaixaAberto(0);
        setTotalSaidasCaixaAberto(0);
      }
    } catch (err) {
      console.error("Erro ao buscar dados da home:", err);
      setTotalEntradasCaixaAberto(0);
      setTotalSaidasCaixaAberto(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkUserAndLoadData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        if (user) {
            const { data: caixaData, error: caixaError } = await supabase
            .from('caixas')
            .select('id, usuario_id')
            .eq('usuario_id', user.id)
            .eq('status', 'aberto')
            .maybeSingle();

            if (caixaError) {
                console.error("Erro ao buscar caixa aberto para home:", caixaError.message);
                setActiveCaixa(null);
                await fetchHomePageData(user.id, undefined); // Busca clientes, financeiro será zero
            } else {
                const currentActiveCaixa = caixaData ? { id: caixaData.id, usuario_id: caixaData.usuario_id } : null;
                setActiveCaixa(currentActiveCaixa);
                await fetchHomePageData(user.id, currentActiveCaixa?.id);
            }
        } else {
            // Usuário não logado, não há caixa ativo dele
            setActiveCaixa(null);
            await fetchHomePageData(undefined, undefined); // Busca apenas clientes ou dados públicos
            setLoading(false); // Garante que o loading pare se não houver usuário
        }
    };
    checkUserAndLoadData();
  }, [fetchHomePageData]);


  return (
    <Styles.Container>
      <Styles.Header>
        <div>
          <Styles.Title>Resumos</Styles.Title>
          <Styles.Subtitle>
            Seja bem-vindo à sua plataforma de gerenciamento
          </Styles.Subtitle>
        </div>
      </Styles.Header>

      {onLoading ? (
        <Styles.LoaderDiv>
          <Loader color="#000" />
        </Styles.LoaderDiv>
      ) : (
        <Styles.CardContainer>
          <Styles.Card>
            <Styles.CardNumber>{clientsActive.length}</Styles.CardNumber>
            <Styles.CardLabel>
              Aluno(s) <br /> ativo(s)
            </Styles.CardLabel>
          </Styles.Card>

          <Styles.Card>
            <Styles.CardNumber style={{ color: Styles.COLORS.success }}>
              {totalEntradasCaixaAberto.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </Styles.CardNumber>
            <Styles.CardLabel>
              Entradas <br /> (Caixa Aberto Atual)
            </Styles.CardLabel>
          </Styles.Card>

          <Styles.Card>
            <Styles.CardNumber style={{ color: Styles.COLORS.danger }}>
              {totalSaidasCaixaAberto.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </Styles.CardNumber>
            <Styles.CardLabel>
              Saídas <br /> (Caixa Aberto Atual)
            </Styles.CardLabel>
          </Styles.Card>
        </Styles.CardContainer>
      )}
    </Styles.Container>
  );
};

export default Home;