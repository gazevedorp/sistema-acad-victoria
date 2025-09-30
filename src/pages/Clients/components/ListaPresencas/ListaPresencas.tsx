import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../../lib/supabase";
import * as Styles from "../ClientModal/ClientModal.styles";
import Loader from "../../../../components/Loader/Loader";
import { toast } from "react-toastify";
import { AlunoPresenca } from "../../../../types/PresencaTypes";
import { formatDateVarchar, formatTimeVarchar } from "../../../../utils/formatter";

interface ListaPresencasProps {
  alunoId: string;
  alunoName: string;
}

const ListaPresencas: React.FC<ListaPresencasProps> = ({ alunoId, alunoName }) => {
  const [presencas, setPresencas] = useState<AlunoPresenca[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPresencas = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("alunos_presenca")
        .select("*")
        .eq("codigo_aluno", alunoId) // Agora alunoId já é UUID
        .order("data", { ascending: false })
        .order("hora_entrada", { ascending: false });

      if (error) {
        console.error("Erro ao buscar presenças:", error);
        toast.error("Erro ao carregar lista de presenças");
        setPresencas([]);
      } else {
        setPresencas(data || []);
      }
    } catch (error) {
      console.error("Erro inesperado:", error);
      toast.error("Erro inesperado ao carregar presenças");
      setPresencas([]);
    } finally {
      setIsLoading(false);
    }
  }, [alunoId]);

  useEffect(() => {
    if (alunoId) {
      fetchPresencas();
    }
  }, [alunoId, fetchPresencas]);

  // Removidas as funções locais de formatação - agora usando as do formatter.ts centralizado

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
          Histórico de presenças do aluno
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
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '16px',
            padding: '12px 16px',
            backgroundColor: Styles.COLORS.backgroundLight,
            fontWeight: '500',
            fontSize: '0.875rem',
            borderBottom: `1px solid ${Styles.COLORS.borderDefault}`
          }}>
            <div>Data</div>
            <div>Horário</div>
            <div>Descrição</div>
          </div>
          
          {presencas.map((presenca) => (
            <div
              key={presenca.codigo}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '16px',
                padding: '12px 16px',
                borderBottom: `1px solid ${Styles.COLORS.borderDefault}`,
                fontSize: '0.875rem'
              }}
            >
              <div style={{ fontWeight: '500' }}>
                {formatDateVarchar(presenca.data)}
              </div>
              <div style={{ color: Styles.COLORS.primary, fontWeight: '500' }}>
                {formatTimeVarchar(presenca.hora_entrada)}
              </div>
              <div style={{ color: Styles.COLORS.textBody }}>
                {presenca.descricao || '-'}
              </div>
            </div>
          ))}
        </div>
      )}

      {presencas.length > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: Styles.COLORS.backgroundLight,
          borderRadius: '6px',
          fontSize: '0.875rem',
          color: Styles.COLORS.textMuted,
          textAlign: 'center'
        }}>
          Total de registros: <strong style={{ color: Styles.COLORS.textBody }}>
            {presencas.length}
          </strong>
        </div>
      )}
    </Styles.TabContent>
  );
};

export default ListaPresencas;
