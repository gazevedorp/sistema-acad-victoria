import React, { useEffect, useState, useCallback } from "react";
import * as Styles from "./Home.styles";
import { supabase } from "../../lib/supabase";
import { Client } from "../../types/ClientTypes";
import Loader from "../../components/Loader/Loader";
// Clients import não é usado aqui, removido se não for necessário para outro fim
// import Clients from "../Clients/Clients";

interface FinanceiroSummaryItem {
  tipo: string;
  valor: number;
  created_at: string;
}

const Home: React.FC = () => {
  const [clientsActive, setActiveClients] = useState<Client[]>([]);
  // const [clients, setClients] = useState<Client[]>([]); // Estado 'clients' não parece estar sendo usado no JSX final
  const [onLoading, setLoading] = useState(false);

  const [totalEntradasHoje, setTotalEntradasHoje] = useState<number>(0);
  const [totalSaidasHoje, setTotalSaidasHoje] = useState<number>(0);

  const fetchClientesEFinanceiro = useCallback(async () => {
    setLoading(true);
    try {
      const [clientesRes, financeiroRes] = await Promise.all([
        supabase
          .from("alunos")
          .select(
            "id, nome, ativo, data_nascimento, telefone, email, cep, rua, numero, complemento, bairro, cidade, estado"
          ), // Selecionando campos para Client
        supabase
          .from("financeiro")
          .select("tipo, valor, created_at")
          .gte(
            "created_at",
            new Date().toISOString().split("T")[0] + "T00:00:00.000Z"
          )
          .lte(
            "created_at",
            new Date().toISOString().split("T")[0] + "T23:59:59.999Z"
          ),
      ]);

      if (clientesRes.error) {
        console.error("Erro ao buscar clientes:", clientesRes.error.message);
        // toast.error("Erro ao buscar clientes."); // Adicione toast se desejar
      } else if (clientesRes.data) {
        // setClients(clientesRes.data as Client[]); // Se precisar da lista completa
        setActiveClients(
          clientesRes.data.filter((item) => item.ativo) as Client[]
        );
      }

      if (financeiroRes.error) {
        console.error(
          "Erro ao buscar resumo financeiro:",
          financeiroRes.error.message
        );
        // toast.error("Erro ao buscar resumo financeiro.");
      } else if (financeiroRes.data) {
        const movimentacoesHoje = financeiroRes.data as FinanceiroSummaryItem[];
        let entradas = 0;
        let saidas = 0;
        movimentacoesHoje.forEach((mov) => {
          if (mov.tipo === "pagamento" || mov.tipo === "venda") {
            entradas += mov.valor;
          } else if (mov.tipo === "saida") {
            saidas += mov.valor;
          }
        });
        setTotalEntradasHoje(entradas);
        setTotalSaidasHoje(saidas);
      }
    } catch (err) {
      console.error("Erro ao buscar dados da home:", err);
      // toast.error("Erro inesperado ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []); // Removidas dependências que são estáveis ou gerenciadas internamente

  useEffect(() => {
    fetchClientesEFinanceiro();
  }, [fetchClientesEFinanceiro]);

  return (
    <Styles.Container>
      <Styles.Header>
        <div>
          <Styles.Title>Resumos</Styles.Title>
          <Styles.Subtitle>
            Seja bem-vindo a sua plataforma de gerenciamento
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

          {/* Card para Entradas do Dia */}
          <Styles.Card>
            <Styles.CardNumber style={{ color: Styles.COLORS.success }}>
              {" "}
              {/* Cor verde para entradas */}
              {totalEntradasHoje.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </Styles.CardNumber>
            <Styles.CardLabel>
              Entrada(s) <br /> Hoje
            </Styles.CardLabel>
          </Styles.Card>

          {/* Card para Saídas do Dia */}
          <Styles.Card>
            <Styles.CardNumber style={{ color: Styles.COLORS.danger }}>
              {" "}
              {/* Cor vermelha para saídas */}
              {totalSaidasHoje.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </Styles.CardNumber>
            <Styles.CardLabel>
              Saída(s) <br /> Hoje
            </Styles.CardLabel>
          </Styles.Card>
        </Styles.CardContainer>
      )}
    </Styles.Container>
  );
};

export default Home;
