import React, { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import * as Styles from "../MatriculaForm/MatriculaForm.styles";

interface FrequenciaData {
  Id: number;
  data: string;
  hora: string;
  idAluno: number;
}

interface FrequenciaFormProps {
  alunoId: string;
}

// Função para formatar data que vem como texto do banco
function formatFrequenciaDate(dataTexto: string): string {
  if (!dataTexto) return "Data não disponível";
  
  const cleanData = String(dataTexto).trim();
  
  // Tenta converter para Date primeiro
  const dateObj = parseDataParaOrdenacao(cleanData);
  
  // Se conseguiu converter, formata no padrão brasileiro
  if (!isNaN(dateObj.getTime()) && dateObj.getFullYear() > 1900) {
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear().toString();
    return `${day}/${month}/${year}`;
  }
  
  // Se não conseguiu, tenta formatar manualmente
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
  
  // Se nada funcionar, retorna o valor original
  return cleanData;
}

// Função para converter data texto em Date para ordenação
function parseDataParaOrdenacao(dataTexto: string): Date {
  if (!dataTexto) return new Date(0); // Data mínima para itens inválidos
  
  const cleanData = String(dataTexto).trim();
  
  // Se está no formato brasileiro (dd/mm/yyyy)
  if (cleanData.includes('/')) {
    const parts = cleanData.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  }
  
  // Se está no formato ISO (yyyy-mm-dd)
  if (cleanData.includes('-')) {
    return new Date(cleanData);
  }
  
  // Tenta fazer parse direto
  const date = new Date(cleanData);
  return isNaN(date.getTime()) ? new Date(0) : date;
}

// Função para formatar hora que vem como texto do banco
function formatFrequenciaHora(horaTexto: string): string {
  if (!horaTexto) return "Hora não disponível";
  
  // Remove espaços extras
  const cleanHora = String(horaTexto).trim();
  
  // Se já está no formato HH:MM ou HH:MM:SS, mantém
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(cleanHora)) {
    const parts = cleanHora.split(':');
    const horas = parts[0].padStart(2, '0');
    const minutos = parts[1].padStart(2, '0');
    return `${horas}:${minutos}`;
  }
  
  // Se não está formatado, retorna o valor original
  return cleanHora;
}

// Função para buscar frequências do aluno
async function fetchFrequenciasByAluno(alunoId: string): Promise<FrequenciaData[]> {
  if (!alunoId) return [];
  
  const { data, error } = await supabase
    .from("frequencia_old")
    .select("Id, data, hora, idAluno")
    .eq("idAluno", parseInt(alunoId));
  
  if (error) {
    console.error("FrequenciaForm: Erro ao buscar frequências:", error.message);
    return [];
  }
  
  return data || [];
}

const FrequenciaForm: React.FC<FrequenciaFormProps> = ({ alunoId }) => {
  const [frequencias, setFrequencias] = useState<FrequenciaData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadFrequencias = async () => {
      if (!alunoId) return;
      
      setIsLoading(true);
      try {
        const frequenciasData = await fetchFrequenciasByAluno(alunoId);
        
        // Ordenar manualmente por data (mais recente primeiro)
        const frequenciasOrdenadas = frequenciasData.sort((a, b) => {
          const dataA = parseDataParaOrdenacao(a.data);
          const dataB = parseDataParaOrdenacao(b.data);
          return dataB.getTime() - dataA.getTime(); // Decrescente (mais recente primeiro)
        });
        
        setFrequencias(frequenciasOrdenadas);
        console.log("FrequenciaForm DEBUG - frequencias carregadas:", frequenciasData);
        console.log("FrequenciaForm DEBUG - frequencias ordenadas:", frequenciasOrdenadas);
        
        // Debug detalhado das datas e ordenação
        if (frequenciasOrdenadas.length > 0) {
          console.log("FrequenciaForm DEBUG - Análise das primeiras 3 frequências:");
          frequenciasOrdenadas.slice(0, 3).forEach((freq, index) => {
            console.log(`${index + 1}. Data original:`, freq.data);
            console.log(`${index + 1}. Data parseada:`, parseDataParaOrdenacao(freq.data));
            console.log(`${index + 1}. Data formatada:`, formatFrequenciaDate(freq.data));
            console.log(`${index + 1}. Hora:`, formatFrequenciaHora(freq.hora));
            console.log("---");
          });
        }
      } catch (error) {
        console.error("Erro ao carregar frequências:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFrequencias();
  }, [alunoId]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
        <div>Carregando frequências...</div>
      </div>
    );
  }

  return (
    <div>
      <Styles.SectionTitle style={{ marginTop: "0", fontSize: "1.1rem" }}>
        Histórico de Frequência
      </Styles.SectionTitle>

      {frequencias.length === 0 ? (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#6c757d',
          fontStyle: 'italic'
        }}>
          Nenhuma frequência registrada para este aluno.
        </div>
      ) : (
        <div style={{ 
          maxHeight: '300px', 
          overflowY: 'auto',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          backgroundColor: '#fff'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '20px',
            padding: '10px 15px',
            borderBottom: '1px solid #dee2e6',
            fontWeight: '500',
            backgroundColor: '#f8f9fa',
            color: '#495057',
            fontSize: '0.9rem'
          }}>
            <div>Data</div>
            <div>Horário</div>
          </div>

          {frequencias.map((freq) => (
            <div
              key={freq.Id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '20px',
                padding: '8px 15px',
                borderBottom: '1px solid #e9ecef'
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '0.9rem',
                color: '#212529'
              }}>
                {formatFrequenciaDate(freq.data)}
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '0.9rem',
                fontFamily: 'monospace',
                color: '#495057'
              }}>
                {formatFrequenciaHora(freq.hora)}
              </div>
            </div>
          ))}
        </div>
      )}

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
            <span style={{ color: '#6c757d' }}>Total de presenças:</span>
            <strong style={{ marginLeft: '8px', color: '#495057' }}>{frequencias.length}</strong>
          </div>
          {frequencias.length > 0 && (
            <>
              <div>
                <span style={{ color: '#6c757d' }}>Primeira:</span>
                <strong style={{ marginLeft: '8px', color: '#495057' }}>
                  {formatFrequenciaDate(frequencias[frequencias.length - 1]?.data)}
                </strong>
              </div>
              <div>
                <span style={{ color: '#6c757d' }}>Última:</span>
                <strong style={{ marginLeft: '8px', color: '#495057' }}>
                  {formatFrequenciaDate(frequencias[0]?.data)}
                </strong>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FrequenciaForm;