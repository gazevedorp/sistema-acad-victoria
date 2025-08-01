import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import * as Styles from "../ClientModal/ClientModal.styles";
import Loader from "../../../../components/Loader/Loader";
import { toast } from "react-toastify";

interface Fatura {
  id: string;
  data_vencimento: string;
  data_pagamento?: string;
  valor: number;
  status: 'pendente' | 'pago' | 'vencido';
  descricao?: string;
  forma_pagamento?: string;
}

interface ListaFaturasProps {
  alunoId: string;
  alunoName: string;
}

const ListaFaturas: React.FC<ListaFaturasProps> = ({ alunoId, alunoName }) => {
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFaturas = async () => {
      setIsLoading(true);
      try {
        // Aqui você pode ajustar a query conforme sua estrutura de banco
        const { data, error } = await supabase
          .from("financeiro") // Usando a tabela financeiro existente
          .select("*")
          .eq("cliente_id", alunoId)
          .in("tipo", ["pagamento", "mensalidade", "taxa"]) // Ajuste conforme seus tipos
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Erro ao buscar faturas:", error);
          toast.error("Erro ao carregar lista de faturas");
        } else {
          // Transformar os dados para o formato esperado
          const faturasFormatadas = (data || []).map(item => ({
            id: item.id,
            data_vencimento: item.created_at, // Ajuste conforme sua estrutura
            data_pagamento: item.created_at,
            valor: item.valor,
            status: 'pago' as const, // Ajuste conforme sua lógica de status
            descricao: item.descricao,
            forma_pagamento: item.forma_pagamento
          }));
          setFaturas(faturasFormatadas);
        }
      } catch (error) {
        console.error("Erro inesperado:", error);
        toast.error("Erro inesperado ao carregar faturas");
      } finally {
        setIsLoading(false);
      }
    };

    if (alunoId) {
      fetchFaturas();
    }
  }, [alunoId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return { backgroundColor: '#d4edda', color: '#155724' };
      case 'pendente':
        return { backgroundColor: '#fff3cd', color: '#856404' };
      case 'vencido':
        return { backgroundColor: '#f8d7da', color: '#721c24' };
      default:
        return { backgroundColor: Styles.COLORS.backgroundLight, color: Styles.COLORS.textMuted };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pago': return 'Pago';
      case 'pendente': return 'Pendente';
      case 'vencido': return 'Vencido';
      default: return status;
    }
  };

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
          Lista de Faturas - {alunoName}
        </h3>
        <p style={{ margin: 0, color: Styles.COLORS.textMuted, fontSize: '0.875rem' }}>
          Histórico financeiro e pagamentos do aluno
        </p>
      </div>

      {faturas.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          color: Styles.COLORS.textMuted 
        }}>
          <p>Nenhuma fatura encontrada para este aluno.</p>
        </div>
      ) : (
        <div style={{ 
          border: `1px solid ${Styles.COLORS.borderDefault}`,
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '120px 120px 100px 100px',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: Styles.COLORS.backgroundLight,
            fontWeight: '500',
            fontSize: '0.875rem',
            borderBottom: `1px solid ${Styles.COLORS.borderDefault}`
          }}>
            <div>Vencimento</div>
            <div>Pagamento</div>
            <div>Valor</div>
            <div>Status</div>
          </div>
          
          {faturas.map((fatura) => (
            <div
              key={fatura.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 120px 100px 100px',
                gap: '12px',
                padding: '12px 16px',
                borderBottom: `1px solid ${Styles.COLORS.borderDefault}`,
                fontSize: '0.875rem'
              }}
            >
              <div>{new Date(fatura.data_vencimento).toLocaleDateString('pt-BR')}</div>
              <div>
                {fatura.data_pagamento 
                  ? new Date(fatura.data_pagamento).toLocaleDateString('pt-BR')
                  : '-'
                }
              </div>
              <div style={{ fontWeight: '500' }}>{formatCurrency(fatura.valor)}</div>
              <div>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  ...getStatusColor(fatura.status)
                }}>
                  {getStatusLabel(fatura.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Styles.TabContent>
  );
};

export default ListaFaturas;
