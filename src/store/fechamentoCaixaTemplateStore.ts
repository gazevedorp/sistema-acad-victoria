import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FechamentoCaixaTemplate {
  id: string;
  nome: string;
  informacoes: {
    // Cabeçalho
    titulo: string;
    subtitulo?: string;
    mostrarData: boolean;
    mostrarUsuario: boolean;
    
    // Resumo do Caixa
    mostrarNumeroCaixa: boolean;
    mostrarDataAbertura: boolean;
    mostrarDataFechamento: boolean;
    mostrarValorInicial: boolean;
    mostrarObservacoesAbertura: boolean;
    
    // Movimentações  
    mostrarMovimentacoes: boolean;
    mostrarTipoMovimentacao: boolean;
    mostrarDescricao: boolean;
    mostrarFormaPagamento: boolean;
    mostrarValor: boolean;
    mostrarClienteNome: boolean;
    mostrarProdutoNome: boolean;
    
    // Totais
    mostrarTotalEntradas: boolean;
    mostrarTotalSaidas: boolean;
    mostrarSaldoFinal: boolean;
    
    // Rodapé
    mostrarObservacoesFechamento: boolean;
    mostrarAssinaturas: boolean;
    mostrarDataGeracao: boolean;
  };
}

const templatePadrao: FechamentoCaixaTemplate = {
  id: 'default',
  nome: 'Formato Padrão',
  informacoes: {
    // Cabeçalho
    titulo: 'Relatório de Fechamento de Caixa',
    subtitulo: 'Sistema Academia Victória',
    mostrarData: true,
    mostrarUsuario: true,
    
    // Resumo do Caixa
    mostrarNumeroCaixa: true,
    mostrarDataAbertura: true,
    mostrarDataFechamento: true,
    mostrarValorInicial: true,
    mostrarObservacoesAbertura: true,
    
    // Movimentações
    mostrarMovimentacoes: true,
    mostrarTipoMovimentacao: true,
    mostrarDescricao: true,
    mostrarFormaPagamento: true,
    mostrarValor: true,
    mostrarClienteNome: true,
    mostrarProdutoNome: true,
    
    // Totais
    mostrarTotalEntradas: true,
    mostrarTotalSaidas: true,
    mostrarSaldoFinal: true,
    
    // Rodapé
    mostrarObservacoesFechamento: true,
    mostrarAssinaturas: true,
    mostrarDataGeracao: true,
  },
};

interface FechamentoCaixaTemplateStore {
  templateAtivo: FechamentoCaixaTemplate;
  templates: FechamentoCaixaTemplate[];
  setTemplateAtivo: (template: FechamentoCaixaTemplate) => void;
  salvarTemplate: (template: FechamentoCaixaTemplate) => void;
  excluirTemplate: (templateId: string) => void;
  resetToDefault: () => void;
}

export const useFechamentoCaixaTemplateStore = create<FechamentoCaixaTemplateStore>()(
  persist(
    (set, get) => ({
      templateAtivo: templatePadrao,
      templates: [templatePadrao],
      
      setTemplateAtivo: (template) => set({ templateAtivo: template }),
      
      salvarTemplate: (template) => {
        const { templates } = get();
        const novoTemplate = { ...template, id: template.id || Date.now().toString() };
        
        const templatesAtualizados = templates.some(t => t.id === novoTemplate.id)
          ? templates.map(t => t.id === novoTemplate.id ? novoTemplate : t)
          : [...templates, novoTemplate];
        
        set({ 
          templates: templatesAtualizados,
          templateAtivo: novoTemplate 
        });
      },
      
      excluirTemplate: (templateId) => {
        if (templateId === 'default') return; // Não permitir excluir o padrão
        
        const { templates, templateAtivo } = get();
        const templatesAtualizados = templates.filter(t => t.id !== templateId);
        
        set({ 
          templates: templatesAtualizados,
          templateAtivo: templateAtivo.id === templateId ? templatePadrao : templateAtivo
        });
      },
      
      resetToDefault: () => set({ templateAtivo: templatePadrao }),
    }),
    {
      name: 'fechamento-caixa-template-storage',
      version: 1,
    }
  )
);
