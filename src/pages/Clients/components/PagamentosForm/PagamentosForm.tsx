import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import * as Styles from "../MatriculaForm/MatriculaForm.styles";

interface RecebimentoData {
  recebID: number;
  planoID: number | null;
  alunoID: number | null;
  contaID: number | null;
  recebDtVencimento: string | null;
  recebValor: string | null;
  recebMulta: string | null;
  recebPago: boolean | null;
  recebHistorico: string | null;
  recebExcluido: boolean | null;
  recebDtEmissao: string | null;
  funcID: number | null;
}

interface PagamentosFormProps {
  alunoId: string;
}

// Função para converter data texto em Date para ordenação
function parseDataParaOrdenacao(dataTexto: string | null): Date {
  if (!dataTexto) return new Date(0);
  
  const cleanData = String(dataTexto).trim();
  
  // Formato brasileiro (dd/mm/yyyy)
  if (cleanData.includes('/')) {
    const parts = cleanData.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  }
  
  // Formato ISO (yyyy-mm-dd)
  if (cleanData.includes('-')) {
    return new Date(cleanData);
  }
  
  // Parse direto
  const date = new Date(cleanData);
  return isNaN(date.getTime()) ? new Date(0) : date;
}

// Função para formatar data
function formatPagamentoDate(dataTexto: string | null): string {
  if (!dataTexto) return "Data não disponível";
  
  const cleanData = String(dataTexto).trim();
  const dateObj = parseDataParaOrdenacao(cleanData);
  
  if (!isNaN(dateObj.getTime()) && dateObj.getFullYear() > 1900) {
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear().toString();
    return `${day}/${month}/${year}`;
  }
  
  if (cleanData.includes('/')) {
    const parts = cleanData.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
  }
  
  if (cleanData.includes('-')) {
    const parts = cleanData.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
  }
  
  return cleanData;
}

