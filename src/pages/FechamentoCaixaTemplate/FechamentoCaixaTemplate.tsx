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

  const handleTextChange = useCallback((campo: 'titulo' | 'subtitulo', value: string) => {
    setEditingTemplate(prev => ({
      ...prev,
      informacoes: {
        ...prev.informacoes,
        [campo]: value
      }
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

  const handleExcluirTemplate = useCallback((templateId: string) => {
    if (templateId === 'default') {
      toast.error('Não é possível excluir o template padrão');
      return;
    }
    
    if (window.confirm('Tem certeza que deseja excluir este template?')) {
      excluirTemplate(templateId);
      toast.success('Template excluído com sucesso!');
    }
  }, [excluirTemplate]);

  const renderPreview = () => {
    const { informacoes } = editingTemplate;

    return (
      <Styles.PreviewDocument>
        {/* Cabeçalho */}
        <Styles.PreviewHeader>
          <Styles.PreviewTitle>
            {informacoes.titulo}
          </Styles.PreviewTitle>
          {informacoes.subtitulo && (
            <Styles.PreviewSubtitle>
              {informacoes.subtitulo}
            </Styles.PreviewSubtitle>
          )}
          {informacoes.mostrarData && (
            <div style={{ marginTop: '10px', fontSize: '0.8em', color: '#666' }}>
              Data: {new Date().toLocaleDateString('pt-BR')}
            </div>
          )}
          {informacoes.mostrarUsuario && (
            <div style={{ fontSize: '0.8em', color: '#666' }}>
              Usuário: Admin
            </div>
          )}
        </Styles.PreviewHeader>

        {/* Resumo do Caixa */}
        <Styles.PreviewSection>
          <Styles.PreviewSectionTitle>Resumo do Caixa</Styles.PreviewSectionTitle>
          <div>
            {informacoes.mostrarNumeroCaixa && <p>Número do Caixa: 001</p>}
            {informacoes.mostrarDataAbertura && <p>Data de Abertura: 01/01/2024 08:00</p>}
            {informacoes.mostrarDataFechamento && <p>Data de Fechamento: 01/01/2024 18:00</p>}
            {informacoes.mostrarValorInicial && <p>Valor Inicial: R$ 100,00</p>}
            {informacoes.mostrarObservacoesAbertura && <p>Observações de Abertura: Caixa aberto normalmente</p>}
          </div>
        </Styles.PreviewSection>

        {/* Movimentações */}
        {informacoes.mostrarMovimentacoes && (
          <Styles.PreviewSection>
            <Styles.PreviewSectionTitle>Movimentações</Styles.PreviewSectionTitle>
            <div>
              <div style={{ borderBottom: '1px solid #eee', padding: '8px 0', fontSize: '0.9em' }}>
                {informacoes.mostrarTipoMovimentacao && 'Entrada'} - 
                {informacoes.mostrarDescricao && ' Pagamento de mensalidade'} - 
                {informacoes.mostrarClienteNome && ' João Silva'} - 
                {informacoes.mostrarFormaPagamento && ' PIX'} - 
                {informacoes.mostrarValor && ' R$ 150,00'}
              </div>
              <div style={{ borderBottom: '1px solid #eee', padding: '8px 0', fontSize: '0.9em' }}>
                {informacoes.mostrarTipoMovimentacao && 'Entrada'} - 
                {informacoes.mostrarDescricao && ' Venda de material'} - 
                {informacoes.mostrarClienteNome && ' Maria Santos'} - 
                {informacoes.mostrarProdutoNome && ' Apostila'} - 
                {informacoes.mostrarFormaPagamento && ' Dinheiro'} - 
                {informacoes.mostrarValor && ' R$ 80,00'}
              </div>
              <div style={{ borderBottom: '1px solid #eee', padding: '8px 0', fontSize: '0.9em' }}>
                {informacoes.mostrarTipoMovimentacao && 'Saída'} - 
                {informacoes.mostrarDescricao && ' Compra de lanche'} - 
                {informacoes.mostrarFormaPagamento && ' Dinheiro'} - 
                {informacoes.mostrarValor && ' R$ 25,00'}
              </div>
            </div>
          </Styles.PreviewSection>
        )}

        {/* Totais */}
        <Styles.PreviewSection>
          <Styles.PreviewSectionTitle>Totais</Styles.PreviewSectionTitle>
          <div>
            {informacoes.mostrarTotalEntradas && <p>Total de Entradas: R$ 230,00</p>}
            {informacoes.mostrarTotalSaidas && <p>Total de Saídas: R$ 25,00</p>}
            {informacoes.mostrarSaldoFinal && <p><strong>Saldo Final: R$ 305,00</strong></p>}
          </div>
        </Styles.PreviewSection>

        {/* Rodapé */}
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #ccc' }}>
          {informacoes.mostrarObservacoesFechamento && (
            <div style={{ marginBottom: '20px' }}>
              <strong>Observações de Fechamento:</strong>
              <div style={{ marginTop: '5px', minHeight: '40px', border: '1px solid #ddd', padding: '10px' }}>
                [Campo para observações de fechamento]
              </div>
            </div>
          )}
          
          {informacoes.mostrarAssinaturas && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ textAlign: 'center', width: '200px' }}>
                  <div style={{ borderTop: '1px solid #000', marginTop: '50px', paddingTop: '5px' }}>
                    Assinatura do Responsável
                  </div>
                </div>
                <div style={{ textAlign: 'center', width: '200px' }}>
                  <div style={{ borderTop: '1px solid #000', marginTop: '50px', paddingTop: '5px' }}>
                    Assinatura do Gerente
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {informacoes.mostrarDataGeracao && (
            <div style={{ textAlign: 'center', fontSize: '0.8em', color: '#666' }}>
              Documento gerado em: {new Date().toLocaleString('pt-BR')}
            </div>
          )}
        </div>
      </Styles.PreviewDocument>
    );
  };

  return (
    <Styles.Container>
      <Styles.Header>
        <Styles.Title>Gestão de Templates - Fechamento de Caixa</Styles.Title>
        <Styles.Subtitle>Configure e personalize o formato dos documentos de fechamento</Styles.Subtitle>
      </Styles.Header>

      <Styles.ContentWrapper>
        <Styles.EditorSection>
          {/* Seletor de Template */}
          <Styles.TemplateSelector>
            <Styles.Label>Template Ativo</Styles.Label>
            <Styles.TemplateGrid>
              {templates.map(template => (
                <Styles.TemplateCard
                  key={template.id}
                  $isActive={template.id === editingTemplate.id}
                  onClick={() => handleSelecionarTemplate(template)}
                >
                  <h4>{template.nome}</h4>
                  <p>{template.id === 'default' ? 'Padrão' : 'Personalizado'}</p>
                </Styles.TemplateCard>
              ))}
            </Styles.TemplateGrid>
          </Styles.TemplateSelector>

          {/* Nome do Template */}
          <Styles.FormGroup>
            <Styles.Label>Nome do Template</Styles.Label>
            <Styles.Input
              type="text"
              value={editingTemplate.nome}
              onChange={(e) => setEditingTemplate(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Template Personalizado"
            />
          </Styles.FormGroup>

          {/* Configurações do Cabeçalho */}
          <Styles.FieldGroup>
            <Styles.FieldGroupTitle>Cabeçalho</Styles.FieldGroupTitle>
            
            <Styles.FormGroup>
              <Styles.Label>Título</Styles.Label>
              <Styles.Input
                type="text"
                value={editingTemplate.informacoes.titulo}
                onChange={(e) => handleTextChange('titulo', e.target.value)}
              />
            </Styles.FormGroup>

            {editingTemplate.informacoes.subtitulo !== undefined && (
              <Styles.FormGroup>
                <Styles.Label>Subtítulo</Styles.Label>
                <Styles.Input
                  type="text"
                  value={editingTemplate.informacoes.subtitulo || ''}
                  onChange={(e) => handleTextChange('subtitulo', e.target.value)}
                />
              </Styles.FormGroup>
            )}

            <Styles.CheckboxGroup>
              <Styles.CheckboxItem>
                <Styles.Checkbox
                  type="checkbox"
                  id="mostrarData"
                  checked={editingTemplate.informacoes.mostrarData}
                  onChange={(e) => handleCheckboxChange('mostrarData', e.target.checked)}
                />
                <Styles.CheckboxLabel htmlFor="mostrarData">Mostrar Data</Styles.CheckboxLabel>
              </Styles.CheckboxItem>

              <Styles.CheckboxItem>
                <Styles.Checkbox
                  type="checkbox"
                  id="mostrarUsuario"
                  checked={editingTemplate.informacoes.mostrarUsuario}
                  onChange={(e) => handleCheckboxChange('mostrarUsuario', e.target.checked)}
                />
                <Styles.CheckboxLabel htmlFor="mostrarUsuario">Mostrar Usuário</Styles.CheckboxLabel>
              </Styles.CheckboxItem>
            </Styles.CheckboxGroup>
          </Styles.FieldGroup>

          {/* Resumo do Caixa */}
          <Styles.FieldGroup>
            <Styles.FieldGroupTitle>Resumo do Caixa</Styles.FieldGroupTitle>
            <Styles.CheckboxGroup>
              <Styles.CheckboxItem>
                <Styles.Checkbox
                  type="checkbox"
                  id="mostrarNumeroCaixa"
                  checked={editingTemplate.informacoes.mostrarNumeroCaixa}
                  onChange={(e) => handleCheckboxChange('mostrarNumeroCaixa', e.target.checked)}
                />
                <Styles.CheckboxLabel htmlFor="mostrarNumeroCaixa">Número do Caixa</Styles.CheckboxLabel>
              </Styles.CheckboxItem>

              <Styles.CheckboxItem>
                <Styles.Checkbox
                  type="checkbox"
                  id="mostrarDataAbertura"
                  checked={editingTemplate.informacoes.mostrarDataAbertura}
                  onChange={(e) => handleCheckboxChange('mostrarDataAbertura', e.target.checked)}
                />
                <Styles.CheckboxLabel htmlFor="mostrarDataAbertura">Data de Abertura</Styles.CheckboxLabel>
              </Styles.CheckboxItem>

              <Styles.CheckboxItem>
                <Styles.Checkbox
                  type="checkbox"
                  id="mostrarDataFechamento"
                  checked={editingTemplate.informacoes.mostrarDataFechamento}
                  onChange={(e) => handleCheckboxChange('mostrarDataFechamento', e.target.checked)}
                />
                <Styles.CheckboxLabel htmlFor="mostrarDataFechamento">Data de Fechamento</Styles.CheckboxLabel>
              </Styles.CheckboxItem>

              <Styles.CheckboxItem>
                <Styles.Checkbox
                  type="checkbox"
                  id="mostrarValorInicial"
                  checked={editingTemplate.informacoes.mostrarValorInicial}
                  onChange={(e) => handleCheckboxChange('mostrarValorInicial', e.target.checked)}
                />
                <Styles.CheckboxLabel htmlFor="mostrarValorInicial">Valor Inicial</Styles.CheckboxLabel>
              </Styles.CheckboxItem>

              <Styles.CheckboxItem>
                <Styles.Checkbox
                  type="checkbox"
                  id="mostrarObservacoesAbertura"
                  checked={editingTemplate.informacoes.mostrarObservacoesAbertura}
                  onChange={(e) => handleCheckboxChange('mostrarObservacoesAbertura', e.target.checked)}
                />
                <Styles.CheckboxLabel htmlFor="mostrarObservacoesAbertura">Observações de Abertura</Styles.CheckboxLabel>
              </Styles.CheckboxItem>
            </Styles.CheckboxGroup>
          </Styles.FieldGroup>

          {/* Movimentações */}
          <Styles.FieldGroup>
            <Styles.FieldGroupTitle>Movimentações</Styles.FieldGroupTitle>
            <Styles.CheckboxGroup>
              <Styles.CheckboxItem>
                <Styles.Checkbox
                  type="checkbox"
                  id="mostrarMovimentacoes"
                  checked={editingTemplate.informacoes.mostrarMovimentacoes}
                  onChange={(e) => handleCheckboxChange('mostrarMovimentacoes', e.target.checked)}
                />
                <Styles.CheckboxLabel htmlFor="mostrarMovimentacoes">Seção de Movimentações</Styles.CheckboxLabel>
              </Styles.CheckboxItem>

              <Styles.CheckboxItem>
                <Styles.Checkbox
                  type="checkbox"
                  id="mostrarTipoMovimentacao"
                  checked={editingTemplate.informacoes.mostrarTipoMovimentacao}
                  onChange={(e) => handleCheckboxChange('mostrarTipoMovimentacao', e.target.checked)}
                />
                <Styles.CheckboxLabel htmlFor="mostrarTipoMovimentacao">Tipo de Movimentação</Styles.CheckboxLabel>
              </Styles.CheckboxItem>

              <Styles.CheckboxItem>
                <Styles.Checkbox
                  type="checkbox"
                  id="mostrarDescricao"
                  checked={editingTemplate.informacoes.mostrarDescricao}
                  onChange={(e) => handleCheckboxChange('mostrarDescricao', e.target.checked)}
                />
                <Styles.CheckboxLabel htmlFor="mostrarDescricao">Descrição</Styles.CheckboxLabel>
              </Styles.CheckboxItem>

              <Styles.CheckboxItem>
                <Styles.Checkbox
                  type="checkbox"
                  id="mostrarFormaPagamento"
                  checked={editingTemplate.informacoes.mostrarFormaPagamento}
                  onChange={(e) => handleCheckboxChange('mostrarFormaPagamento', e.target.checked)}
                />
                <Styles.CheckboxLabel htmlFor="mostrarFormaPagamento">Forma de Pagamento</Styles.CheckboxLabel>
              </Styles.CheckboxItem>

              <Styles.CheckboxItem>
                <Styles.Checkbox
                  type="checkbox"
                  id="mostrarValor"
                  checked={editingTemplate.informacoes.mostrarValor}
                  onChange={(e) => handleCheckboxChange('mostrarValor', e.target.checked)}
                />
                <Styles.CheckboxLabel htmlFor="mostrarValor">Valor</Styles.CheckboxLabel>
              </Styles.CheckboxItem>

              <Styles.CheckboxItem>
                <Styles.Checkbox
                  type="checkbox"
                  id="mostrarClienteNome"
                  checked={editingTemplate.informacoes.mostrarClienteNome}
                  onChange={(e) => handleCheckboxChange('mostrarClienteNome', e.target.checked)}
                />
                <Styles.CheckboxLabel htmlFor="mostrarClienteNome">Nome do Cliente</Styles.CheckboxLabel>
              </Styles.CheckboxItem>

              <Styles.CheckboxItem>
                <Styles.Checkbox
                  type="checkbox"
                  id="mostrarProdutoNome"
                  checked={editingTemplate.informacoes.mostrarProdutoNome}
                  onChange={(e) => handleCheckboxChange('mostrarProdutoNome', e.target.checked)}
                />
                <Styles.CheckboxLabel htmlFor="mostrarProdutoNome">Nome do Produto</Styles.CheckboxLabel>
              </Styles.CheckboxItem>
            </Styles.CheckboxGroup>
          </Styles.FieldGroup>

          {/* Totais */}
          <Styles.FieldGroup>
            <Styles.FieldGroupTitle>Totais</Styles.FieldGroupTitle>
            <Styles.CheckboxGroup>
              <Styles.CheckboxItem>
                <Styles.Checkbox
                  type="checkbox"
                  id="mostrarTotalEntradas"
                  checked={editingTemplate.informacoes.mostrarTotalEntradas}
                  onChange={(e) => handleCheckboxChange('mostrarTotalEntradas', e.target.checked)}
                />
                <Styles.CheckboxLabel htmlFor="mostrarTotalEntradas">Total de Entradas</Styles.CheckboxLabel>
              </Styles.CheckboxItem>

              <Styles.CheckboxItem>
                <Styles.Checkbox
                  type="checkbox"
                  id="mostrarTotalSaidas"
                  checked={editingTemplate.informacoes.mostrarTotalSaidas}
                  onChange={(e) => handleCheckboxChange('mostrarTotalSaidas', e.target.checked)}
                />
                <Styles.CheckboxLabel htmlFor="mostrarTotalSaidas">Total de Saídas</Styles.CheckboxLabel>
              </Styles.CheckboxItem>

              <Styles.CheckboxItem>
                <Styles.Checkbox
                  type="checkbox"
                  id="mostrarSaldoFinal"
                  checked={editingTemplate.informacoes.mostrarSaldoFinal}
                  onChange={(e) => handleCheckboxChange('mostrarSaldoFinal', e.target.checked)}
                />
                <Styles.CheckboxLabel htmlFor="mostrarSaldoFinal">Saldo Final</Styles.CheckboxLabel>
              </Styles.CheckboxItem>
            </Styles.CheckboxGroup>
          </Styles.FieldGroup>

          {/* Rodapé */}
          <Styles.FieldGroup>
            <Styles.FieldGroupTitle>Rodapé</Styles.FieldGroupTitle>
            <Styles.CheckboxGroup>
              <Styles.CheckboxItem>
                <Styles.Checkbox
                  type="checkbox"
                  id="mostrarObservacoesFechamento"
                  checked={editingTemplate.informacoes.mostrarObservacoesFechamento}
                  onChange={(e) => handleCheckboxChange('mostrarObservacoesFechamento', e.target.checked)}
                />
                <Styles.CheckboxLabel htmlFor="mostrarObservacoesFechamento">Observações de Fechamento</Styles.CheckboxLabel>
              </Styles.CheckboxItem>

              <Styles.CheckboxItem>
                <Styles.Checkbox
                  type="checkbox"
                  id="mostrarAssinaturas"
                  checked={editingTemplate.informacoes.mostrarAssinaturas}
                  onChange={(e) => handleCheckboxChange('mostrarAssinaturas', e.target.checked)}
                />
                <Styles.CheckboxLabel htmlFor="mostrarAssinaturas">Campo de Assinaturas</Styles.CheckboxLabel>
              </Styles.CheckboxItem>

              <Styles.CheckboxItem>
                <Styles.Checkbox
                  type="checkbox"
                  id="mostrarDataGeracao"
                  checked={editingTemplate.informacoes.mostrarDataGeracao}
                  onChange={(e) => handleCheckboxChange('mostrarDataGeracao', e.target.checked)}
                />
                <Styles.CheckboxLabel htmlFor="mostrarDataGeracao">Data de Geração</Styles.CheckboxLabel>
              </Styles.CheckboxItem>
            </Styles.CheckboxGroup>
          </Styles.FieldGroup>

          {/* Botões de Ação */}
          <Styles.ButtonGroup>
            <Styles.Button $variant="primary" onClick={handleSalvar}>
              Salvar Template
            </Styles.Button>
            
            <Styles.Button onClick={resetToDefault}>
              Resetar Padrão
            </Styles.Button>
            
            {editingTemplate.id !== 'default' && (
              <Styles.Button $variant="danger" onClick={() => handleExcluirTemplate(editingTemplate.id)}>
                Excluir Template
              </Styles.Button>
            )}
          </Styles.ButtonGroup>
        </Styles.EditorSection>

        <Styles.PreviewPanel>
          <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Preview do Documento</h3>
          {renderPreview()}
        </Styles.PreviewPanel>
      </Styles.ContentWrapper>

      <ToastContainer autoClose={3000} hideProgressBar />
    </Styles.Container>
  );
};

export default FechamentoCaixaTemplatePage;
