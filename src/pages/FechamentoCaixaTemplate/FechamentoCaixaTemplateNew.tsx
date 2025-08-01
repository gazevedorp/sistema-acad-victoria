import React, { useState, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as Styles from './FechamentoCaixaTemplate.styles';
import { useFechamentoCaixaTemplateStore, FechamentoCaixaTemplate } from '../../store/fechamentoCaixaTemplateStore';

const FechamentoCaixaTemplatePage: React.FC = () => {
  const {
    templateAtivo,
    templates,
    setTemplateAtivo,
    salvarTemplate,
    excluirTemplate,
    resetToDefault
  } = useFechamentoCaixaTemplateStore();

  const [editingTemplate, setEditingTemplate] = useState<FechamentoCaixaTemplate>({ ...templateAtivo });

  const handleCheckboxChange = useCallback((campo: keyof FechamentoCaixaTemplate['informacoes'], checked: boolean) => {
    setEditingTemplate(prev => ({
      ...prev,
      informacoes: {
        ...prev.informacoes,
        [campo]: checked
      }
    }));
  }, []);

  const handleTextChange = useCallback((campo: keyof FechamentoCaixaTemplate['informacoes'], value: string) => {
    setEditingTemplate(prev => ({
      ...prev,
      informacoes: {
        ...prev.informacoes,
        [campo]: value
      }
    }));
  }, []);

  const handleNomeChange = useCallback((value: string) => {
    setEditingTemplate(prev => ({
      ...prev,
      nome: value
    }));
  }, []);

  const handleSalvar = useCallback(() => {
    const novoId = Date.now().toString();
    const templateParaSalvar = { 
      ...editingTemplate, 
      id: editingTemplate.id === 'default' ? novoId : editingTemplate.id,
      nome: editingTemplate.nome || `Template ${novoId}`
    };
    
    salvarTemplate(templateParaSalvar);
    setEditingTemplate(templateParaSalvar);
    toast.success('Template salvo com sucesso!');
  }, [editingTemplate, salvarTemplate]);

  const handleSelecionarTemplate = useCallback((template: FechamentoCaixaTemplate) => {
    setTemplateAtivo(template);
    setEditingTemplate({ ...template });
  }, [setTemplateAtivo]);

  const handleExcluir = useCallback((templateId: string) => {
    if (templateId === 'default') {
      toast.error('Não é possível excluir o template padrão');
      return;
    }
    excluirTemplate(templateId);
    toast.success('Template excluído com sucesso!');
  }, [excluirTemplate]);

  const renderPreview = useCallback(() => {
    const info = editingTemplate.informacoes;
    
    return (
      <Styles.PreviewDocument>
        <Styles.PreviewHeader>
          <Styles.PreviewTitle>{info.titulo}</Styles.PreviewTitle>
          {info.subtitulo && <Styles.PreviewSubtitle>{info.subtitulo}</Styles.PreviewSubtitle>}
          {info.mostrarData && (
            <div style={{ marginTop: '10px', fontSize: '0.8em', color: '#6c757d' }}>
              Data: 01/08/2025
            </div>
          )}
          {info.mostrarUsuario && (
            <div style={{ fontSize: '0.8em', color: '#6c757d' }}>
              Usuário: usuario@exemplo.com
            </div>
          )}
        </Styles.PreviewHeader>

        <div style={{ marginTop: '20px' }}>
          <Styles.PreviewSectionTitle>RESUMO DO CAIXA</Styles.PreviewSectionTitle>
          <div style={{ marginLeft: '10px', fontSize: '0.85em', lineHeight: '1.4' }}>
            {info.mostrarNumeroCaixa && <div>Caixa: Nº ABC12345</div>}
            {info.mostrarDataAbertura && <div>Abertura: 01/08/2025 08:00</div>}
            {info.mostrarDataFechamento && <div>Fechamento: 01/08/2025 18:00</div>}
            {info.mostrarValorInicial && <div>Valor Inicial: R$ 100,00</div>}
            {info.mostrarObservacoesAbertura && <div>Obs. Abertura: Exemplo de observação</div>}
          </div>
        </div>

        {info.mostrarMovimentacoes && (
          <div style={{ marginTop: '20px' }}>
            <Styles.PreviewSectionTitle>MOVIMENTAÇÕES</Styles.PreviewSectionTitle>
            <Styles.PreviewMovimentacao>
              {info.mostrarTipoMovimentacao && <span><strong>ENTRADA</strong></span>}
              {info.mostrarDescricao && <span> - Pagamento mensalidade</span>}
              {info.mostrarFormaPagamento && <span> - PIX</span>}
              {info.mostrarValor && <span> - R$ 150,00</span>}
              {info.mostrarClienteNome && <span> - João Silva</span>}
            </Styles.PreviewMovimentacao>
            <Styles.PreviewMovimentacao>
              {info.mostrarTipoMovimentacao && <span><strong>VENDA</strong></span>}
              {info.mostrarDescricao && <span> - Venda de produto</span>}
              {info.mostrarFormaPagamento && <span> - Dinheiro</span>}
              {info.mostrarValor && <span> - R$ 50,00</span>}
              {info.mostrarProdutoNome && <span> - Produto exemplo</span>}
            </Styles.PreviewMovimentacao>
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          <Styles.PreviewSectionTitle>TOTAIS</Styles.PreviewSectionTitle>
          <div style={{ marginLeft: '10px', fontSize: '0.85em', lineHeight: '1.4' }}>
            {info.mostrarTotalEntradas && <div>Total Entradas: R$ 200,00</div>}
            {info.mostrarTotalSaidas && <div>Total Saídas: R$ 50,00</div>}
            {info.mostrarSaldoFinal && <div><strong>Saldo Final: R$ 250,00</strong></div>}
          </div>
        </div>

        {info.mostrarObservacoesFechamento && (
          <div style={{ marginTop: '20px' }}>
            <Styles.PreviewSectionTitle>OBSERVAÇÕES</Styles.PreviewSectionTitle>
            <div style={{ marginLeft: '10px', fontSize: '0.85em' }}>
              Exemplo de observação de fechamento
            </div>
          </div>
        )}

        {info.mostrarAssinaturas && (
          <div style={{ marginTop: '30px', fontSize: '0.8em' }}>
            <div style={{ borderTop: '1px solid #000', width: '200px', marginBottom: '5px' }}></div>
            <div>Responsável pelo Caixa</div>
            <div style={{ borderTop: '1px solid #000', width: '200px', marginTop: '20px', marginBottom: '5px' }}></div>
            <div>Supervisor/Gerente</div>
          </div>
        )}

        {info.mostrarDataGeracao && (
          <div style={{ marginTop: '20px', fontSize: '0.7em', color: '#6c757d' }}>
            Documento gerado em 01/08/2025 18:30
          </div>
        )}
      </Styles.PreviewDocument>
    );
  }, [editingTemplate]);

  return (
    <Styles.Container>
      <Styles.Header>
        <Styles.Title>Configuração do Template de Fechamento de Caixa</Styles.Title>
      </Styles.Header>

      <Styles.Content>
        <Styles.ConfigPanel>
          <Styles.Section>
            <h3>Templates Salvos</h3>
            <div style={{ marginBottom: '15px' }}>
              <select 
                value={editingTemplate.id} 
                onChange={(e) => {
                  const template = templates.find(t => t.id === e.target.value);
                  if (template) handleSelecionarTemplate(template);
                }}
                style={{ width: '100%', padding: '8px', marginBottom: '5px' }}
              >
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.nome} {template.id === templateAtivo.id ? '(Ativo)' : ''}
                  </option>
                ))}
              </select>
              {editingTemplate.id !== 'default' && (
                <button 
                  onClick={() => handleExcluir(editingTemplate.id)}
                  style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '3px' }}
                >
                  Excluir Template
                </button>
              )}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Nome do Template:</label>
              <input
                type="text"
                value={editingTemplate.nome}
                onChange={(e) => handleNomeChange(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>
          </Styles.Section>

          <Styles.Section>
            <h3>Cabeçalho</h3>
            <div>
              <label>Título:</label>
              <input
                type="text"
                value={editingTemplate.informacoes.titulo}
                onChange={(e) => handleTextChange('titulo', e.target.value)}
                style={{ width: '100%', padding: '5px', marginTop: '2px' }}
              />
            </div>
            <div>
              <label>Subtítulo:</label>
              <input
                type="text"
                value={editingTemplate.informacoes.subtitulo || ''}
                onChange={(e) => handleTextChange('subtitulo', e.target.value)}
                style={{ width: '100%', padding: '5px', marginTop: '2px' }}
              />
            </div>
            <Styles.CheckboxGroup>
              <label>
                <input
                  type="checkbox"
                  checked={editingTemplate.informacoes.mostrarData}
                  onChange={(e) => handleCheckboxChange('mostrarData', e.target.checked)}
                />
                Mostrar Data
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={editingTemplate.informacoes.mostrarUsuario}
                  onChange={(e) => handleCheckboxChange('mostrarUsuario', e.target.checked)}
                />
                Mostrar Usuário
              </label>
            </Styles.CheckboxGroup>
          </Styles.Section>

          <Styles.Section>
            <h3>Resumo do Caixa</h3>
            <Styles.CheckboxGroup>
              <label>
                <input
                  type="checkbox"
                  checked={editingTemplate.informacoes.mostrarNumeroCaixa}
                  onChange={(e) => handleCheckboxChange('mostrarNumeroCaixa', e.target.checked)}
                />
                Número do Caixa
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={editingTemplate.informacoes.mostrarDataAbertura}
                  onChange={(e) => handleCheckboxChange('mostrarDataAbertura', e.target.checked)}
                />
                Data/Hora Abertura
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={editingTemplate.informacoes.mostrarDataFechamento}
                  onChange={(e) => handleCheckboxChange('mostrarDataFechamento', e.target.checked)}
                />
                Data/Hora Fechamento
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={editingTemplate.informacoes.mostrarValorInicial}
                  onChange={(e) => handleCheckboxChange('mostrarValorInicial', e.target.checked)}
                />
                Valor Inicial
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={editingTemplate.informacoes.mostrarObservacoesAbertura}
                  onChange={(e) => handleCheckboxChange('mostrarObservacoesAbertura', e.target.checked)}
                />
                Observações de Abertura
              </label>
            </Styles.CheckboxGroup>
          </Styles.Section>

          <Styles.Section>
            <h3>Movimentações</h3>
            <Styles.CheckboxGroup>
              <label>
                <input
                  type="checkbox"
                  checked={editingTemplate.informacoes.mostrarMovimentacoes}
                  onChange={(e) => handleCheckboxChange('mostrarMovimentacoes', e.target.checked)}
                />
                Mostrar Movimentações
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={editingTemplate.informacoes.mostrarTipoMovimentacao}
                  onChange={(e) => handleCheckboxChange('mostrarTipoMovimentacao', e.target.checked)}
                />
                Tipo da Movimentação
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={editingTemplate.informacoes.mostrarDescricao}
                  onChange={(e) => handleCheckboxChange('mostrarDescricao', e.target.checked)}
                />
                Descrição
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={editingTemplate.informacoes.mostrarFormaPagamento}
                  onChange={(e) => handleCheckboxChange('mostrarFormaPagamento', e.target.checked)}
                />
                Forma de Pagamento
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={editingTemplate.informacoes.mostrarValor}
                  onChange={(e) => handleCheckboxChange('mostrarValor', e.target.checked)}
                />
                Valor
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={editingTemplate.informacoes.mostrarClienteNome}
                  onChange={(e) => handleCheckboxChange('mostrarClienteNome', e.target.checked)}
                />
                Nome do Cliente
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={editingTemplate.informacoes.mostrarProdutoNome}
                  onChange={(e) => handleCheckboxChange('mostrarProdutoNome', e.target.checked)}
                />
                Nome do Produto
              </label>
            </Styles.CheckboxGroup>
          </Styles.Section>

          <Styles.Section>
            <h3>Totais</h3>
            <Styles.CheckboxGroup>
              <label>
                <input
                  type="checkbox"
                  checked={editingTemplate.informacoes.mostrarTotalEntradas}
                  onChange={(e) => handleCheckboxChange('mostrarTotalEntradas', e.target.checked)}
                />
                Total Entradas
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={editingTemplate.informacoes.mostrarTotalSaidas}
                  onChange={(e) => handleCheckboxChange('mostrarTotalSaidas', e.target.checked)}
                />
                Total Saídas
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={editingTemplate.informacoes.mostrarSaldoFinal}
                  onChange={(e) => handleCheckboxChange('mostrarSaldoFinal', e.target.checked)}
                />
                Saldo Final
              </label>
            </Styles.CheckboxGroup>
          </Styles.Section>

          <Styles.Section>
            <h3>Rodapé</h3>
            <Styles.CheckboxGroup>
              <label>
                <input
                  type="checkbox"
                  checked={editingTemplate.informacoes.mostrarObservacoesFechamento}
                  onChange={(e) => handleCheckboxChange('mostrarObservacoesFechamento', e.target.checked)}
                />
                Observações de Fechamento
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={editingTemplate.informacoes.mostrarAssinaturas}
                  onChange={(e) => handleCheckboxChange('mostrarAssinaturas', e.target.checked)}
                />
                Campos de Assinatura
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={editingTemplate.informacoes.mostrarDataGeracao}
                  onChange={(e) => handleCheckboxChange('mostrarDataGeracao', e.target.checked)}
                />
                Data de Geração
              </label>
            </Styles.CheckboxGroup>
          </Styles.Section>

          <Styles.ButtonGroup>
            <button onClick={handleSalvar} style={{ padding: '10px 20px', background: '#0898e6', color: 'white', border: 'none', borderRadius: '5px' }}>
              Salvar Template
            </button>
            <button 
              onClick={() => {
                setTemplateAtivo(editingTemplate);
                toast.success('Template ativado!');
              }}
              style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}
            >
              Ativar Template
            </button>
            <button 
              onClick={() => {
                resetToDefault();
                setEditingTemplate({ ...templateAtivo });
                toast.info('Template resetado para o padrão');
              }}
              style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px' }}
            >
              Resetar Padrão
            </button>
          </Styles.ButtonGroup>
        </Styles.ConfigPanel>

        <Styles.PreviewPanel>
          <h3>Pré-visualização</h3>
          {renderPreview()}
        </Styles.PreviewPanel>
      </Styles.Content>

      <ToastContainer position="top-right" autoClose={3000} />
    </Styles.Container>
  );
};

export default FechamentoCaixaTemplatePage;
