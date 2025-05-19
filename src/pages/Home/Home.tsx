import React, { useEffect, useState } from "react";
import * as Styles from "./Home.styles";
import { supabase } from "../../lib/supabase";
import { Client } from "../../types/ClientTypes";
import Loader from "../../components/Loader/Loader";
import Clients from "../Clients/Clients";

const Home: React.FC = () => {
  const [clientsActive, setActiveClients] = useState<Client[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [onLoading, setLoading] = useState(false);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase.from("alunos").select("*");
      if (error) throw error;

      if (data) {
        setClients(data as Client[]);
        setActiveClients(data.filter((item) => item.ativo) as Client[]);
      }
    } catch (err) {
      console.error("Erro ao buscar clientes:", err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      await fetchClientes();
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
          {/* <Styles.Card>
            <Styles.CardNumber>{clients.length}</Styles.CardNumber>
            <Styles.CardLabel>
              Aluno(s) <br /> cadastrado(s)
            </Styles.CardLabel>
          </Styles.Card> */}

          <Styles.Card>
            <Styles.CardNumber>{clientsActive.length}</Styles.CardNumber>
            <Styles.CardLabel>
              Aluno(s) <br /> ativo(s)
            </Styles.CardLabel>
          </Styles.Card>
        </Styles.CardContainer>
      )}
    </Styles.Container>
  );
};

export default Home;