// Função para formatar valor monetário
function formatValorMonetario(valor: string | null): string {
  if (!valor) return "R$ 0,00";
  
  const cleanValue = String(valor).trim().replace(',', '.');
  const numericValue = parseFloat(cleanValue);
  
  if (isNaN(numericValue)) return "R$ 0,00";
  
  return numericValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

// Função para buscar recebimentos do aluno
async function fetchRecebimentosByAluno(alunoId: string): Promise<RecebimentoData[]> {
  if (!alunoId) return [];
  
  const { data, error } = await supabase
    .from("recebimentos_old")
    .select("*")
    .eq("alunoID", parseInt(alunoId))
    .eq("recebExcluido", false);
  
  if (error) {
    console.error("PagamentosForm: Erro ao buscar recebimentos:", error.message);
    return [];
  }
  
  return data || [];
}

const PagamentosForm: React.FC<PagamentosFormProps> = ({ alunoId }) => {
  const [recebimentos, setRecebimentos] = useState<RecebimentoData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadRecebimentos = async () => {
      if (!alunoId) return;
      
      setIsLoading(true);
      try {
        const recebimentosData = await fetchRecebimentosByAluno(alunoId);
        
        // Ordenar por data de vencimento (mais recente primeiro)
        const recebimentosOrdenados = recebimentosData.sort((a, b) => {
          const dataA = parseDataParaOrdenacao(a.recebDtVencimento);
          const dataB = parseDataParaOrdenacao(b.recebDtVencimento);
          return dataB.getTime() - dataA.getTime();
        });
        
        setRecebimentos(recebimentosOrdenados);
        console.log("PagamentosForm DEBUG - recebimentos carregados:", recebimentosData);
        console.log("PagamentosForm DEBUG - recebimentos ordenados:", recebimentosOrdenados);
        
        // Debug detalhado dos primeiros registros
        if (recebimentosOrdenados.length > 0) {
          console.log("PagamentosForm DEBUG - Análise dos primeiros 3 recebimentos:");
          recebimentosOrdenados.slice(0, 3).forEach((receb, index) => {
            console.log(`${index + 1}. Vencimento original:`, receb.recebDtVencimento);
            console.log(`${index + 1}. Vencimento parseado:`, parseDataParaOrdenacao(receb.recebDtVencimento));
            console.log(`${index + 1}. Vencimento formatado:`, formatPagamentoDate(receb.recebDtVencimento));
            console.log(`${index + 1}. Valor:`, formatValorMonetario(receb.recebValor));
            console.log(`${index + 1}. Status:`, receb.recebPago ? 'PAGO' : 'PENDENTE');
            console.log("---");
          });
        }
      } catch (error) {
        console.error("Erro ao carregar recebimentos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecebimentos();
  }, [alunoId]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
        <div>Carregando pagamentos...</div>
      </div>
    );
  }

  const recebimentosPagos = recebimentos.filter(r => r.recebPago === true);
  const recebimentosPendentes = recebimentos.filter(r => r.recebPago !== true);
  const valorTotalPago = recebimentosPagos.reduce((total, r) => {
    const valor = parseFloat(String(r.recebValor || '0').replace(',', '.'));
    return total + (isNaN(valor) ? 0 : valor);
  }, 0);
  const valorTotalPendente = recebimentosPendentes.reduce((total, r) => {
    const valor = parseFloat(String(r.recebValor || '0').replace(',', '.'));
    return total + (isNaN(valor) ? 0 : valor);
  }, 0);

  return (
    <div>
      <Styles.SectionTitle style={{ marginTop: "0", fontSize: "1.1rem" }}>
        Histórico de Pagamentos
      </Styles.SectionTitle>

      {recebimentos.length === 0 ? (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#6c757d',
          fontStyle: 'italic'
        }}>
          Nenhum pagamento registrado para este aluno.
        </div>
      ) : (
        <div style={{ 
          maxHeight: '350px', 
          overflowY: 'auto',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          backgroundColor: '#fff'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto auto',
            gap: '15px',
            padding: '10px 15px',
            borderBottom: '1px solid #dee2e6',
            fontWeight: '500',
            backgroundColor: '#f8f9fa',
            color: '#495057',
            fontSize: '0.9rem'
          }}>
            <div>Vencimento</div>
            <div>Valor</div>
            <div>Multa</div>
            <div>Status</div>
          </div>

          {recebimentos.map((receb) => (
            <div
              key={receb.recebID}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto auto',
                gap: '15px',
                padding: '8px 15px',
                borderBottom: '1px solid #e9ecef',
                backgroundColor: receb.recebPago ? '#f8fff8' : '#fff8f8'
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '0.9rem',
                color: '#212529'
              }}>
                {formatPagamentoDate(receb.recebDtVencimento)}
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#495057'
              }}>
                {formatValorMonetario(receb.recebValor)}
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '0.9rem',
                color: '#6c757d'
              }}>
                {receb.recebMulta && parseFloat(String(receb.recebMulta).replace(',', '.')) > 0 
                  ? formatValorMonetario(receb.recebMulta) 
                  : '-'
                }
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center'
              }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  backgroundColor: receb.recebPago ? '#d4edda' : '#f8d7da',
                  color: receb.recebPago ? '#155724' : '#721c24',
                  border: `1px solid ${receb.recebPago ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                  {receb.recebPago ? 'PAGO' : 'PENDENTE'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estatísticas */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        fontSize: '0.9rem'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '15px' 
        }}>
          <div>
            <span style={{ color: '#6c757d' }}>Total de pagamentos:</span>
            <strong style={{ marginLeft: '8px', color: '#495057' }}>{recebimentos.length}</strong>
          </div>
          <div>
            <span style={{ color: '#6c757d' }}>Realizados:</span>
            <strong style={{ marginLeft: '8px', color: '#28a745' }}>{recebimentosPagos.length}</strong>
          </div>
          <div>
            <span style={{ color: '#6c757d' }}>Pendentes:</span>
            <strong style={{ marginLeft: '8px', color: '#dc3545' }}>{recebimentosPendentes.length}</strong>
          </div>
          <div>
            <span style={{ color: '#6c757d' }}>Valor total pago:</span>
            <strong style={{ marginLeft: '8px', color: '#28a745' }}>
              {valorTotalPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </strong>
          </div>
          <div>
            <span style={{ color: '#6c757d' }}>Valor total pendente:</span>
            <strong style={{ marginLeft: '8px', color: '#dc3545' }}>
              {valorTotalPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PagamentosForm;