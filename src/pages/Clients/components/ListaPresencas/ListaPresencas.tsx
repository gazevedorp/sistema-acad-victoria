import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import * as Styles from "../ClientModal/ClientModal.styles";
import Loader from "../../../../components/Loader/Loader";
import { toast } from "react-toastify";

interface Presenca {
  id: string;
  data_aula: string;
  presente: boolean;
  observacoes?: string;
  turma_nome?: string;
}

interface ListaPresencasProps {
  alunoId: string;
  alunoName: string;
}

const ListaPresencas: React.FC<ListaPresencasProps> = ({ alunoId, alunoName }) => {
  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPresencas = async () => {
      setIsLoading(true);
      try {
        // Aqui você pode ajustar a query conforme sua estrutura de banco
        const { data, error } = await supabase
          .from("presencas") // Assumindo que existe uma tabela de presenças
          .select(`
            id,
            data_aula,
            presente,
            observacoes,
            turmas(nome)
          `)
          .eq("aluno_id", alunoId)
          .order("data_aula", { ascending: false });

        if (error) {
          console.error("Erro ao buscar presenças:", error);
          toast.error("Erro ao carregar lista de presenças");
        } else {
          setPresencas(data || []);
        }
      } catch (error) {
        console.error("Erro inesperado:", error);
        toast.error("Erro inesperado ao carregar presenças");
      } finally {
        setIsLoading(false);
      }
    };

    if (alunoId) {
      fetchPresencas();
    }
  }, [alunoId]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Loader color="#0898e6" />
      </div>
    );
  }

  return (
    <Styles.TabContent>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: Styles.COLORS.textBody }}>
          Lista de Presenças - {alunoName}
        </h3>
        <p style={{ margin: 0, color: Styles.COLORS.textMuted, fontSize: '0.875rem' }}>
          Histórico de presenças do aluno nas aulas
        </p>
      </div>

      {presencas.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          color: Styles.COLORS.textMuted 
        }}>
          <p>Nenhuma presença registrada para este aluno.</p>
        </div>
      ) : (
        <div style={{ 
          border: `1px solid ${Styles.COLORS.borderDefault}`,
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 120px 100px 1fr',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: Styles.COLORS.backgroundLight,
            fontWeight: '500',
            fontSize: '0.875rem',
            borderBottom: `1px solid ${Styles.COLORS.borderDefault}`
          }}>
            <div>Data da Aula</div>
            <div>Turma</div>
            <div>Status</div>
            <div>Observações</div>
          </div>
          
          {presencas.map((presenca) => (
            <div
              key={presenca.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px 100px 1fr',
                gap: '12px',
                padding: '12px 16px',
                borderBottom: `1px solid ${Styles.COLORS.borderDefault}`,
                fontSize: '0.875rem'
              }}
            >
              <div>{new Date(presenca.data_aula).toLocaleDateString('pt-BR')}</div>
              <div>{presenca.turma_nome || '-'}</div>
              <div>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  backgroundColor: presenca.presente ? '#d4edda' : '#f8d7da',
                  color: presenca.presente ? '#155724' : '#721c24'
                }}>
                  {presenca.presente ? 'Presente' : 'Faltou'}
                </span>
              </div>
              <div style={{ color: Styles.COLORS.textMuted }}>
                {presenca.observacoes || '-'}
              </div>
            </div>
          ))}
        </div>
      )}
    </Styles.TabContent>
  );
};

export default ListaPresencas;
