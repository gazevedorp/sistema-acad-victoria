export interface CategoriaPermissao {
  id: string;
  categoria_usuario: 'admin' | 'recepcao';
  modulo: string;
  permissao: 'visualizar' | 'criar' | 'editar' | 'excluir';
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CategoriaPermissaoFormData {
  categoria_usuario: 'admin' | 'recepcao';
  modulo: string;
  permissao: 'visualizar' | 'criar' | 'editar' | 'excluir';
  ativo: boolean;
}

export interface ModuloSistema {
  nome: string;
  label: string;
  descricao?: string;
}

// Lista dos módulos disponíveis no sistema
export const MODULOS_SISTEMA: ModuloSistema[] = [
  { nome: 'home', label: 'Dashboard', descricao: 'Página inicial do sistema' },
  { nome: 'clientes', label: 'Clientes', descricao: 'Gestão de clientes/alunos' },
  { nome: 'planos', label: 'Planos', descricao: 'Gestão de planos de modalidades' },
  { nome: 'modalidades', label: 'Modalidades', descricao: 'Gestão de modalidades' },
  { nome: 'turmas', label: 'Turmas', descricao: 'Gestão de turmas' },
  { nome: 'produtos', label: 'Produtos', descricao: 'Gestão de produtos' },
  { nome: 'usuarios', label: 'Usuários', descricao: 'Gestão de usuários do sistema' },
  { nome: 'caixa', label: 'Caixa', descricao: 'Operações de caixa' },
  { nome: 'relatorios', label: 'Relatórios', descricao: 'Relatórios do sistema' },
  { nome: 'permissoes', label: 'Permissões', descricao: 'Gestão de permissões' },
];

export const TIPOS_PERMISSAO = [
  { value: 'visualizar', label: 'Visualizar' },
  { value: 'criar', label: 'Criar' },
  { value: 'editar', label: 'Editar' },
  { value: 'excluir', label: 'Excluir' },
] as const;
